import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AnswerCache, cacheKey} from '../src/cache.ts';
import {handleAsk, AskInputError} from '../src/ask.ts';
import {UpstreamError} from '../src/retry.ts';
import type {VisionClient, VisionResult} from '../src/bedrock.ts';

const base = {clipId: 'c', framePaths: ['a', 'b'], cueTexts: ['x'], question: 'What?', configHash: 'h'};

test('cache key changes with frames, cues, question and config; ignores case/whitespace in the question', () => {
  const k = cacheKey(base);
  assert.equal(cacheKey({...base, question: '  what? '}), k);
  assert.notEqual(cacheKey({...base, framePaths: ['a', 'c']}), k);
  assert.notEqual(cacheKey({...base, cueTexts: []}), k);
  assert.notEqual(cacheKey({...base, configHash: 'h2'}), k);
  assert.notEqual(cacheKey({...base, question: 'Who?'}), k);
});

test('LRU evicts the oldest entry', () => {
  const c = new AnswerCache(2);
  const v = {answer: 'a', latencyMs: 1, framesUsed: [], model: 'm', t: 0};
  c.set('1', v);
  c.set('2', v);
  c.get('1'); // refresh 1
  c.set('3', v);
  assert.ok(c.get('1'));
  assert.equal(c.get('2'), undefined);
  assert.ok(c.get('3'));
});

const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'moment-rel-'));
  const dir = join(root, 'clips', 'demo');
  await mkdir(join(dir, 'frames'), {recursive: true});
  const frames = [];
  for (let i = 0; i < 20; i++) {
    await writeFile(join(dir, 'frames', `f${i}.jpg`), Buffer.from([0xff, 0xd8, i]));
    frames.push({t: i / 2, path: `frames/f${i}.jpg`});
  }
  await writeFile(join(dir, 'index.json'), JSON.stringify({id: 'demo', duration: 10, fps: 2, width: 512, frames, source: '', license: '', attribution: '', excerpt: {startSec: 0, durationSec: 10}}));
  const costLogPath = join(root, 'cost.csv');
  await writeFile(costLogPath, 'date,model,region,images,input_tokens,output_tokens,est_cost_usd,note\n');
  return {clipsDir: join(root, 'clips'), costLogPath};
};

const counting = (impl: () => Promise<VisionResult>): VisionClient & {calls: number} => {
  const c = {calls: 0, mode: 'stub' as const, region: 'none', answer: async () => { c.calls++; return impl(); }};
  return c;
};
const ok = async (): Promise<VisionResult> => ({text: 'Fine.', inputTokens: 1, outputTokens: 1, model: 'stub'});

test('cache hit makes zero client calls; a different frame set misses; errors are not cached', async () => {
  const f = await fixture();
  const client = counting(ok);
  const cache = new AnswerCache(10);
  const deps = {...f, client, cache, retry: {attemptTimeoutsMs: [50, 50], backoffMs: 1}};
  const a = await handleAsk({clipId: 'demo', timestamp: 8, question: 'What?'}, deps);
  assert.equal(a.cached, undefined);
  const b = await handleAsk({clipId: 'demo', timestamp: 8, question: 'what? '}, deps);
  assert.equal(b.cached, true);
  assert.equal(client.calls, 1);
  await handleAsk({clipId: 'demo', timestamp: 6, question: 'What?'}, deps);
  assert.equal(client.calls, 2);
  const failing = counting(async () => { throw Object.assign(new Error('x'), {name: 'ValidationException'}); });
  await assert.rejects(handleAsk({clipId: 'demo', timestamp: 3, question: 'Q'}, {...deps, client: failing}), UpstreamError);
  await assert.rejects(handleAsk({clipId: 'demo', timestamp: 3, question: 'Q'}, {...deps, client: failing}), UpstreamError);
  assert.equal(failing.calls, 2); // nothing cached from the failure
});

test('noCache bypasses the cache (eval harness)', async () => {
  const f = await fixture();
  const client = counting(ok);
  const deps = {...f, client, cache: new AnswerCache(10), noCache: true};
  await handleAsk({clipId: 'demo', timestamp: 8, question: 'q'}, deps);
  await handleAsk({clipId: 'demo', timestamp: 8, question: 'q'}, deps);
  assert.equal(client.calls, 2);
});

test('hanging model gives a timeout UpstreamError after 2 attempts', async () => {
  const f = await fixture();
  const hang: VisionClient = {mode: 'stub', region: 'none', answer: (_r, o) => new Promise((_, rej) => o?.signal?.addEventListener('abort', () => rej(o.signal?.reason)))};
  await assert.rejects(
    handleAsk({clipId: 'demo', timestamp: 8, question: 'q'}, {...f, client: hang, retry: {attemptTimeoutsMs: [40, 40], backoffMs: 1}}),
    (e: unknown) => e instanceof UpstreamError && e.kind === 'timeout' && e.attempts === 2,
  );
});

test('bad input is an AskInputError, not an upstream error', async () => {
  const f = await fixture();
  await assert.rejects(handleAsk({question: '', t: 1}, {...f, client: counting(ok), defaultClip: 'demo'}), AskInputError);
});
