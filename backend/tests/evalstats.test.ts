import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv, toCsv} from '../src/csv.ts';
import {gradeKey, isAbstention, normalizeAnswer, paired, percentile, summarize} from '../src/evalstats.ts';
import type {Row} from '../src/evalstats.ts';

test('csv round trip with quotes, commas and newlines', () => {
  const rows = [{a: 'x,y', b: 'say "hi"', c: 'line1\nline2'}];
  assert.deepEqual(parseCsv(toCsv(rows, ['a', 'b', 'c'])), rows);
});

test('gradeKey: same answer text (case/punctuation) shares a key; different question or answer does not', () => {
  assert.equal(gradeKey('q1', 'Two people!'), gradeKey('q1', 'two people'));
  assert.notEqual(gradeKey('q1', 'two people'), gradeKey('q2', 'two people'));
  assert.notEqual(gradeKey('q1', 'two people'), gradeKey('q1', 'three people'));
  assert.equal(normalizeAnswer("  I'm   NOT sure. "), "i'm not sure");
});

test('abstention detection', () => {
  assert.ok(isAbstention("I'm not sure."));
  assert.ok(isAbstention('No text is visible.'));
  assert.ok(!isAbstention('Two people on a bridge.'));
  assert.ok(!isAbstention(null));
});

test('percentile', () => {
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50), 6);
  assert.equal(percentile([], 95), 0);
});

const row = (id: string, category: string, answer: string, grade?: Row['grade'], latencyMs = 100): Row => ({id, category, answer, latencyMs, costUsd: 0.001, grade});

test('summarize: accuracy, hallucination, abstention rates', () => {
  const s = summarize([
    row('a', 'action', 'x', 'correct'),
    row('b', 'action', 'y', 'partial'),
    row('c', 'not visible', "I'm not sure.", 'correct'),
    row('d', 'not visible', 'The brand is Ford.', 'hallucinated'),
    row('e', 'identity', "I'm not sure.", 'wrong'),
    row('f', 'identity', 'z'),
  ]);
  assert.equal(s.n, 6);
  assert.equal(s.graded, 5);
  assert.equal(s.accuracy, (1 + 0.5 + 1 + 0 + 0) / 5);
  assert.equal(s.hallucinationRate, 1 / 5);
  assert.equal(s.notVisibleAbstention, 0.5);
  assert.equal(s.falseAbstention, 1 / 4);
  assert.equal(s.byCategory['not visible'].n, 2);
});

test('paired comparison counts wins, losses, ties and ignores ungraded', () => {
  const a = [row('1', 'x', 'a', 'correct'), row('2', 'x', 'a', 'wrong'), row('3', 'x', 'a', 'partial'), row('4', 'x', 'a')];
  const b = [row('1', 'x', 'b', 'wrong'), row('2', 'x', 'b', 'correct'), row('3', 'x', 'b', 'partial'), row('4', 'x', 'b', 'correct')];
  assert.deepEqual(paired(a, b), {wins: 1, losses: 1, ties: 1});
});
