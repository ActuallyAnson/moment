export type Cue = {start: number; end: number; text: string};

const TS = /(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/;

const toSeconds = (s: string): number => {
  const m = TS.exec(s.trim());
  if (!m) {
    throw new Error(`bad SRT timestamp: ${s}`);
  }
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, '0')) / 1000;
};

export const parseSrt = (raw: string): Cue[] => {
  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
  if (!text) {
    return [];
  }
  const cues: Cue[] = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split('\n').map((l) => l.trim());
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at < 0) {
      continue;
    }
    const [a, b] = lines[at].split('-->');
    const body = lines
      .slice(at + 1)
      .filter(Boolean)
      .join(' ');
    if (body) {
      cues.push({start: toSeconds(a), end: toSeconds(b), text: body});
    }
  }
  return cues;
};

// Re-time cues for an excerpt that starts `offset` seconds into the source and lasts `duration`.
export const shiftCues = (cues: Cue[], offset: number, duration: number): Cue[] =>
  cues
    .map((c) => ({...c, start: c.start - offset, end: c.end - offset}))
    .filter((c) => c.end > 0 && c.start < duration)
    .map((c) => ({...c, start: Math.max(0, c.start), end: Math.min(duration, c.end)}));

const fmt = (s: number): string => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)},${p(ms % 1000, 3)}`;
};

export const toSrt = (cues: Cue[]): string =>
  cues.map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n`).join('\n');
