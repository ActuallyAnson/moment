import {API_BASE, REQUEST_TIMEOUT_MS} from './config';

export type AskResult = {answer: string; t: number; latencyMs?: number; framesUsed?: number[]; cuesUsed?: number; model?: string};

const CLIP_ID = 'tos';

export class AskError extends Error {}

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AskError('The request timed out.')), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });

export const ask = async (question: string, t: number): Promise<AskResult> => {
  try {
    const requestId = `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const res = await withTimeout(
      fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-request-id': requestId},
        body: JSON.stringify({clipId: CLIP_ID, timestamp: t, question}),
      }),
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      let kind = '';
      try {
        kind = ((await res.json()) as {error?: string}).error ?? '';
      } catch {
        // body was not JSON
      }
      console.log(`[moment] ask failed ${requestId} status=${res.status} error=${kind}`);
      if (kind === 'timeout') {
        throw new AskError('The answer took too long.');
      }
      if (kind === 'budget') {
        throw new AskError('Answers are paused right now.');
      }
      if (res.status === 400) {
        throw new AskError("That question couldn't be sent.");
      }
      throw new AskError('The answer service had a problem.');
    }
    return (await res.json()) as AskResult;
  } catch (e) {
    if (e instanceof AskError) {
      throw e;
    }
    throw new AskError("Couldn't reach the answer service.");
  }
};
