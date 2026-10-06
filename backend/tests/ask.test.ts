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

test('routed text preset gets no dialogue; ahead=0 drops future cues', async () => {
  const f = await makeFixture();
  const seen: string[] = [];
  const spy = {mode: 'stub' as const, region: 'none', answer: async (r: {user: string}) => { seen.push(r.user); return {text: 'ok', inputTokens: 1, outputTokens: 1, model: 'stub'}; }};
  const deps = {...f, client: spy, defaultClip: 'demo', promptVersion: 'v3' as const};
  await handleAsk({question: 'What does the text say?', t: 5.5}, {...deps, routeTextPreset: true});
  await handleAsk({question: 'What just happened?', t: 5.5}, {...deps, routeTextPreset: true});
  await handleAsk({question: 'What just happened?', t: 4}, {...deps, window: {lookbackSec: 4, maxFrames: 5, cueRadiusSec: 10, cueAheadSec: 0}});
  assert.match(seen[0], /No dialogue transcript is provided/);
  assert.match(seen[1], /Hello there/);
  assert.match(seen[2], /No dialogue transcript is provided/); // cue starts at 5 s, after the pause at 4 s
});

test('unknown clip gives an AskInputError with code "clip"; listClips only lists prepared clips', async () => {
  const f = await makeFixture();
  await assert.rejects(
    handleAsk({clipId: 'nope', timestamp: 1, question: 'q'}, {...f, client: new StubClient(0)}),
    (e: unknown) => e instanceof AskInputError && e.code === 'clip',
  );
  await assert.rejects(handleAsk({clipId: 'demo', timestamp: -1, question: 'q'}, {...f, client: new StubClient(0)}), (e: unknown) => e instanceof AskInputError && e.code === 'input');
  const {listClips} = await import('../src/clips.ts');
  assert.deepEqual(await listClips(f.clipsDir), ['demo']);
});

test('preset overrides change the window, the prompt and the cache key; other questions are untouched', async () => {
  const f = await makeFixture();
  const seen: {user: string; system: string; images: number}[] = [];
  const spy = {mode: 'stub' as const, region: 'none', answer: async (r: {user: string; system: string; images: unknown[]}) => { seen.push({user: r.user, system: r.system, images: r.images.length}); return {text: 'ok', inputTokens: 1, outputTokens: 1, model: 'stub'}; }};
  const {configHash} = await import('../src/ask.ts');
  const {DEFAULT_WINDOW} = await import('../src/window.ts');
  const deps = {...f, client: spy, defaultClip: 'demo', presetOverrides: {'What just happened?': {lookbackSec: 8, maxFrames: 8, promptVariant: 'action-change' as const}}};
  await handleAsk({question: 'What just happened?', t: 9.5}, deps);
  await handleAsk({question: 'Who is on screen?', t: 9.5}, deps);
  assert.equal(seen[0].images, 8);
  assert.match(seen[0].user, /s before the pause\)/);
  assert.match(seen[0].system, /what changed between the first and the last image/);
  assert.equal(seen[1].images, 5);
  assert.doesNotMatch(seen[1].system, /what changed between/);
  // different overrides must never share a cache key / hash
  assert.notEqual(configHash(DEFAULT_WINDOW, 'stub', 'v3', true), configHash(DEFAULT_WINDOW, 'stub', 'v3', true, 'action-change'));
  assert.notEqual(configHash({...DEFAULT_WINDOW, maxFrames: 8}, 'stub', 'v3', true), configHash(DEFAULT_WINDOW, 'stub', 'v3', true));
});

test('an override can route one question to a different model client', async () => {
  const f = await makeFixture();
  const mkc = (model: string) => ({mode: 'stub' as const, region: 'none', answer: async () => ({text: model, inputTokens: 1, outputTokens: 1, model})});
  const deps = {...f, client: mkc('lite'), clients: {pro: mkc('pro')}, defaultClip: 'demo', presetOverrides: {'What just happened?': {model: 'pro'}}};
  assert.equal((await handleAsk({question: 'What just happened?', t: 5}, deps)).model, 'pro');
  assert.equal((await handleAsk({question: 'Who is on screen?', t: 5}, deps)).model, 'lite');
});

