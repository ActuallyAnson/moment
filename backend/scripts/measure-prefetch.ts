// Usage: node backend/scripts/measure-prefetch.ts <label> [N=20] [base=http://127.0.0.1:8787]
// Measures end-to-end HTTP latency of /ask in four situations, each on N distinct (clip, time) moments so nothing is cached:
//   cold       no prefetch (what a viewer gets without the feature)
//   prefetched POST /prefetch, wait 3 s (a typical time to pick a question), then /ask
//   joined     POST /prefetch, then /ask immediately (joins the call in flight)
//   burst      10 panel opens back to back (40 prefetch calls); reports prefetch throttles from /health
// MODES=prefetched,burst limits which parts run. Writes eval/results/prefetch-<label>.json. Needs the backend running in live mode. Costs about $0.05 at N=20.
import {readFileSync, writeFileSync} from 'node:fs';
import {percentile} from '../src/evalstats.ts';
import {PRESET_QUESTIONS} from '../src/prefetch.ts';

const label = process.argv[2] ?? 'run';
const N = Number(process.argv[3] ?? 20);
const base = process.argv[4] ?? 'http://127.0.0.1:8787';
const CLIPS = ['tos', 'sintel', 'bbb', 'spring', 'llama', 'marketst'];
const durations = Object.fromEntries(CLIPS.map((c) => [c, JSON.parse(readFileSync(`clips/${c}/index.json`, 'utf8')).duration as number]));

// distinct moments per mode: offset keeps the modes' frame windows apart
const moment = (mode: number, i: number) => {
  const clip = CLIPS[i % CLIPS.length];
  const t = 5 + mode * 1.7 + (Math.floor(i / CLIPS.length) % 6) * 6.3 + (i % CLIPS.length) * 0.6;
  return {clipId: clip, t: Math.min(t, durations[clip] - 2)};
};
const post = (path: string, body: unknown) => fetch(base + path, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
const ask = async (clipId: string, t: number, q: string) => {
  const t0 = performance.now();
  const res = await post('/ask', {clipId, timestamp: t, question: q});
  const body = (await res.json()) as {source?: string; answer?: string; error?: string};
  return {ms: Math.round(performance.now() - t0), status: res.status, source: body.source ?? body.error ?? 'none'};
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stats = (rows: {ms: number; status: number}[]) => {
  const ok = rows.filter((r) => r.status === 200).map((r) => r.ms);
  return {n: rows.length, errors: rows.length - ok.length, p50: percentile(ok, 50), p95: percentile(ok, 95), mean: Math.round(ok.reduce((a, b) => a + b, 0) / Math.max(1, ok.length))};
};

const MODES = (process.env.MODES ?? 'cold,prefetched,joined,burst').split(',');
const out: Record<string, unknown> = {label, N, date: new Date().toISOString(), base, concurrency: process.env.PREFETCH_CONCURRENCY ?? 'server default'};
const rows = {cold: [] as Awaited<ReturnType<typeof ask>>[], prefetched: [] as Awaited<ReturnType<typeof ask>>[], joined: [] as Awaited<ReturnType<typeof ask>>[]};

for (let i = 0; MODES.includes('cold') && i < N; i++) {
  const {clipId, t} = moment(0, i);
  rows.cold.push(await ask(clipId, t, PRESET_QUESTIONS[i % 4]));
}
for (let i = 0; MODES.includes('prefetched') && i < N; i++) {
  const {clipId, t} = moment(1, i);
  await post('/prefetch', {clipId, timestamp: t});
  await wait(3000);
  rows.prefetched.push(await ask(clipId, t, PRESET_QUESTIONS[i % 4]));
  await wait(2500); // let the rest of the prefetch finish before the next moment
}
for (let i = 0; MODES.includes('joined') && i < N; i++) {
  const {clipId, t} = moment(2, i);
  await post('/prefetch', {clipId, timestamp: t});
  rows.joined.push(await ask(clipId, t, PRESET_QUESTIONS[i % 4]));
  await wait(4000);
}
const before = (await (await fetch(base + '/health')).json()) as {prefetch?: Record<string, number>};
for (let i = 0; MODES.includes('burst') && i < 10; i++) {
  const {clipId, t} = moment(3, i);
  await post('/prefetch', {clipId, timestamp: t});
}
await wait(15000);
const after = (await (await fetch(base + '/health')).json()) as {prefetch?: Record<string, number>};

for (const [mode, r] of Object.entries(rows)) {
  out[mode] = {...stats(r), sources: Object.fromEntries([...new Set(r.map((x) => x.source))].map((s) => [s, r.filter((x) => x.source === s).length]))};
}
out.burst = {opens: 10, prefetchStatsBefore: before.prefetch, prefetchStatsAfter: after.prefetch};
writeFileSync(`eval/results/prefetch-${label}.json`, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
