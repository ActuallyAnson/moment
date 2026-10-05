import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {parseSrt, shiftCues, toSrt} from './srt.ts';

export type ManifestEntry = {
  title: string;
  url: string;
  startSec: number;
  durationSec: number;
  srtUrl?: string;
  license: string;
  licenseUrl: string;
  attribution: string;
};

export type Manifest = Record<string, ManifestEntry>;

export const loadManifest = (path = 'clips/manifest.json'): Manifest => JSON.parse(readFileSync(path, 'utf8'));

export const FPS = 2;

// Extracts frames from the TRANSCODED excerpt so frame times match the app's currentTime,
// shifts the subtitles (if any) to excerpt time, and writes clips/<id>/index.json.
export const prepareClip = (id: string, entry: ManifestEntry, video: string, srtText: string | null, width = 512) => {
  const dir = join('clips', id);
  const framesDir = join(dir, 'frames');
  rmSync(framesDir, {recursive: true, force: true});
  mkdirSync(framesDir, {recursive: true});
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', video,
    '-vf', `fps=${FPS},scale=${width}:-2`, '-q:v', '4', '-start_number', '0',
    join(framesDir, 'f_%05d.jpg'),
  ]);
  const files = readdirSync(framesDir).filter((f) => f.endsWith('.jpg')).sort();
  const frames = files.map((f, n) => ({t: n / FPS, path: `frames/${f}`}));
  if (srtText) {
    writeFileSync(join(dir, 'subs.srt'), toSrt(shiftCues(parseSrt(srtText), entry.startSec, entry.durationSec)));
  } else {
    rmSync(join(dir, 'subs.srt'), {force: true});
  }
  const index = {
    id, duration: entry.durationSec, fps: FPS, width, frames,
    source: entry.url, license: entry.license, attribution: entry.attribution,
    excerpt: {startSec: entry.startSec, durationSec: entry.durationSec},
  };
  writeFileSync(join(dir, 'index.json'), JSON.stringify(index, null, 2));
  return frames.length;
};
