// Usage: node backend/scripts/spend.ts   -> totals eval/cost_log.csv (live Bedrock calls only)
import {readFileSync} from 'node:fs';
import {parseCsv} from '../src/csv.ts';

const rows = parseCsv(readFileSync('eval/cost_log.csv', 'utf8'));
const by = new Map<string, {calls: number; usd: number; inTok: number; outTok: number}>();
for (const r of rows) {
  const m = by.get(r.model) ?? {calls: 0, usd: 0, inTok: 0, outTok: 0};
  m.calls++;
  m.usd += Number(r.est_cost_usd) || 0;
  m.inTok += Number(r.input_tokens) || 0;
  m.outTok += Number(r.output_tokens) || 0;
  by.set(r.model, m);
}
let total = 0;
let calls = 0;
for (const [model, m] of by) {
  console.log(`${model}: ${m.calls} calls, ${m.inTok} input / ${m.outTok} output tokens, $${m.usd.toFixed(4)}`);
  total += m.usd;
  calls += m.calls;
}
console.log(`TOTAL: ${calls} live calls, $${total.toFixed(4)} (budget $150)`);
