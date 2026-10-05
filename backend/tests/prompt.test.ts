import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildPrompt, SYSTEM_PROMPT} from '../src/prompt.ts';
import {parseAnswer, NOT_SURE} from '../src/answer.ts';

test('prompt carries question, timestamps, subtitles and the rules', () => {
  const p = buildPrompt({
    question: 'What does the text say?',
    t: 12.5,
    frames: [{t: 9, path: 'a'}, {t: 12.5, path: 'b'}],
    cues: [{start: 10, end: 12, text: 'Hello Thom'}],
  });
  assert.match(p.user, /12\.5 s/);
  assert.match(p.user, /image 1 at 9\.0 s, image 2 at 12\.5 s/);
  assert.match(p.user, /\[10\.0-12\.0 s\] Hello Thom/);
  assert.match(p.user, /Question: What does the text say\?/);
  assert.match(SYSTEM_PROMPT, /two short sentences/);
  assert.match(SYSTEM_PROMPT, /I'm not sure/);
  assert.match(SYSTEM_PROMPT, /Do not identify real people/);
});

test('prompt handles no frames and no subtitles', () => {
  const p = buildPrompt({question: 'q', t: 0, frames: [], cues: []});
  assert.match(p.user, /No frames are available/);
  assert.match(p.user, /No subtitles near this moment/);
});

test('parseAnswer trims, strips markdown and keeps two sentences', () => {
  assert.equal(parseAnswer('  **Two people** argue on a bridge. One gestures.  A third sentence. '), 'Two people argue on a bridge. One gestures.');
  assert.equal(parseAnswer('"A sign reads OPEN."'), 'A sign reads OPEN.');
});

test('parseAnswer strips an "Answer:" label', () => {
  assert.equal(parseAnswer('Answer: A man and a woman.'), 'A man and a woman.');
  assert.equal(parseAnswer('answer:  Two figures.'), 'Two figures.');
});

test('parseAnswer maps empty output to not sure', () => {
  assert.equal(parseAnswer(''), NOT_SURE);
  assert.equal(parseAnswer(undefined), NOT_SURE);
  assert.equal(parseAnswer('   '), NOT_SURE);
});

test('prompt v3 labels dialogue as audio, gives offsets and carries the new rules', async () => {
  const {buildPrompt, SYSTEM_PROMPT_V3} = await import('../src/prompt.ts');
  const p = buildPrompt(
    {question: 'Who is on screen?', t: 20, frames: [{t: 19, path: 'a'}], cues: [{start: 10, end: 12, text: 'Hello'}, {start: 19, end: 22, text: 'Now'}]},
    'v3',
  );
  assert.match(p.user, /Spoken dialogue \(audio transcript, NOT visible on screen; speakers are not labeled\)/);
  assert.match(p.user, /\[8 s before the pause\] Hello/);
  assert.match(p.user, /\[being spoken at the pause\] Now/);
  assert.match(SYSTEM_PROMPT_V3, /Never quote dialogue as on-screen text/);
  assert.match(SYSTEM_PROMPT_V3, /does not say who is speaking/);
  assert.match(SYSTEM_PROMPT_V3, /left to right/);
});
