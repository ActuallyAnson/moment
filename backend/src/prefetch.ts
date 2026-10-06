import {handleAsk} from './ask.ts';
import type {AskDeps} from './ask.ts';
import {totalSpent} from './cost.ts';
import {classify} from './retry.ts';

// The four preset questions, in the order they are pre-answered (the focused one first).
export const PRESET_QUESTIONS = ['What just happened?', 'Who is on screen?', 'What does the text say?', 'What should I notice here?'] as const;

export type PrefetchOptions = {
  enabled: boolean;
  concurrency: number; // simultaneous model calls for prefetch (start low; Bedrock can throttle)
  stopAtUsd: number; // skip prefetch once cumulative live spend reaches this
  minGapMs: number; // ignore a second request for the same (clip, t) within this window
  perMinuteCap: number;
  throttleBackoffMs: number; // after any throttle, prefetch is off for this long
};

export const DEFAULT_PREFETCH: PrefetchOptions = {
  enabled: process.env.PREFETCH !== '0',
  concurrency: Number(process.env.PREFETCH_CONCURRENCY ?? 4), // measured: 0 throttles at 4 over 106 calls (eval/results/prefetch-conc4.json)
  stopAtUsd: 100,
  minGapMs: 5000,
  perMinuteCap: 30,
  throttleBackoffMs: 60_000,
};

type Job = {clipId: string; t: number; question: string; cancelled: boolean};

export type PrefetchResult = 'accepted' | 'disabled' | 'duplicate' | 'rate-limited' | 'budget' | 'cooling-down';

export class Prefetcher {
  private deps: AskDeps;
  private opts: PrefetchOptions;
  private queue: Job[] = [];
  private running = 0;
  private recent = new Map<string, number>();
  private stamps: number[] = [];
  private disabledUntil = 0;
  stats = {started: 0, finished: 0, failed: 0, throttled: 0, cancelled: 0};

  constructor(deps: AskDeps, opts: Partial<PrefetchOptions> = {}) {
    this.deps = deps;
    this.opts = {...DEFAULT_PREFETCH, ...opts};
  }

  async request(clipId: string, t: number, now = Date.now()): Promise<PrefetchResult> {
    if (!this.opts.enabled) {
      return 'disabled';
    }
    if (now < this.disabledUntil) {
      return 'cooling-down';
    }
    const k = `${clipId}@${t.toFixed(1)}`;
    const last = this.recent.get(k);
    if (last !== undefined && now - last < this.opts.minGapMs) {
      return 'duplicate';
    }
    this.stamps = this.stamps.filter((s) => now - s < 60_000);
    if (this.stamps.length >= this.opts.perMinuteCap) {
      return 'rate-limited';
    }
    if (this.deps.client.mode === 'live' && (await totalSpent(this.deps.costLogPath)) >= this.opts.stopAtUsd) {
      return 'budget';
    }
    this.recent.set(k, now);
    this.stamps.push(now);
    for (const question of PRESET_QUESTIONS) {
      this.queue.push({clipId, t, question, cancelled: false});
    }
    this.pump();
    return 'accepted';
  }

  // Drop calls for this moment that have not started yet. Calls already running finish and stay cached (the cost is incurred).
  cancel(clipId: string, t: number): number {
    let n = 0;
    for (const j of this.queue) {
      if (j.clipId === clipId && Math.abs(j.t - t) < 0.05 && !j.cancelled) {
        j.cancelled = true;
        n++;
      }
    }
    this.stats.cancelled += n;
    this.queue = this.queue.filter((j) => !j.cancelled);
    return n;
  }

  private pump(): void {
    while (this.running < this.opts.concurrency && this.queue.length) {
      const job = this.queue.shift() as Job;
      if (Date.now() < this.disabledUntil) {
        this.stats.cancelled++;
        continue;
      }
      this.running++;
      this.stats.started++;
      handleAsk({clipId: job.clipId, timestamp: job.t, question: job.question}, this.deps, {rid: 'prefetch', origin: 'prefetch'})
        .then(() => {
          this.stats.finished++;
        })
        .catch((e: unknown) => {
          this.stats.failed++;
          const kind = classify((e as {cause?: unknown}).cause ?? e);
          const throttled = kind === 'throttle' || /throttl/i.test(String((e as Error)?.message ?? ''));
          if (throttled) {
            this.stats.throttled++;
            this.disabledUntil = Date.now() + this.opts.throttleBackoffMs;
            this.queue = []; // stop everything queued after a throttle
          }
        })
        .finally(() => {
          this.running--;
          this.pump();
        });
    }
  }
}
