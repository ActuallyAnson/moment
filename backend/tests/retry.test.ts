import {test} from 'node:test';
import assert from 'node:assert/strict';
import {callWithRetry, classify, UpstreamError} from '../src/retry.ts';

const FAST = {attemptTimeoutsMs: [60, 60], backoffMs: 5};
const named = (name: string, extra: Record<string, unknown> = {}) => Object.assign(new Error(name), {name, ...extra});

test('succeeds first time with one attempt', async () => {
  const r = await callWithRetry(async () => 'ok', FAST);
  assert.deepEqual(r, {value: 'ok', attempts: 1});
});

test('hanging client that honours the signal: 2 attempts then timeout, fast', async () => {
  let calls = 0;
  const started = Date.now();
  await assert.rejects(
    callWithRetry(
      (signal) => {
        calls++;
        return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
      },
      FAST,
    ),
    (e: unknown) => e instanceof UpstreamError && e.kind === 'timeout' && e.attempts === 2 && e.retryable,
  );
  assert.equal(calls, 2);
  assert.ok(Date.now() - started < 400);
});

test('client that ignores the signal is still cut off by the race', async () => {
  await assert.rejects(
    callWithRetry(() => new Promise(() => {}), FAST),
    (e: unknown) => e instanceof UpstreamError && e.kind === 'timeout',
  );
});

test('flaky client: throttling then success gives attempts=2', async () => {
  let n = 0;
  const r = await callWithRetry(async () => {
    if (++n === 1) {
      throw named('ThrottlingException');
    }
    return 'fine';
  }, FAST);
  assert.deepEqual(r, {value: 'fine', attempts: 2});
});

test('slow first attempt, fast second attempt succeeds', async () => {
  let n = 0;
  const r = await callWithRetry(async (signal) => {
    if (++n === 1) {
      await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
    }
    return 'second';
  }, FAST);
  assert.equal(r.value, 'second');
  assert.equal(r.attempts, 2);
});

test('validation and access errors are not retried', async () => {
  for (const name of ['ValidationException', 'AccessDeniedException']) {
    let calls = 0;
    await assert.rejects(
      callWithRetry(async () => {
        calls++;
        throw named(name);
      }, FAST),
      (e: unknown) => e instanceof UpstreamError && e.kind === 'upstream' && !e.retryable && e.attempts === 1,
    );
    assert.equal(calls, 1);
  }
});

test('classify', () => {
  assert.equal(classify(named('TimeoutError')), 'timeout');
  assert.equal(classify(named('x', {$metadata: {httpStatusCode: 503}})), 'server');
  assert.equal(classify(named('x', {$metadata: {httpStatusCode: 429}})), 'throttle');
  assert.equal(classify(named('x', {code: 'ECONNRESET'})), 'network');
  assert.equal(classify(new Error('weird')), 'unknown');
});
