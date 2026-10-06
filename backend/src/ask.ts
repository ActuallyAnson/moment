import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {cutVideo, loadClip, readFrames} from './clips.ts';
import {parseAnswer} from './answer.ts';
import {ACTION_CHANGE_INSTRUCTION, ACTION_VIDEO_INSTRUCTION, DIALOGUE_INSTRUCTION, buildPrompt, PROMPT_VERSION, SYSTEM_PROMPT, SYSTEM_PROMPT_V3} from './prompt.ts';
import type {PromptVariant, PromptVersion} from './prompt.ts';
import {selectCues, selectFrames, DEFAULT_WINDOW} from './window.ts';
import type {WindowConfig} from './window.ts';
import type {VisionClient} from './bedrock.ts';
import {crossed, estimateCost, HARD_STOP_USD, logCost, totalSpent} from './cost.ts';
import {callWithRetry, DEFAULT_RETRY, PREFETCH_RETRY, UpstreamError} from './retry.ts';
import type {RetryOptions} from './retry.ts';
import {AnswerCache, cacheKey} from './cache.ts';

export class AskInputError extends Error {
  code: 'input' | 'clip';
  constructor(message: string, code: 'input' | 'clip' = 'input') {
    super(message);
    this.code = code;
  }
}

// Per-preset changes to the default configuration (selected by the exact question text).
export type PresetOverride = {lookbackSec?: number; maxFrames?: number; cueRadiusSec?: number; promptVariant?: PromptVariant; model?: string; videoSeconds?: number};

export type AskDeps = {
  client: VisionClient;
  clipsDir: string;
  costLogPath: string;
  window?: WindowConfig;
  defaultClip?: string;
  allowOverBudget?: boolean;
  cache?: AnswerCache;
  retry?: RetryOptions;
  promptVersion?: PromptVersion;
  dialogueMode?: 'verbatim' | 'model'; // how the dialogue preset is answered (default: verbatim from the subtitles, no model call)
  routeTextPreset?: boolean; // the 'What does the text say?' preset gets no dialogue at all
  noCache?: boolean; // the eval harness always bypasses the cache so latency numbers are real
  presetOverrides?: Record<string, PresetOverride>;
  clients?: Record<string, VisionClient>; // extra clients by model id, used when an override names a model
  inflight?: Map<string, Promise<AskResponse>>; // model calls in progress, keyed like the cache, so a viewer's /ask can join a prefetch
};

