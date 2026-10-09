import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {handleAsk} from '../src/ask.ts';
import type {AskResponse} from '../src/ask.ts';
import {AnswerCache} from '../src/cache.ts';
import {PRESET_QUESTIONS, Prefetcher} from '../src/prefetch.ts';
import type {VisionClient, VisionResult} from '../src/bedrock.ts';

const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'moment-pf-'));
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

const slow = (ms: number, fail?: () => Error | null): VisionClient & {calls: number} => {
  const c = {
    calls: 0,
    mode: 'stub' as const,
    region: 'none',
    answer: async (): Promise<VisionResult> => {
      c.calls++;
      await new Promise((r) => setTimeout(r, ms));
      const err = fail?.();
      if (err) {
        throw err;
      }
      return {text: 'Fine.', inputTokens: 1, outputTokens: 1, model: 'stub'};
    },
  };
  return c;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mk = async (client: VisionClient) => ({...(await fixture()), client, cache: new AnswerCache(50), inflight: new Map<string, Promise<AskResponse>>(), defaultClip: 'demo'});

test('prefetch pre-answers the four presets; a later ask is a cache hit labelled "prefetch" with no extra model call', async () => {
  const client = slow(20);
  const deps = await mk(client);
  const pf = new Prefetcher(deps, {concurrency: 4});
  assert.equal(await pf.request('demo', 8), 'accepted');
  await wait(150);
  assert.equal(client.calls, 4);
  assert.equal(deps.cache.size, 4);
  const r = await handleAsk({clipId: 'demo', timestamp: 8, question: PRESET_QUESTIONS[1]}, deps);
  assert.equal(r.source, 'prefetch');
  assert.equal(r.cached, true);
  assert.equal(r.latencyMs, 0);
  assert.ok((r.modelLatencyMs ?? 0) >= 15);
  assert.equal(client.calls, 4);
});

test('an ask that arrives while the same call is in flight joins it: exactly one model call', async () => {
  const client = slow(80);
  const deps = await mk(client);
  const pf = new Prefetcher(deps, {concurrency: 4});
  await pf.request('demo', 8);
  await wait(10); // prefetch calls are now running
  const r = await handleAsk({clipId: 'demo', timestamp: 8, question: PRESET_QUESTIONS[0]}, deps);
  assert.equal(r.source, 'joined');
  assert.ok(r.latencyMs > 0 && r.latencyMs < 80);
  await wait(150);
  assert.equal(client.calls, 4); // four presets, not five
});

test('a failed prefetch makes the viewer ask fall back to its own call', async () => {
  let fail = true;
  const client = slow(20, () => (fail ? Object.assign(new Error('bad'), {name: 'ValidationException'}) : null));
  const deps = await mk(client);
  const pf = new Prefetcher(deps, {concurrency: 1});
  await pf.request('demo', 8);
  await wait(60);
  assert.equal(deps.cache.size, 0);
  fail = false;
  const r = await handleAsk({clipId: 'demo', timestamp: 8, question: PRESET_QUESTIONS[0]}, deps);
  assert.equal(r.source, 'live');
  assert.match(r.answer, /Fine/);
});

test('a throttle disables prefetch for a while and drops the queued calls', async () => {
  const client = slow(10, () => Object.assign(new Error('slow down'), {name: 'ThrottlingException'}));
  const deps = await mk(client);
  const pf = new Prefetcher(deps, {concurrency: 1, throttleBackoffMs: 5000});
  await pf.request('demo', 8);
  await wait(80);
  assert.equal(pf.stats.throttled, 1);
  assert.equal(client.calls, 1); // the other three queued calls were dropped
  assert.equal(await pf.request('demo', 9), 'cooling-down');
});

test('guards: PREFETCH off, duplicate moment, per-minute cap, spend limit, cancel', async () => {
  const client = slow(30);
  const deps = await mk(client);
  assert.equal(await new Prefetcher(deps, {enabled: false}).request('demo', 8), 'disabled');
  const pf = new Prefetcher(deps, {concurrency: 1, minGapMs: 5000, perMinuteCap: 2});
  assert.equal(await pf.request('demo', 3), 'accepted');
  assert.equal(await pf.request('demo', 3), 'duplicate');
  assert.equal(pf.cancel('demo', 3) >= 2, true); // queued calls dropped, the running one finishes
  assert.equal(await pf.request('demo', 4), 'accepted');
  assert.equal(await pf.request('demo', 5), 'rate-limited');
  const live = {...deps, client: {...client, mode: 'live' as const, region: 'us-east-1'}};
  const {writeFile} = await import('node:fs/promises');
  await writeFile(deps.costLogPath, 'date,model,region,images,input_tokens,output_tokens,est_cost_usd,note\nx,m,r,0,0,0,150,test\n');
  assert.equal(await new Prefetcher(live as never, {stopAtUsd: 100}).request('demo', 6), 'budget');
});

test('prefetch calls are single-attempt and tagged in the cost log; the viewer ask keeps its retry', async () => {
  const f = await fixture();
  let calls = 0;
  const live: VisionClient = {
    mode: 'live',
    region: 'us-east-1',
    answer: async () => {
      calls++;
      return {text: 'Two.', inputTokens: 3000, outputTokens: 5, model: 'amazon.nova-lite-v1:0'};
    },
  };
  const deps = {...f, client: live, cache: new AnswerCache(10), inflight: new Map<string, Promise<AskResponse>>()};
  const pf = new Prefetcher(deps, {concurrency: 4});
  await pf.request('demo', 8);
  await wait(100);
  const {readFile} = await import('node:fs/promises');
  const csv = (await readFile(f.costLogPath, 'utf8')).trim().split('\n');
  assert.equal(csv.length, 5);
  assert.ok(csv.slice(1).every((l) => l.includes('prefetch')));
  assert.equal(calls, 4);
});

test('prefetch queues five presets; the dialogue one needs no model call, so a panel open still costs four calls', async () => {
  assert.equal(PRESET_QUESTIONS.length, 5);
  assert.equal(PRESET_QUESTIONS[4], 'What did they just say?');
  const client = slow(10);
  const deps = await mk(client);
  const pf = new Prefetcher(deps, {concurrency: 5});
  await pf.request('demo', 8);
  await wait(120);
  assert.equal(pf.stats.finished, 5);
  assert.equal(client.calls, 4);
});

test('the app and the backend list the same preset questions (order may differ)', async () => {
  const {readFile} = await import('node:fs/promises');
  const src = await readFile(new URL('../../app/src/questions.ts', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf('export const QUESTIONS'), src.indexOf('] as const'));
  const appQuestions = [...block.matchAll(/'([^']+\?)'/g)].map((m) => m[1]);
  assert.deepEqual([...appQuestions].sort(), [...PRESET_QUESTIONS].sort());
});

test('a failed prefetch call is retried once; a second failure counts as failed; throttles and bad input are not retried', async () => {
  let n = 0;
  const flaky: VisionClient & {calls: number} = {calls: 0, mode: 'stub', region: 'none', answer: async () => {
    flaky.calls++;
    n++;
    if (n === 1) {
      throw Object.assign(new Error('boom'), {name: 'InternalServerException'}); // retryable: upstream 5xx
    }
    return {text: 'Fine.', inputTokens: 1, outputTokens: 1, model: 'stub'};
  }};
  const deps = await mk(flaky);
  const pf = new Prefetcher(deps, {concurrency: 1});
  await pf.request('demo', 8);
  await wait(250);
  assert.equal(pf.stats.retried, 1);
  assert.equal(pf.stats.failed, 0);
  assert.equal(deps.cache.size, 4); // the retried call succeeded: all four model answers are cached

  const bad = slow(5, () => Object.assign(new Error('nope'), {name: 'ValidationException'}));
  const pf2 = new Prefetcher(await mk(bad), {concurrency: 1});
  await pf2.request('demo', 8);
  await wait(150);
  assert.equal(pf2.stats.retried, 0); // bad input is never retried
  assert.ok(pf2.stats.failed >= 1);

  const alwaysFail = slow(5, () => Object.assign(new Error('boom'), {name: 'InternalServerException'}));
  const pf3 = new Prefetcher(await mk(alwaysFail), {concurrency: 1});
  await pf3.request('demo', 9);
  await wait(250);
  assert.ok(pf3.stats.retried >= 1 && pf3.stats.failed >= 1); // retried once, then given up
  assert.ok(pf3.stats.retried <= pf3.stats.started);
});