test('dialogue preset: verbatim answer from the last subtitle lines, no model call, no cost row, never future dialogue', async () => {
  const f = await makeFixture(); // subtitle cue "Hello there" at 5.0-6.0 s
  let calls = 0;
  const client = {mode: 'live' as const, region: 'us-east-1', answer: async () => { calls++; return {text: 'x', inputTokens: 1, outputTokens: 1, model: 'm'}; }};
  const deps = {...f, client, defaultClip: 'demo'};
  const r = await handleAsk({question: 'What did they just say?', t: 8}, deps);
  assert.equal(r.answer, 'Someone said: "Hello there"');
  assert.equal(r.source, 'subtitles');
  assert.equal(r.cuesUsed, 1);
  assert.equal(calls, 0);
  const {readFile} = await import('node:fs/promises');
  assert.equal((await readFile(f.costLogPath, 'utf8')).trim().split('\n').length, 1); // header only
  // the cue starts at 5 s: a pause at 4 s must not show it (no future dialogue)
  const early = await handleAsk({question: 'What did they just say?', t: 4}, deps);
  assert.equal(early.answer, 'No dialogue in the subtitles for the last 10 seconds.');
  assert.equal(calls, 0);
});

test('dialogue preset: a clip without subtitles says so (different from "I\'m not sure")', async () => {
  const f = await makeFixture();
  const {rm} = await import('node:fs/promises');
  await rm(join(f.clipsDir, 'demo', 'subs.srt'));
  const {loadClip} = await import('../src/clips.ts');
  const clip = await loadClip(f.clipsDir, 'demo');
  assert.equal(clip.hasSubtitles, false);
  const r = await handleAsk({question: 'What did they just say?', t: 8}, {...f, client: new StubClient(0), defaultClip: 'demo'});
  assert.equal(r.answer, "This video has no subtitles, so I can't show what was said.");
  assert.doesNotMatch(r.answer, /not sure/i);
  assert.equal(r.source, 'subtitles');
});

test('verbatimDialogue keeps the last 3 lines, oldest first, and caps the length', async () => {
  const {verbatimDialogue, MAX_DIALOGUE_CHARS} = await import('../src/ask.ts');
  const c = (text: string) => ({text});
  assert.equal(verbatimDialogue([c('a'), c('b'), c('c'), c('d')]), 'Someone said: "b" "c" "d"');
  const long = 'x'.repeat(150);
  const out = verbatimDialogue([c(long), c(long)]);
  assert.ok(out.length <= MAX_DIALOGUE_CHARS + 'Someone said: '.length);
  assert.ok(verbatimDialogue([c('y'.repeat(400))]).endsWith('…"'));
});

test('dialogue model mode (variant B) uses at most 2 frames and the dialogue instruction; other presets do not', async () => {
  const f = await makeFixture();
  const seen: {user: string; system: string; images: number}[] = [];
  const spy = {mode: 'stub' as const, region: 'none', answer: async (r: {user: string; system: string; images: unknown[]}) => { seen.push({user: r.user, system: r.system, images: r.images.length}); return {text: 'ok', inputTokens: 1, outputTokens: 1, model: 'stub'}; }};
  const deps = {...f, client: spy, defaultClip: 'demo', dialogueMode: 'model' as const, presetOverrides: {'What did they just say?': {lookbackSec: 2, maxFrames: 2, promptVariant: 'dialogue' as const}}};
  const r = await handleAsk({question: 'What did they just say?', t: 8}, deps);
  assert.notEqual(r.source, 'subtitles');
  assert.equal(seen[0].images, 2);
  assert.match(seen[0].system, /quote the most recent lines/);
  assert.match(seen[0].user, /Hello there/);
  await handleAsk({question: 'Who is on screen?', t: 8}, deps);
  assert.doesNotMatch(seen[1].system, /quote the most recent lines/);
});
