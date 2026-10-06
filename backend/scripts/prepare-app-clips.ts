// Usage: node backend/scripts/prepare-app-clips.ts [clipId ...]   (default: all clips in clips/manifest.json that are prepared)
// Copies clips/<id>/clip.mp4 into the app bundle as app/assets/raw/<id>.mp4 and writes app/src/clips.ts (id, title,
// attribution, file) for the clip picker. Prepare the clips first: node backend/scripts/fetch-clips.ts
// Rebuild the app afterwards. The media files in app/assets/raw are not committed (see .gitignore).
import {copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadManifest} from '../src/clipprep.ts';

const manifest = loadManifest();
const ids = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(manifest);
mkdirSync('app/assets/raw', {recursive: true});
for (const f of readdirSync('app/assets/raw')) {
  if (f.endsWith('.mp4')) {
    rmSync(`app/assets/raw/${f}`);
  }
}
const entries: string[] = [];
const posters: string[] = [];
// A representative moment for each card's poster (seconds into the excerpt), avoiding credit text.
const POSTER_AT: Record<string, number> = {tos: 9, sintel: 24.5, bbb: 12, spring: 31, llama: 12, marketst: 14};
mkdirSync('app/src/assets/posters', {recursive: true});
for (const id of ids) {
  if (!manifest[id]) {
    console.error(`unknown clip "${id}"; choose from: ${Object.keys(manifest).join(', ')}`);
    process.exit(1);
  }
  const src = `clips/${id}/clip.mp4`;
  if (!existsSync(src)) {
    console.error(`${src} not found; run: node backend/scripts/fetch-clips.ts ${id}`);
    process.exit(1);
  }
  copyFileSync(src, `app/assets/raw/${id}.mp4`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(POSTER_AT[id] ?? 2), '-i', src, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '5', `app/src/assets/posters/${id}.jpg`]);
  posters.push(`  ${JSON.stringify(id)}: require('./assets/posters/${id}.jpg'),`);
  const m = manifest[id];
  entries.push(`  {id: ${JSON.stringify(id)}, title: ${JSON.stringify(m.title)}, file: ${JSON.stringify(`/pkg/assets/raw/${id}.mp4`)}, attribution: ${JSON.stringify(m.attribution)}, license: ${JSON.stringify(m.license)}},`);
}
writeFileSync(
  'app/src/clips.ts',
  `// Written by backend/scripts/prepare-app-clips.ts: the clips bundled in the app (shown in the clip picker).\nexport type BundledClip = {id: string; title: string; file: string; attribution: string; license: string};\nexport const CLIPS: BundledClip[] = [\n${entries.join('\n')}\n];\n`,
);
writeFileSync(
  'app/src/posters.ts',
  `// Written by backend/scripts/prepare-app-clips.ts: poster frames for the clip picker.\n/* eslint-disable @typescript-eslint/no-var-requires */\nexport const POSTERS: Record<string, number> = {\n${posters.join('\n')}\n};\n`,
);
console.log(`bundled ${ids.length} clip(s): ${ids.join(', ')}; rebuild the app to include them`);
