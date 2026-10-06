import {formatTime, replayTarget, spokenTime, windowNote} from '../src/format';

describe('formatTime', () => {
  test('formats m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(12.9)).toBe('0:12');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(-3)).toBe('0:00');
  });
});

describe('spokenTime', () => {
  test('words for a screen reader', () => {
    expect(spokenTime(0)).toBe('the start');
    expect(spokenTime(1)).toBe('1 second');
    expect(spokenTime(12)).toBe('12 seconds');
    expect(spokenTime(60)).toBe('1 minute');
    expect(spokenTime(65)).toBe('1 minute 5 seconds');
    expect(spokenTime(125)).toBe('2 minutes 5 seconds');
  });
});

describe('windowNote', () => {
  test('uses the real window and mentions dialogue only when it was used', () => {
    expect(windowNote(15, [11, 12, 13, 14, 15], 0)).toBe('Based on the last 4 seconds of video');
    expect(windowNote(15, [11, 13, 15], 2)).toBe('Based on the last 4 seconds of video and recent dialogue (subtitles)');
  });
  test('near the start or with missing data', () => {
    expect(windowNote(0.2, [0], 0)).toBe('Based on this moment');
    expect(windowNote(5, undefined, undefined)).toBe('Based on this moment');
    expect(windowNote(5, [], 3)).toBe('Based on this moment');
    expect(windowNote(5, [4], 0)).toBe('Based on the last 1 second of video');
  });
});

describe('replayTarget', () => {
  test('ten seconds back, clamped at the start, safe for bad input', () => {
    expect(replayTarget(25)).toBe(15);
    expect(replayTarget(10)).toBe(0);
    expect(replayTarget(3)).toBe(0);
    expect(replayTarget(0)).toBe(0);
    expect(replayTarget(NaN)).toBe(0);
  });
});
