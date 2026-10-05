import type {Cue} from './srt.ts';

export type Frame = {t: number; path: string};

export type WindowConfig = {
  lookbackSec: number; // frames from [T - lookbackSec, T]
  maxFrames: number;
  cueRadiusSec: number; // subtitles overlapping [T - r, T + r]; 0 disables subtitles
  cueAheadSec?: number; // how far past T to look (default: same as cueRadiusSec); 0 = never use future dialogue
};

export const DEFAULT_WINDOW: WindowConfig = {lookbackSec: 4, maxFrames: 5, cueRadiusSec: 10};

// Frames in the lookback window, thinned to at most maxFrames evenly spaced, always
// keeping the newest. If the window is empty (e.g. T near 0), fall back to the nearest
// earlier frame, then to the first frame.
export const selectFrames = (frames: Frame[], T: number, cfg: WindowConfig = DEFAULT_WINDOW): Frame[] => {
  const sorted = [...frames].sort((a, b) => a.t - b.t);
  const inWindow = sorted.filter((f) => f.t <= T && f.t >= T - cfg.lookbackSec);
  if (inWindow.length === 0) {
    const earlier = sorted.filter((f) => f.t <= T);
    if (earlier.length) {
      return [earlier[earlier.length - 1]];
    }
    return sorted.length ? [sorted[0]] : [];
  }
  if (inWindow.length <= cfg.maxFrames) {
    return inWindow;
  }
  if (cfg.maxFrames <= 1) {
    return [inWindow[inWindow.length - 1]];
  }
  const n = inWindow.length;
  const picked: Frame[] = [];
  for (let i = 0; i < cfg.maxFrames; i++) {
    picked.push(inWindow[Math.round((i * (n - 1)) / (cfg.maxFrames - 1))]);
  }
  return picked;
};

export const selectCues = (cues: Cue[], T: number, radius: number, ahead: number = radius): Cue[] =>
  radius <= 0 ? [] : cues.filter((c) => c.end >= T - radius && c.start <= T + ahead);
