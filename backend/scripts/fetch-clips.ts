// Usage: node backend/scripts/fetch-clips.ts [id ...]
// For each clip in clips/manifest.json: cut the excerpt (audio replaced with silence, see clips/NOTICE.md),
// download optional subtitles, extract frames and write clips/<id>/index.json.
// A full-length source in clips/.cache/<id>.src is used if present; otherwise ffmpeg reads the URL.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {loadManifest, prepareClip} from '../src/clipprep.ts';

const manifest = loadManifest();
const ids = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(manifest);
const UA = 'MomentHackathon/1.0 (https://github.com/ActuallyAnson/moment)';

for (const id of ids) {
  const entry = manifest[id];
  if (!entry) {
    throw new Error(`unknown clip id: ${id}`);
  }
  const dir = join('clips', id);
  mkdirSync(dir, {recursive: true});
  const cached = join('clips', '.cache', `${id}.src`);
  const input = existsSync(cached) ? cached : entry.url;
  const out = join(dir, 'clip.mp4');
  console.log(`[${id}] cutting ${entry.startSec}s +${entry.durationSec}s from ${input === cached ? 'cache' : 'URL'}`);
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    ...(input === entry.url ? ['-user_agent', UA] : []),
    '-ss', String(entry.startSec), '-i', input,
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-map', '0:v:0', '-map', '1:a:0', '-t', String(entry.durationSec), '-shortest',
    '-vf', "scale='min(1280,iw)':-2",
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '23',
    '-maxrate', '1500k', '-bufsize', '3000k', '-g', '48',
    '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', out,
  ]);
  let srt: string | null = null;
  if (entry.srtUrl) {
    const res = await fetch(entry.srtUrl, {headers: {'user-agent': UA}});
    if (!res.ok) {
      throw new Error(`[${id}] subtitle download failed: ${res.status}`);
    }
    srt = await res.text();
  }
  const n = prepareClip(id, entry, out, srt);
  console.log(`[${id}] ${n} frames${srt ? ' + subtitles' : ''}`);
}
