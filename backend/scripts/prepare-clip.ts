// Usage: node backend/scripts/prepare-clip.ts <id> <clip.mp4> <source.srt> <startSec> <durationSec>
// Extracts keyframes at 2 fps (512 px wide) from the transcoded excerpt, so frame times match the
// app's currentTime, shifts the subtitles to excerpt time, and writes clips/<id>/index.json.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {parseSrt, shiftCues, toSrt} from '../src/srt.ts';

const [id, video, srt, startArg, durationArg] = process.argv.slice(2);
if (!id || !video || !srt || !startArg || !durationArg) {
  console.error('usage: prepare-clip.ts <id> <clip.mp4> <source.srt> <startSec> <durationSec>');
  process.exit(1);
}
const startSec = Number(startArg);
const durationSec = Number(durationArg);
const FPS = 2;
const WIDTH = 512;
const dir = join('clips', id);
const framesDir = join(dir, 'frames');
rmSync(framesDir, {recursive: true, force: true});
mkdirSync(framesDir, {recursive: true});

execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', video,
  '-vf', `fps=${FPS},scale=${WIDTH}:-2`, '-q:v', '4', '-start_number', '0',
  join(framesDir, 'f_%05d.jpg'),
]);

const files = readdirSync(framesDir).filter((f) => f.endsWith('.jpg')).sort();
const frames = files.map((f, n) => ({t: n / FPS, path: `frames/${f}`}));
writeFileSync(join(dir, 'subs.srt'), toSrt(shiftCues(parseSrt(readFileSync(srt, 'utf8')), startSec, durationSec)));
const index = {
  id, duration: durationSec, fps: FPS, width: WIDTH, frames,
  source: 'https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov',
  license: 'CC-BY 3.0',
  attribution: '(CC) Blender Foundation | mango.blender.org',
  excerpt: {startSec, durationSec},
};
writeFileSync(join(dir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`prepared ${id}: ${frames.length} frames, subtitles shifted by -${startSec}s`);
