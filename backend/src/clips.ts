import {readdir, readFile, rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
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

// Clip ids that have an index.json (i.e. were prepared and can be asked about).
export const listClips = async (clipsDir: string): Promise<string[]> => {
  const out: string[] = [];
  for (const d of await readdir(clipsDir, {withFileTypes: true})) {
    if (d.isDirectory() && ID.test(d.name)) {
      try {
        await readFile(join(clipsDir, d.name, 'index.json'));
        out.push(d.name);
      } catch {
        // not prepared
      }
    }
  }
  return out.sort();
};

const run = promisify(execFile);

// Cut [start, start+dur) from a prepared clip as a small silent mp4 (for models that take video input).
export const cutVideo = async (clipFile: string, start: number, dur: number): Promise<Uint8Array> => {
  const out = join(tmpdir(), `moment-${randomUUID()}.mp4`);
  try {
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', start.toFixed(2), '-t', dur.toFixed(2), '-i', clipFile, '-an', '-vf', 'scale=512:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '28', '-movflags', '+faststart', out]);
    return await readFile(out);
  } finally {
    await rm(out, {force: true});
  }
};
