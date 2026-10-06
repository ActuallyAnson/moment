// Usage: node backend/scripts/make-review-page.ts [--split dev2,holdout2]   -> writes eval/review.html (local file, not committed)
// A page with each clip's video and its questions; each question has a button that jumps to its timestamp.
import {readFileSync, writeFileSync} from 'node:fs';
import {loadManifest} from '../src/clipprep.ts';

type Q = {id: string; clipId: string; timestamp: number; category: string; question: string; expectedAnswer: string; confirmed: boolean; split: string};
const splitArg = process.argv.indexOf('--split') >= 0 ? process.argv[process.argv.indexOf('--split') + 1].split(',') : null;
const questions: Q[] = readFileSync('eval/questions.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((q: Q) => !splitArg || splitArg.includes(q.split));
const manifest = loadManifest();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

const sections = Object.keys(manifest).map((id) => {
  const qs = questions.filter((q) => q.clipId === id);
  const rows = qs
    .map(
      (q) => `<tr class="${q.confirmed ? 'done' : ''}">
  <td><button onclick="jump('${id}',${q.timestamp})">&#9654; ${mmss(q.timestamp)}</button></td>
  <td><b>${esc(q.id)}</b><br><small>${esc(q.category)}<br>${esc(q.split)}</small></td>
  <td>${esc(q.question)}</td><td>${esc(q.expectedAnswer)}</td></tr>`,
    )
    .join('\n');
  return `<section><h2>${esc(manifest[id].title)} <small>(${id})</small></h2>
<video id="v_${id}" src="../clips/${id}/clip.mp4" controls muted preload="metadata"></video>
<table><tr><th></th><th>id</th><th>Question asked</th><th>Expected answer (check it!)</th></tr>${rows}</table></section>`;
}).join('\n');

writeFileSync('eval/review.html', `<!doctype html><meta charset="utf-8"><title>Moment: question review</title>
<style>body{font:16px system-ui;max-width:1100px;margin:24px auto;padding:0 16px}video{width:100%;max-width:720px;display:block;margin:8px 0}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ccc;padding:6px;vertical-align:top;text-align:left}
button{font-size:15px;padding:6px 10px;cursor:pointer}tr.done{background:#eef9ee}small{color:#666}</style>
<h1>Moment: question review</h1>
<p>For each row: press the button to jump the video to that moment, then check that the <b>expected answer</b> is right. Green rows are already confirmed.
Reply with the ids that are wrong (or "all good").</p>
${sections}
<script>function jump(id,t){const v=document.getElementById('v_'+id);v.currentTime=t;v.pause();v.scrollIntoView({block:'center'})}</script>`);
console.log(`wrote eval/review.html (${questions.length} questions)`);
