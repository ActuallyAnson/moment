// Usage: node backend/scripts/grade-import.ts <grades.csv>
// Merges the owner's downloaded grades into eval/grades/manual.csv (later grades replace earlier ones for a key).
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {parseCsv, toCsv} from '../src/csv.ts';
import {GRADES} from '../src/evalstats.ts';

const file = process.argv[2];
if (!file) {
  console.error('usage: grade-import.ts <grades.csv>');
  process.exit(1);
}
const path = 'eval/grades/manual.csv';
const merged = new Map<string, Record<string, string>>();
if (existsSync(path)) {
  for (const r of parseCsv(readFileSync(path, 'utf8'))) {
    merged.set(r.key, r);
  }
}
let added = 0;
for (const r of parseCsv(readFileSync(file, 'utf8'))) {
  if (!GRADES.includes(r.grade as never)) {
    console.error(`skipping ${r.key}: bad grade "${r.grade}"`);
    continue;
  }
  merged.set(r.key, {key: r.key, grade: r.grade, note: r.note ?? ''});
  added++;
}
mkdirSync('eval/grades', {recursive: true});
writeFileSync(path, toCsv([...merged.values()], ['key', 'grade', 'note']));
console.log(`imported ${added} grades; ${merged.size} total in ${path}`);
