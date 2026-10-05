import {createHash} from 'node:crypto';
import {loadClip, readFrames} from './clips.ts';
import {parseAnswer} from './answer.ts';
import {buildPrompt, PROMPT_VERSION, SYSTEM_PROMPT, SYSTEM_PROMPT_V3} from './prompt.ts';
import type {PromptVersion} from './prompt.ts';
import {selectCues, selectFrames, DEFAULT_WINDOW} from './window.ts';
import type {WindowConfig} from './window.ts';
import type {VisionClient} from './bedrock.ts';
import {crossed, estimateCost, HARD_STOP_USD, logCost, totalSpent} from './cost.ts';
import {callWithRetry, DEFAULT_RETRY, UpstreamError} from './retry.ts';
import type {RetryOptions} from './retry.ts';
import {AnswerCache, cacheKey} from './cache.ts';

export class AskInputError extends Error {}

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
  routeTextPreset?: boolean; // the 'What does the text say?' preset gets no dialogue at all
  noCache?: boolean; // the eval harness always bypasses the cache so latency numbers are real
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
  attempts?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export const TEXT_PRESET = 'What does the text say?';
export const DEFAULT_PROMPT_VERSION: PromptVersion = 'v3'; // chosen by the Phase 3 eval

export const configHash = (cfg: WindowConfig, model: string, version: PromptVersion = 'v2', routed = false): string =>
  createHash('sha256').update(JSON.stringify({cfg, model, version, routed, system: version === 'v3' ? SYSTEM_PROMPT_V3 : SYSTEM_PROMPT, v: PROMPT_VERSION})).digest('hex').slice(0, 12);

// Accepts {clipId, timestamp, question}; also the Phase 1 shape {question, t}.
export const handleAsk = async (body: unknown, deps: AskDeps, ctx: {rid?: string} = {}): Promise<AskResponse> => {
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
    throw new AskInputError(`unknown clip: ${clipId}`);
  }

  const cfg = deps.window ?? DEFAULT_WINDOW;
  const frames = selectFrames(clip.index.frames, t, cfg);
  const routedAway = (deps.routeTextPreset ?? true) && question.trim() === TEXT_PRESET;
  const cues = routedAway ? [] : selectCues(clip.cues, t, cfg.cueRadiusSec, cfg.cueAheadSec ?? cfg.cueRadiusSec);
  const version = deps.promptVersion ?? DEFAULT_PROMPT_VERSION;

  const key = cacheKey({
    clipId,
    framePaths: frames.map((f) => f.path),
    cueTexts: cues.map((c) => c.text),
    question,
    configHash: configHash(cfg, deps.client.mode === 'live' ? 'live' : 'stub', version, deps.routeTextPreset ?? true),
  });
  if (deps.cache && !deps.noCache) {
    const hit = deps.cache.get(key);
    if (hit) {
      return {...hit, cached: true, latencyMs: 0, t};
    }
  }

  const prompt = buildPrompt({question, t, frames, cues}, version);
  const images = await readFrames(clip, frames);

  const before = deps.client.mode === 'live' ? await totalSpent(deps.costLogPath) : 0;
  if (before >= HARD_STOP_USD && !deps.allowOverBudget) {
    throw new UpstreamError(`budget guard: $${before.toFixed(2)} spent, live calls disabled`, 'budget', 0, false);
  }

  const started = performance.now();
  const {value: res, attempts} = await callWithRetry(
    (signal) => deps.client.answer({system: prompt.system, user: prompt.user, images}, {signal}),
    deps.retry ?? DEFAULT_RETRY,
  );
  const latencyMs = Math.round(performance.now() - started);

  let costUsd = 0;
  if (deps.client.mode === 'live') {
    const cost = estimateCost(res.model, deps.client.region, res.inputTokens, res.outputTokens);
    costUsd = cost ?? 0;
    await logCost(deps.costLogPath, {
      date: new Date().toISOString(),
      model: res.model,
      region: deps.client.region,
      images: images.length,
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
      estCostUsd: costUsd,
      note: `${ctx.rid ?? '-'} ${clipId}@${t.toFixed(1)} attempts=${attempts}${cost === null ? ' price-unknown' : ''}`,
    });
    for (const level of crossed(before, before + costUsd)) {
      console.warn(`BUDGET WARNING: cumulative live cost crossed $${level}`);
    }
  }

  const out: AskResponse = {
    answer: parseAnswer(res.text),
    rawText: res.text,
    latencyMs,
    framesUsed: frames.map((f) => f.t),
    cuesUsed: cues.length,
    model: res.model,
    t,
    attempts,
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
  };
  if (deps.cache && !deps.noCache) {
    deps.cache.set(key, out);
  }
  return out;
};
