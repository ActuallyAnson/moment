import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {handleAsk} from '../src/ask.ts';
import type {VisionClient} from '../src/bedrock.ts';
import {AnswerCache} from '../src/cache.ts';

// Guards the evaluation: the four original presets must produce byte-identical prompts, images and cache keys
// after the dialogue preset is added, so the earlier results (test split, holdout2) stay valid.
// The fingerprints below were recorded on main BEFORE the change, using the real prepared clips (clips/tos, clips/sintel).
const CLIPS_DIR = fileURLToPath(new URL('../../clips', import.meta.url));
const MOMENTS: [string, number][] = [['tos', 12], ['tos', 24], ['sintel', 13]];
const PRESETS = ['What just happened?', 'Who is on screen?', 'What does the text say?', 'What should I notice here?'];

const fingerprint = async (clipId: string, t: number, question: string): Promise<{prompt: string; key: string}> => {
  let seen = '';
  const client: VisionClient = {mode: 'stub', region: 'none', answer: async (r) => { seen = JSON.stringify([r.system, r.user, r.images.length]); return {text: 'x', inputTokens: 1, outputTokens: 1, model: 'stub'}; }};
  const cache = new AnswerCache(10);
  await handleAsk({clipId, timestamp: t, question}, {client, clipsDir: CLIPS_DIR, costLogPath: '/dev/null', cache});
  const key = [...(cache as unknown as {map: Map<string, unknown>}).map.keys()][0];
  return {prompt: createHash('sha256').update(seen).digest('hex').slice(0, 16), key: key.slice(0, 16)};
};

const EXPECTED = JSON.parse(readFileSync(new URL('./invariance.expected.json', import.meta.url), 'utf8')) as Record<string, {prompt: string; key: string}>;

test('the four original presets keep identical prompts and cache keys', async () => {
  for (const [clip, t] of MOMENTS) {
    for (const q of PRESETS) {
      const id = `${clip}@${t}|${q}`;
      const fp = await fingerprint(clip, t, q);
      assert.deepEqual(fp, EXPECTED[id], id);
    }
  }
});
