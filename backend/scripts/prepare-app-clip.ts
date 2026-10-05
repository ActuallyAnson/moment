// Usage: node backend/scripts/prepare-app-clip.ts [clipId]   (default: tos)
// Copies clips/<id>/clip.mp4 into the app bundle (app/assets/raw/clip.mp4) and records which clip the app
// asks about (app/src/clip.ts). Run clips preparation first: node backend/scripts/fetch-clips.ts
// Rebuild the app afterwards.
import {copyFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {loadManifest} from '../src/clipprep.ts';

const id = process.argv[2] ?? 'tos';
const manifest = loadManifest();
if (!manifest[id]) {
  console.error(`unknown clip "${id}"; choose one of: ${Object.keys(manifest).join(', ')}`);
  process.exit(1);
}
const src = `clips/${id}/clip.mp4`;
if (!existsSync(src)) {
  console.error(`${src} not found; run: node backend/scripts/fetch-clips.ts ${id}`);
  process.exit(1);
}
mkdirSync('app/assets/raw', {recursive: true});
copyFileSync(src, 'app/assets/raw/clip.mp4');
writeFileSync('app/src/clip.ts', `// Written by backend/scripts/prepare-app-clip.ts: the clip bundled in the app (${manifest[id].title}).\nexport const CLIP_ID = '${id}';\n`);
console.log(`app now plays "${id}" (${manifest[id].title}); rebuild the app to bundle it`);
