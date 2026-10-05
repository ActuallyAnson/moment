// Usage: node backend/scripts/grade-page.ts <runDir> [<runDir> ...]
// Builds eval/grading/grade.html: a blind (config names hidden), shuffled page where the owner clicks
// correct / partial / wrong / hallucinated for each distinct answer. Answers already graded in
// eval/grades/manual.csv are skipped; identical answers across configs appear once.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {parseCsv} from '../src/csv.ts';
import {gradeKey} from '../src/evalstats.ts';

const argv = process.argv.slice(2);
const onlyAt = argv.indexOf('--only');
const onlyKeys = onlyAt >= 0 ? new Set(readFileSync(argv[onlyAt + 1], 'utf8').split('\n').filter(Boolean)) : null;
const dirs = argv.filter((a, i) => !a.startsWith('--') && (onlyAt < 0 || i !== onlyAt + 1));
if (!dirs.length) {
  console.error('usage: grade-page.ts <runDir> ...');
  process.exit(1);
}
const questions = new Map<string, Record<string, unknown>>(
  readFileSync('eval/questions.jsonl', 'utf8').trim().split('\n').map((l) => { const q = JSON.parse(l); return [q.id, q]; }),
);
const done = new Set(existsSync('eval/grades/manual.csv') ? parseCsv(readFileSync('eval/grades/manual.csv', 'utf8')).map((r) => r.key) : []);

const items = new Map<string, Record<string, unknown>>();
for (const d of dirs) {
  for (const line of readFileSync(`${d}/raw.jsonl`, 'utf8').trim().split('\n')) {
    const r = JSON.parse(line);
    if (r.answer === null) {
      continue;
    }
    const key = gradeKey(r.id, r.answer);
    const q = questions.get(r.id) as Record<string, string | number>;
    if ((onlyKeys ? onlyKeys.has(key) : !done.has(key)) && !items.has(key)) {
      items.set(key, {key, id: r.id, clip: q.clipId, t: q.timestamp, category: q.category, question: q.question, expected: q.expectedAnswer, acceptable: q.acceptable, answer: r.answer});
    }
  }
}
// deterministic shuffle so the order does not follow config or question order
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const list = [...items.values()].sort(() => rnd() - 0.5);

mkdirSync('eval/grading', {recursive: true});
const data = JSON.stringify(list).replace(/</g, '\\u003c');
writeFileSync(onlyKeys ? 'eval/grading/recheck.html' : 'eval/grading/grade.html', `<!doctype html><meta charset="utf-8"><title>Moment: grading</title>
<style>body{font:16px system-ui;margin:0}#top{position:sticky;top:0;background:#fff;border-bottom:1px solid #ccc;padding:8px 16px;z-index:5}
#top video{height:200px;float:right;margin-left:16px}main{max-width:900px;margin:0 auto;padding:16px}
.card{border:1px solid #ccc;border-radius:8px;padding:12px;margin:12px 0}.card.done{background:#eef9ee}.ans{font-size:20px;margin:8px 0;padding:8px;background:#f5f5f5}
.exp{color:#444}button{font-size:15px;padding:7px 11px;margin:3px;cursor:pointer}button.sel{outline:3px solid #06c;font-weight:bold}small{color:#666}</style>
<div id="top"><video id="v" muted controls></video><b id="prog"></b>
<p><b>correct</b>: matches the expected answer (extra detail is fine). <b>partial</b>: right but incomplete or vague.
<b>wrong</b>: incorrect, or says "I'm not sure" when the answer is visible. <b>hallucinated</b>: states something specific that is not in the video (invented name, brand, text, object).
For "not visible" questions, "I'm not sure" is correct.</p>
<button onclick="dl()">Download grades.csv</button> <small>(progress is saved in this browser automatically)</small></div>
<main id="m"></main>
<script>
const items=${data};const KEY='${onlyKeys ? 'moment-recheck-v1' : 'moment-grades-v1'}';let g={};try{g=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const m=document.getElementById('m');
const mm=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function save(){try{localStorage.setItem(KEY,JSON.stringify(g))}catch(e){};prog()}
function prog(){document.getElementById('prog').textContent=Object.keys(g).filter(k=>g[k].grade).length+' / '+items.length+' graded'}
function show(clip,t){const v=document.getElementById('v');const src='../../clips/'+clip+'/clip.mp4';if(!v.src.endsWith('/clips/'+clip+'/clip.mp4'))v.src=src;v.currentTime=t;v.pause()}
items.forEach(it=>{const d=document.createElement('div');d.className='card'+(g[it.key]?.grade?' done':'');d.id='c_'+it.key;
d.innerHTML='<small>'+it.category+'</small> <b>'+it.question+'</b> <small>at '+mm(it.t)+' in '+it.clip+'</small> <button onclick="show(\\''+it.clip+'\\','+it.t+')">&#9654; show moment</button>'
+'<div class="ans">'+it.answer.replace(/</g,'&lt;')+'</div><div class="exp">Expected: '+it.expected.replace(/</g,'&lt;')+'</div><div>'
+['correct','partial','wrong','hallucinated'].map(x=>'<button data-k="'+it.key+'" data-g="'+x+'" class="'+(g[it.key]?.grade===x?'sel':'')+'">'+x+'</button>').join('')
+' <input placeholder="note (optional)" value="'+(g[it.key]?.note||'').replace(/"/g,'&quot;')+'" data-n="'+it.key+'" size="30"></div>';m.appendChild(d)});
m.addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(!b)return;const k=b.dataset.k;g[k]={...(g[k]||{}),grade:b.dataset.g};
document.querySelectorAll('button[data-k="'+k+'"]').forEach(x=>x.classList.toggle('sel',x===b));document.getElementById('c_'+k).classList.add('done');save()});
m.addEventListener('input',e=>{const k=e.target.dataset.n;if(k){g[k]={...(g[k]||{}),note:e.target.value};save()}});
function dl(){const rows=['key,grade,note'];Object.entries(g).forEach(([k,v])=>{if(v.grade)rows.push([k,v.grade,'"'+(v.note||'').replace(/"/g,'""')+'"'].join(','))});
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\\n')+'\\n'],{type:'text/csv'}));a.download='${onlyKeys ? 'recheck.csv' : 'grades.csv'}';a.click()}
prog();
</script>`);
console.log(`${onlyKeys ? 'eval/grading/recheck.html' : 'eval/grading/grade.html'}: ${list.length} answers to grade (${done.size} already graded keys skipped)`);
