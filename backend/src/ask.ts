import {loadClip, readFrames} from './clips.ts';
import {parseAnswer} from './answer.ts';
import {buildPrompt} from './prompt.ts';
import {selectCues, selectFrames, DEFAULT_WINDOW} from './window.ts';
import type {WindowConfig} from './window.ts';
import type {VisionClient} from './bedrock.ts';
import {crossed, estimateCost, HARD_STOP_USD, logCost, totalSpent} from './cost.ts';

export class AskInputError extends Error {}

export type AskDeps = {
  client: VisionClient;
  clipsDir: string;
  costLogPath: string;
  window?: WindowConfig;
  defaultClip?: string;
  allowOverBudget?: boolean;
};

export type AskResponse = {answer: string; latencyMs: number; framesUsed: number[]; model: string; t: number};

// Accepts {clipId, timestamp, question}; also the Phase 1 shape {question, t}.
export const handleAsk = async (body: unknown, deps: AskDeps): Promise<AskResponse> => {
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
  const cues = selectCues(clip.cues, t, cfg.cueRadiusSec);
  const prompt = buildPrompt({question, t, frames, cues});
  const images = await readFrames(clip, frames);

  const before = deps.client.mode === 'live' ? await totalSpent(deps.costLogPath) : 0;
  if (before >= HARD_STOP_USD && !deps.allowOverBudget) {
    throw new Error(`budget guard: $${before.toFixed(2)} spent, live calls disabled (set ALLOW_OVER_BUDGET=1 to override)`);
  }

  const started = performance.now();
  const res = await deps.client.answer({system: prompt.system, user: prompt.user, images});
  const latencyMs = Math.round(performance.now() - started);

  if (deps.client.mode === 'live') {
    const cost = estimateCost(res.model, deps.client.region, res.inputTokens, res.outputTokens);
    await logCost(deps.costLogPath, {
      date: new Date().toISOString(),
      model: res.model,
      region: deps.client.region,
      images: images.length,
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
      estCostUsd: cost ?? 0,
      note: cost === null ? 'price unknown' : `${clipId}@${t.toFixed(1)}`,
    });
    for (const level of crossed(before, before + (cost ?? 0))) {
      console.warn(`BUDGET WARNING: cumulative live cost crossed $${level}`);
    }
  }

  return {answer: parseAnswer(res.text), latencyMs, framesUsed: frames.map((f) => f.t), model: res.model, t};
};
