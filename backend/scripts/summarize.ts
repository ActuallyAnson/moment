// Usage: node backend/scripts/summarize.ts <runDir> [<runDir> ...]   (the first dir is the pairing reference)
// Joins raw answers with the owner's grades (eval/grades/manual.csv) and writes eval/results/summary.md.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {parseCsv} from '../src/csv.ts';
import {gradeKey, paired, summarize} from '../src/evalstats.ts';
import type {Grade, Row} from '../src/evalstats.ts';

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('usage: summarize.ts <runDir> ...');
  process.exit(1);
}
const grades = new Map<string, Grade>(
  existsSync('eval/grades/manual.csv') ? parseCsv(readFileSync('eval/grades/manual.csv', 'utf8')).map((r) => [r.key, r.grade as Grade]) : [],
);
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

const runs = dirs.map((d) => {
  const meta = JSON.parse(readFileSync(`${d}/meta.json`, 'utf8'));
  const rows: (Row & {run: number})[] = readFileSync(`${d}/raw.jsonl`, 'utf8').trim().split('\n').map((l) => {
    const r = JSON.parse(l);
    return {id: r.id, run: r.run ?? 0, category: r.category, answer: r.answer, latencyMs: r.latencyMs, costUsd: r.costUsd, error: r.error, grade: r.answer === null ? undefined : grades.get(gradeKey(r.id, r.answer))};
  });
  return {dir: d, meta, rows: rows.filter((r) => r.run === 0), all: rows};
});

const lines: string[] = ['# Eval summary', '', `Generated ${new Date().toISOString()}. Accuracy = (correct + 0.5 x partial) / graded. Grades are assistant-graded against the owner-confirmed expected answers; an owner spot-check sample validates them (see PROGRESS).`, ''];
lines.push('| config | n | graded | accuracy | halluc. | not-visible abstain | false abstain | p50 ms | p95 ms | $/question |', '|---|---|---|---|---|---|---|---|---|---|');
const sums = runs.map((r) => ({r, s: summarize(r.rows)}));
for (const {r, s} of sums) {
  lines.push(`| ${r.meta.config} | ${s.n} | ${s.graded} | ${pct(s.accuracy)} | ${pct(s.hallucinationRate)} | ${pct(s.notVisibleAbstention)} | ${pct(s.falseAbstention)} | ${s.p50} | ${s.p95} | ${s.costPerQuestion.toFixed(5)} |`);
}
const cats = [...new Set(runs.flatMap((r) => r.rows.map((x) => x.category)))].sort();
lines.push('', '## Accuracy by category (graded items; differences of 1-2 items are noise)', '', `| config | ${cats.join(' | ')} |`, `|---|${cats.map(() => '---').join('|')}|`);
for (const {r, s} of sums) {
  lines.push(`| ${r.meta.config} | ${cats.map((c) => (s.byCategory[c] ? `${pct(s.byCategory[c].accuracy)} (${s.byCategory[c].n})` : '-')).join(' | ')} |`);
}
if (runs.length > 1) {
  lines.push('', `## Paired comparison vs ${runs[0].meta.config} (questions where both are graded)`, '', '| config | wins | losses | ties |', '|---|---|---|---|');
  for (const r of runs.slice(1)) {
    const p = paired(r.rows, runs[0].rows);
    lines.push(`| ${r.meta.config} | ${p.wins} | ${p.losses} | ${p.ties} |`);
  }
}
const ungraded = sums.reduce((s, x) => s + (x.s.n - x.s.graded), 0);
lines.push('', `Ungraded answers: ${ungraded}. Runs: ${runs.map((r) => `${r.dir} (${r.meta.command})`).join('; ')}`);
writeFileSync('eval/results/summary.md', lines.join('\n') + '\n');
console.log(lines.join('\n'));
