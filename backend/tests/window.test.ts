import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectCues, selectFrames, DEFAULT_WINDOW} from '../src/window.ts';

const frames = Array.from({length: 20}, (_, i) => ({t: i / 2, path: `f${i}.jpg`})); // 0..9.5 s at 2 fps

test('picks 5 evenly spaced frames from the last 4 s, newest included', () => {
  const got = selectFrames(frames, 8, DEFAULT_WINDOW).map((f) => f.t);
  assert.equal(got.length, 5);
  assert.equal(got[got.length - 1], 8);
  assert.equal(got[0], 4);
});

test('T between frames uses frames at or before T', () => {
  const got = selectFrames(frames, 8.3).map((f) => f.t);
  assert.ok(got.every((t) => t <= 8.3));
  assert.equal(got[got.length - 1], 8);
});

test('near the start returns what exists', () => {
  assert.deepEqual(selectFrames(frames, 0).map((f) => f.t), [0]);
  assert.deepEqual(selectFrames(frames, 1).map((f) => f.t), [0, 0.5, 1]);
});

test('past the end falls back to the latest frame', () => {
  assert.deepEqual(selectFrames(frames, 50).map((f) => f.t), [9.5]);
});

test('single-frame and 3-frame configs', () => {
  assert.deepEqual(selectFrames(frames, 8, {lookbackSec: 0, maxFrames: 1, cueRadiusSec: 0}).map((f) => f.t), [8]);
  assert.equal(selectFrames(frames, 8, {lookbackSec: 2, maxFrames: 3, cueRadiusSec: 0}).length, 3);
});

test('empty frame list gives empty result', () => {
  assert.deepEqual(selectFrames([], 5), []);
});

test('selectCues returns overlapping cues, boundaries inclusive, radius 0 disables', () => {
  const cues = [
    {start: 0, end: 1, text: 'a'},
    {start: 9, end: 11, text: 'b'},
    {start: 25, end: 26, text: 'c'},
  ];
  assert.deepEqual(selectCues(cues, 15, 10).map((c) => c.text), ['b', 'c']);
  assert.deepEqual(selectCues(cues, 15, 0), []);
});
