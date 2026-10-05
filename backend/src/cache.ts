import {createHash} from 'node:crypto';
import {appendFileSync, existsSync, readFileSync} from 'node:fs';
import type {AskResponse} from './ask.ts';

// Key = hash of everything that determines the answer: the exact frames and subtitle cues selected,
// the question and the config. Two pauses that select the same context hit the cache; a cached
// answer can never include a frame the viewer has not reached (no timestamp rounding).
export const cacheKey = (parts: {clipId: string; framePaths: string[]; cueTexts: string[]; question: string; configHash: string}): string =>
  createHash('sha256')
    .update(JSON.stringify([parts.clipId, parts.framePaths, parts.cueTexts, parts.question.trim().toLowerCase(), parts.configHash]))
    .digest('hex');

export class AnswerCache {
  private map = new Map<string, AskResponse>();
  private max: number;
  private file?: string;
  constructor(max = 500, file?: string) {
    this.max = max;
    this.file = file;
    if (file && existsSync(file)) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (line.trim()) {
          const [k, v] = JSON.parse(line) as [string, AskResponse];
          this.map.set(k, v);
        }
      }
    }
  }
  get(key: string): AskResponse | undefined {
    const v = this.map.get(key);
    if (v) {
      this.map.delete(key);
      this.map.set(key, v); // refresh LRU position
    }
    return v;
  }
  set(key: string, value: AskResponse): void {
    this.map.set(key, value);
    if (this.map.size > this.max) {
      this.map.delete(this.map.keys().next().value as string);
    }
    if (this.file) {
      appendFileSync(this.file, JSON.stringify([key, value]) + '\n');
    }
  }
  get size(): number {
    return this.map.size;
  }
}
