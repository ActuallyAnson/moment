import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSrt, shiftCues, toSrt} from '../src/srt.ts';

const SAMPLE = '﻿1\r\n00:00:23,000 --> 00:00:24,500\r\nYou\'re a jerk.\r\n\r\n2\r\n00:01:02,250 --> 00:01:04,000\r\nLine one\r\nline two\r\n\r\n';

test('parses BOM, CRLF and multi-line cues', () => {
  const cues = parseSrt(SAMPLE);
  assert.equal(cues.length, 2);
  assert.deepEqual(cues[0], {start: 23, end: 24.5, text: "You're a jerk."});
  assert.equal(cues[1].start, 62.25);
  assert.equal(cues[1].text, 'Line one line two');
});

test('empty input gives no cues', () => {
  assert.deepEqual(parseSrt(''), []);
});

test('shiftCues re-times, drops outside cues and clamps', () => {
  const cues = [
    {start: 5, end: 8, text: 'before'},
    {start: 18, end: 25, text: 'straddles start'},
    {start: 30, end: 32, text: 'inside'},
    {start: 64, end: 70, text: 'straddles end'},
    {start: 90, end: 92, text: 'after'},
  ];
  const out = shiftCues(cues, 20, 45);
  assert.deepEqual(out.map((c) => c.text), ['straddles start', 'inside', 'straddles end']);
  assert.equal(out[0].start, 0);
  assert.equal(out[0].end, 5);
  assert.equal(out[2].end, 45);
});

test('toSrt round-trips through parseSrt', () => {
  const cues = [{start: 3, end: 4.5, text: 'hello'}];
  assert.deepEqual(parseSrt(toSrt(cues)), cues);
});
