// Usage: node backend/scripts/run.ts <config> [--split dev|test|all] [--ids q01,q02] [--clip tos] [--repeat N] [--stub]
// Runs the questions under eval/configs/<config>.json, one at a time (clean latency), never using the cache.
// Output: eval/results/<config>__<date>__<hash>/{raw.jsonl,meta.json}
import {execSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {handleAsk, configHash} from '../src/ask.ts';
import {LiveClient, StubClient} from '../src/bedrock.ts';
import {estimateCost} from '../src/cost.ts';
import {PROMPT_VERSION, SYSTEM_PROMPT, SYSTEM_PROMPT_V3} from '../src/prompt.ts';

const args = process.argv.slice(2);
const name = args[0];
if (!name) {
  console.error('usage: run.ts <config> [--split dev|test|all] [--ids a,b] [--clip id] [--repeat N] [--stub]');
  process.exit(1);
}
const flag = (f: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const split = flag('--split') ?? 'all';
const repeat = Number(flag('--repeat') ?? 1);
const ids = flag('--ids')?.split(',');
const clip = flag('--clip');
const stub = args.includes('--stub') || process.env.BEDROCK_MODE === 'stub';

const cfgText = readFileSync(`eval/configs/${name}.json`, 'utf8');
const cfg = JSON.parse(cfgText);
const window = {lookbackSec: cfg.lookbackSec, maxFrames: cfg.maxFrames, cueRadiusSec: cfg.cueRadiusSec, cueAheadSec: cfg.cueAheadSec};
const promptVersion = cfg.promptVersion ?? 'v2';
const routeTextPreset = cfg.subtitleMode === 'routed';
const client = stub ? new StubClient(0) : new LiveClient(cfg.model, cfg.region, 6000, {temperature: cfg.temperature, maxTokens: cfg.maxTokens});
const costLogPath = stub ? '/dev/null' : 'eval/cost_log.csv';

let questions = readFileSync('eval/questions.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
questions = questions.filter((q) => (split === 'all' || q.split === split) && (!ids || ids.includes(q.id)) && (!clip || q.clipId === clip));

const hash = createHash('sha256').update(cfgText + PROMPT_VERSION + SYSTEM_PROMPT + SYSTEM_PROMPT_V3).digest('hex').slice(0, 8);
const dir = `eval/results/${name}__${split}__${new Date().toISOString().slice(0, 10)}__${hash}${stub ? '-stub' : ''}`;
if (existsSync(dir)) {
  console.error(`${dir} already exists; refusing to overwrite results (delete it or change the config)`);
  process.exit(1);
}
mkdirSync(dir, {recursive: true});

const rows: Record<string, unknown>[] = [];
for (let run = 0; run < repeat; run++) {
  for (const q of questions) {
    try {
      const r = await handleAsk(
        {clipId: q.clipId, timestamp: q.timestamp, question: q.question},
        {client, clipsDir: 'clips', costLogPath, window, promptVersion, routeTextPreset, noCache: true, retry: {attemptTimeoutsMs: [8000, 8000], backoffMs: 300}},
        {rid: `eval-${name}`},
      );
      const costUsd = stub ? 0 : (estimateCost(r.model, cfg.region, r.inputTokens ?? 0, r.outputTokens ?? 0) ?? 0);
      rows.push({id: q.id, run, config: name, category: q.category, split: q.split, ...r, costUsd, error: null});
    } catch (e) {
      rows.push({id: q.id, run, config: name, category: q.category, split: q.split, answer: null, latencyMs: 0, error: String(e)});
      console.error(`${q.id} failed: ${e}`);
    }
  }
}
writeFileSync(`${dir}/raw.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
let sha = 'unknown';
try {
  sha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not a git checkout
}
writeFileSync(`${dir}/meta.json`, JSON.stringify({config: name, cfg, configHash: configHash(window, cfg.model, promptVersion, routeTextPreset), promptVersion, gitSha: sha, date: new Date().toISOString(), command: `node backend/scripts/run.ts ${args.join(' ')}`, questions: questions.length, repeat, stub}, null, 2));
const errs = rows.filter((r) => r.error).length;
console.log(`${dir}: ${rows.length} answers, ${errs} errors`);
