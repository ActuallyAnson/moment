// Usage: BEDROCK_MODE=stub|live node backend/scripts/run-eval.ts [label]
// Runs every question in eval/questions.jsonl and writes eval/results/<label>.jsonl
// (raw answers, latency, frames used) plus a one-line summary per category.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {handleAsk} from '../src/ask.ts';
import {makeClient} from '../src/bedrock.ts';

const label = process.argv[2] ?? `${new Date().toISOString().slice(0, 10)}-${process.env.BEDROCK_MODE ?? 'stub'}`;
const client = makeClient();
const deps = {client, clipsDir: 'clips', costLogPath: 'eval/cost_log.csv', defaultClip: 'tos'};
const questions = readFileSync('eval/questions.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));

const rows = [];
for (const q of questions) {
  const started = Date.now();
  try {
    const res = await handleAsk({clipId: q.clipId, timestamp: q.timestamp, question: q.question}, deps);
    rows.push({...q, ...res, error: null});
  } catch (e) {
    rows.push({...q, answer: null, latencyMs: Date.now() - started, error: String(e)});
  }
}
mkdirSync('eval/results', {recursive: true});
writeFileSync(`eval/results/${label}.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

const lat = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
const pct = (p: number) => lat[Math.min(lat.length - 1, Math.floor((p / 100) * lat.length))];
console.log(`mode=${client.mode} questions=${rows.length} errors=${rows.filter((r) => r.error).length} p50=${pct(50)}ms p95=${pct(95)}ms`);
console.log('NOTE: answers are not graded here; grade by hand (see docs/PROGRESS.md).');
