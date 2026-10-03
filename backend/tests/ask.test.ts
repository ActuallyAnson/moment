import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AskInputError, handleAsk} from '../src/ask.ts';
import {StubClient} from '../src/bedrock.ts';
import type {VisionClient} from '../src/bedrock.ts';
import {crossed, estimateCost, logCost, totalSpent} from '../src/cost.ts';

const makeFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'moment-'));
  const dir = join(root, 'clips', 'demo');
  await mkdir(join(dir, 'frames'), {recursive: true});
  const frames = [];
  for (let i = 0; i < 20; i++) {
    await writeFile(join(dir, 'frames', `f${i}.jpg`), Buffer.from([0xff, 0xd8, i]));
    frames.push({t: i / 2, path: `frames/f${i}.jpg`});
  }
  await writeFile(join(dir, 'index.json'), JSON.stringify({id: 'demo', duration: 10, fps: 2, width: 512, frames, source: '', license: '', attribution: '', excerpt: {startSec: 0, durationSec: 10}}));
  await writeFile(join(dir, 'subs.srt'), '1\n00:00:05,000 --> 00:00:06,000\nHello there\n');
  const costLogPath = join(root, 'cost.csv');
  await writeFile(costLogPath, 'date,model,region,images,input_tokens,output_tokens,est_cost_usd,note\n');
  return {clipsDir: join(root, 'clips'), costLogPath};
};

test('stub ask returns answer, frames used and does not log cost', async () => {
  const f = await makeFixture();
  const res = await handleAsk({clipId: 'demo', timestamp: 8, question: 'What just happened?'}, {...f, client: new StubClient(0)});
  assert.equal(res.model, 'stub');
  assert.equal(res.framesUsed.length, 5);
  assert.equal(res.framesUsed[4], 8);
  assert.match(res.answer, /Stub answer/);
  assert.equal(await totalSpent(f.costLogPath), 0);
});

test('legacy {question, t} shape works with defaultClip', async () => {
  const f = await makeFixture();
  const res = await handleAsk({question: 'q', t: 3}, {...f, client: new StubClient(0), defaultClip: 'demo'});
  assert.equal(res.t, 3);
});

test('input validation', async () => {
  const f = await makeFixture();
  const deps = {...f, client: new StubClient(0), defaultClip: 'demo'};
  await assert.rejects(handleAsk({question: '', t: 1}, deps), AskInputError);
  await assert.rejects(handleAsk({question: 'q', t: -1}, deps), AskInputError);
  await assert.rejects(handleAsk({question: 'q', t: 'x'}, deps), AskInputError);
  await assert.rejects(handleAsk({clipId: '../etc', question: 'q', t: 1}, deps), AskInputError);
  await assert.rejects(handleAsk({clipId: 'nope', question: 'q', t: 1}, deps), AskInputError);
});

test('live client results are logged and budget guard blocks at $130', async () => {
  const f = await makeFixture();
  const live: VisionClient = {
    mode: 'live',
    region: 'us-east-1',
    answer: async () => ({text: 'Two people talk.', inputTokens: 4000, outputTokens: 20, model: 'amazon.nova-lite-v1:0'}),
  };
  const res = await handleAsk({clipId: 'demo', timestamp: 6, question: 'q'}, {...f, client: live});
  assert.equal(res.answer, 'Two people talk.');
  const csv = (await readFile(f.costLogPath, 'utf8')).trim().split('\n');
  assert.equal(csv.length, 2);
  assert.ok((await totalSpent(f.costLogPath)) > 0);
  await logCost(f.costLogPath, {date: 'x', model: 'm', region: 'r', images: 0, inputTokens: 0, outputTokens: 0, estCostUsd: 130, note: 'test'});
  await assert.rejects(handleAsk({clipId: 'demo', timestamp: 6, question: 'q'}, {...f, client: live}), /budget guard/);
  await handleAsk({clipId: 'demo', timestamp: 6, question: 'q'}, {...f, client: live, allowOverBudget: true});
});

test('cost arithmetic and thresholds', () => {
  assert.equal(estimateCost('amazon.nova-lite-v1:0', 'us-east-1', 1_000_000, 1_000_000), 0.3);
  assert.equal(estimateCost('us.amazon.nova-pro-v1:0', 'us-east-1', 1_000_000, 0), 0.8);
  assert.equal(estimateCost('unknown', 'us-east-1', 1, 1), null);
  assert.deepEqual(crossed(49, 51), [50]);
  assert.deepEqual(crossed(49, 131), [50, 100, 130]);
  assert.deepEqual(crossed(10, 20), []);
});
