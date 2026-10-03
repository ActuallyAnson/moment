import {API_BASE, REQUEST_TIMEOUT_MS} from './config';

export type AskResult = {answer: string; t: number};

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
    const res = await withTimeout(
      fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({question, t}),
      }),
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      throw new AskError(`The server returned an error (${res.status}).`);
    }
    return (await res.json()) as AskResult;
  } catch (e) {
    if (e instanceof AskError) {
      throw e;
    }
    throw new AskError("Couldn't reach the answer service.");
  }
};
