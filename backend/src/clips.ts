import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {parseSrt} from './srt.ts';
import type {Cue} from './srt.ts';
import type {Frame} from './window.ts';

export type ClipIndex = {
  id: string;
  duration: number;
  fps: number;
  width: number;
  frames: Frame[]; // path is relative to the clip directory
  source: string;
  license: string;
  attribution: string;
  excerpt: {startSec: number; durationSec: number};
};

export type Clip = {dir: string; index: ClipIndex; cues: Cue[]};

const ID = /^[a-z0-9_-]+$/;
const cache = new Map<string, Clip>();

export const loadClip = async (clipsDir: string, id: string): Promise<Clip> => {
  if (!ID.test(id)) {
    throw new Error('invalid clip id');
  }
  const key = `${clipsDir}::${id}`;
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  const dir = join(clipsDir, id);
  const index = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8')) as ClipIndex;
  let cues: Cue[] = [];
  try {
    cues = parseSrt(await readFile(join(dir, 'subs.srt'), 'utf8'));
  } catch {
    // subtitles are optional
  }
  const clip = {dir, index, cues};
  cache.set(key, clip);
  return clip;
};

export const readFrames = (clip: Clip, frames: Frame[]): Promise<Uint8Array[]> =>
  Promise.all(frames.map((f) => readFile(join(clip.dir, f.path))));
