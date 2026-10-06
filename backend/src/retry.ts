export class AskTimeoutError extends Error {}

export type FailureKind = 'timeout' | 'throttle' | 'server' | 'network' | 'client' | 'unknown';

export const classify = (e: unknown): FailureKind => {
  const err = e as {name?: string; code?: string; $metadata?: {httpStatusCode?: number}};
  const name = err?.name ?? '';
  if (e instanceof AskTimeoutError || name === 'TimeoutError' || name === 'AbortError' || name === 'ModelTimeoutException') {
    return 'timeout';
  }
  if (name === 'ThrottlingException' || name === 'TooManyRequestsException' || err?.$metadata?.httpStatusCode === 429) {
    return 'throttle';
  }
  const status = err?.$metadata?.httpStatusCode ?? 0;
  if (name === 'InternalServerException' || name === 'ServiceUnavailableException' || status >= 500) {
    return 'server';
  }
  if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN'].includes(err?.code ?? '')) {
    return 'network';
  }
  if (name === 'ValidationException' || name === 'AccessDeniedException' || (status >= 400 && status < 500)) {
    return 'client';
  }
  return 'unknown';
};

const RETRYABLE = new Set<FailureKind>(['timeout', 'throttle', 'server', 'network']);

export type RetryOptions = {attemptTimeoutsMs: number[]; backoffMs: number};

// Total worst case: 4000 + 300 + 3000 = 7.3 s, under the app's request timeout.
export const DEFAULT_RETRY: RetryOptions = {attemptTimeoutsMs: [4000, 3000], backoffMs: 300};

// Prefetch makes a single attempt: it must never use up a viewer's retry budget.
export const PREFETCH_RETRY: RetryOptions = {attemptTimeoutsMs: [5000], backoffMs: 0};

export class UpstreamError extends Error {
  kind: 'timeout' | 'upstream' | 'budget';
  attempts: number;
  retryable: boolean;
  constructor(message: string, kind: 'timeout' | 'upstream' | 'budget', attempts: number, retryable: boolean) {
    super(message);
    this.kind = kind;
    this.attempts = attempts;
    this.retryable = retryable;
  }
}

// Each attempt gets its own timeout signal; a client that ignores the signal is still cut off by the race.
export const callWithRetry = async <T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: RetryOptions = DEFAULT_RETRY,
): Promise<{value: T; attempts: number}> => {
  const max = opts.attemptTimeoutsMs.length;
  let lastKind: FailureKind = 'unknown';
  for (let i = 0; i < max; i++) {
    const signal = AbortSignal.timeout(opts.attemptTimeoutsMs[i]);
    try {
      const value = await Promise.race([
        fn(signal),
        new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => reject(new AskTimeoutError('attempt timed out')), {once: true});
        }),
      ]);
      return {value, attempts: i + 1};
    } catch (e) {
      lastKind = classify(e);
      if (!RETRYABLE.has(lastKind) || i === max - 1) {
        const timeout = lastKind === 'timeout';
        throw new UpstreamError(
          timeout ? 'The model did not answer in time.' : `Upstream failure (${lastKind}).`,
          timeout ? 'timeout' : 'upstream',
          i + 1,
          RETRYABLE.has(lastKind),
        );
      }
      await new Promise((r) => setTimeout(r, opts.backoffMs * (0.75 + Math.random() * 0.5)));
    }
  }
  throw new UpstreamError(`Upstream failure (${lastKind}).`, 'upstream', max, false);
};