export type AskResponse = {
  answer: string;
  rawText?: string;
  latencyMs: number;
  framesUsed: number[];
  cuesUsed?: number;
  model: string;
  t: number;
  cached?: boolean;
  source?: 'live' | 'cache' | 'prefetch' | 'joined' | 'subtitles'; // where this answer came from (honest latency reporting)
  origin?: 'ask' | 'prefetch'; // who made the model call (stored with the cached entry)
  modelLatencyMs?: number; // the model call's own latency (differs from latencyMs on cache/prefetch hits)
  attempts?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export const TEXT_PRESET = 'What does the text say?';
export const DIALOGUE_PRESET = 'What did they just say?';
export const NO_SUBTITLES_ANSWER = "This video has no subtitles, so I can't show what was said.";
export const NO_DIALOGUE_ANSWER = 'No dialogue in the subtitles for the last 10 seconds.';
export const MAX_DIALOGUE_CHARS = 220;

// Variant A: the last (up to 3) subtitle lines, word for word, oldest first; never names a speaker. Exact by construction.
export const verbatimDialogue = (cues: {text: string}[]): string => {
  const lines = cues.slice(-3).map((c) => c.text.trim());
  let out = lines.map((l) => `"${l}"`).join(' ');
  while (out.length > MAX_DIALOGUE_CHARS && lines.length > 1) {
    lines.shift();
    out = lines.map((l) => `"${l}"`).join(' ');
  }
  if (out.length > MAX_DIALOGUE_CHARS) {
    out = `${out.slice(0, MAX_DIALOGUE_CHARS - 2).trimEnd()}…"`;
  }
  return `Someone said: ${out}`;
};
export const DEFAULT_PROMPT_VERSION: PromptVersion = 'v3'; // chosen by the Phase 3 eval

export const configHash = (cfg: WindowConfig, model: string, version: PromptVersion = 'v2', routed = false, variant?: PromptVariant): string =>
  createHash('sha256').update(JSON.stringify({cfg, model, version, routed, variant, instr: variant === 'dialogue' ? DIALOGUE_INSTRUCTION : variant ? ACTION_CHANGE_INSTRUCTION + ACTION_VIDEO_INSTRUCTION : '', system: version === 'v3' ? SYSTEM_PROMPT_V3 : SYSTEM_PROMPT, v: PROMPT_VERSION})).digest('hex').slice(0, 12);

// Accepts {clipId, timestamp, question}; also the Phase 1 shape {question, t}.
export const handleAsk = async (body: unknown, deps: AskDeps, ctx: {rid?: string; origin?: 'ask' | 'prefetch'} = {}): Promise<AskResponse> => {
  const origin = ctx.origin ?? 'ask';
  const b = (body ?? {}) as Record<string, unknown>;
  const question = b.question;
  const t = typeof b.timestamp === 'number' ? b.timestamp : b.t;
  const clipId = typeof b.clipId === 'string' ? b.clipId : (deps.defaultClip ?? 'tos');
  if (typeof question !== 'string' || !question.trim() || question.length > 300) {
    throw new AskInputError('question must be a non-empty string (max 300 chars)');
  }
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) {
    throw new AskInputError('timestamp must be a non-negative number of seconds');
  }
  let clip;
  try {
    clip = await loadClip(deps.clipsDir, clipId);
  } catch {
    throw new AskInputError(`unknown clip: ${clipId}`, 'clip');
  }

  const ov = deps.presetOverrides?.[question.trim()];
  const baseCfg = deps.window ?? DEFAULT_WINDOW;
  const cfg: WindowConfig = {...baseCfg, ...(ov?.lookbackSec !== undefined ? {lookbackSec: ov.lookbackSec} : {}), ...(ov?.maxFrames !== undefined ? {maxFrames: ov.maxFrames} : {}), ...(ov?.cueRadiusSec !== undefined ? {cueRadiusSec: ov.cueRadiusSec} : {})};
  const client: VisionClient = (ov?.model && deps.clients?.[ov.model]) || deps.client;
  const variant = ov?.promptVariant;
  const frames = selectFrames(clip.index.frames, t, cfg);
  const routedAway = (deps.routeTextPreset ?? true) && question.trim() === TEXT_PRESET;
  const cues = routedAway ? [] : selectCues(clip.cues, t, cfg.cueRadiusSec, cfg.cueAheadSec ?? cfg.cueRadiusSec);
  const version = deps.promptVersion ?? DEFAULT_PROMPT_VERSION;

  if (question.trim() === DIALOGUE_PRESET) {
    const dialogueCues = selectCues(clip.cues, t, cfg.cueRadiusSec, 0);
    if (!clip.hasSubtitles || dialogueCues.length === 0) {
      // No transcript to answer from: say so, without a model call (nothing can be invented, nothing is billed).
      return {answer: clip.hasSubtitles ? NO_DIALOGUE_ANSWER : NO_SUBTITLES_ANSWER, latencyMs: 0, framesUsed: [], cuesUsed: 0, model: 'subtitles', t, source: 'subtitles'};
    }
    if ((deps.dialogueMode ?? 'verbatim') === 'verbatim') {
      return {answer: verbatimDialogue(dialogueCues), latencyMs: 0, framesUsed: [], cuesUsed: dialogueCues.length, model: 'subtitles', t, source: 'subtitles'};
    }
  }

  const key = cacheKey({
    clipId,
    framePaths: frames.map((f) => f.path),
    cueTexts: cues.map((c) => c.text),
    question,
    configHash: configHash(cfg, ov?.model ?? (client.mode === 'live' ? 'live' : 'stub'), version, deps.routeTextPreset ?? true, variant),
  });
  if (deps.cache && !deps.noCache) {
    const hit = deps.cache.get(key);
    if (hit) {
      return {...hit, cached: true, source: hit.origin === 'prefetch' ? 'prefetch' : 'cache', modelLatencyMs: hit.modelLatencyMs ?? hit.latencyMs, latencyMs: 0, t};
    }
  }
  // Join a model call that is already running for the same context (e.g. a prefetch) instead of paying for a second one.
  if (deps.inflight && !deps.noCache && origin === 'ask') {
    const running = deps.inflight.get(key);
    if (running) {
      const waitStart = performance.now();
      try {
        const joined = await running;
        return {...joined, source: 'joined', cached: false, latencyMs: Math.round(performance.now() - waitStart), t};
      } catch {
        // the other call failed (e.g. a throttled prefetch): fall through and make our own call
      }
    }
  }

  const compute = async (): Promise<AskResponse> => {
    const prompt = buildPrompt({question, t, frames, cues}, version, variant);
    const videoSeconds = variant === 'action-video' ? (ov?.videoSeconds ?? 4) : 0;
    const images = videoSeconds ? [] : await readFrames(clip, frames);
    const video = videoSeconds ? await cutVideo(join(clip.dir, 'clip.mp4'), Math.max(0, t - videoSeconds), Math.min(videoSeconds, t) || 0.5) : undefined;

    const before = client.mode === 'live' ? await totalSpent(deps.costLogPath) : 0;
    if (before >= HARD_STOP_USD && !deps.allowOverBudget) {
      throw new UpstreamError(`budget guard: $${before.toFixed(2)} spent, live calls disabled`, 'budget', 0, false);
    }

    const started = performance.now();
    const {value: res, attempts} = await callWithRetry(
      (signal) => client.answer({system: prompt.system, user: prompt.user, images, video}, {signal}),
      (origin === 'prefetch' ? PREFETCH_RETRY : (deps.retry ?? DEFAULT_RETRY)),
    );
    const latencyMs = Math.round(performance.now() - started);

    let costUsd = 0;
    if (client.mode === 'live') {
      const cost = estimateCost(res.model, client.region, res.inputTokens, res.outputTokens);
      costUsd = cost ?? 0;
      await logCost(deps.costLogPath, {
        date: new Date().toISOString(),
        model: res.model,
        region: client.region,
        images: images.length + (video ? 1 : 0),
        inputTokens: res.inputTokens,
        outputTokens: res.outputTokens,
        estCostUsd: costUsd,
        note: `${ctx.rid ?? '-'} ${clipId}@${t.toFixed(1)} attempts=${attempts}${origin === 'prefetch' ? ' prefetch' : ''}${cost === null ? ' price-unknown' : ''}`,
      });
      for (const level of crossed(before, before + costUsd)) {
        console.warn(`BUDGET WARNING: cumulative live cost crossed $${level}`);
      }
    }

    const out: AskResponse = {
      answer: parseAnswer(res.text),
      rawText: res.text,
      latencyMs,
      modelLatencyMs: latencyMs,
      source: 'live',
      origin,
      framesUsed: videoSeconds ? [Math.max(0, t - videoSeconds), t] : frames.map((f) => f.t),
      cuesUsed: cues.length,
      model: res.model,
      t,
      attempts,
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
    };
  return out;
  };

  const promise = compute();
  if (deps.inflight && !deps.noCache) {
    deps.inflight.set(key, promise);
  }
  try {
    const out = await promise;
    if (deps.cache && !deps.noCache) {
      deps.cache.set(key, out);
    }
    return out;
  } finally {
    if (deps.inflight && deps.inflight.get(key) === promise) {
      deps.inflight.delete(key);
    }
  }
};