import type {Cue} from './srt.ts';
import type {Frame} from './window.ts';

export const SYSTEM_PROMPT = [
  'You are a viewing companion on a TV. A viewer paused a video and asks about the current moment.',
  'You see up to a few frames leading up to the paused moment (oldest first) and nearby subtitles.',
  'Answer directly in at most two short sentences, in plain language, with no label such as "Answer:".',
  'Describe what the frames show. For "what happened", describe the action across the frames from oldest to newest. For counting questions, count what you can see.',
  'Say "I\'m not sure." only when the frames and subtitles do not contain the answer, for example when the thing asked about is not in any frame.',
  'Do not identify real people from their faces. Use a name only if the subtitles say it; otherwise describe appearance and clothing.',
].join(' ');

const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const buildPrompt = (args: {question: string; t: number; frames: Frame[]; cues: Cue[]}): {system: string; user: string} => {
  const {question, t, frames, cues} = args;
  const lines: string[] = [];
  lines.push(`The video is paused at ${t.toFixed(1)} s (${mmss(t)}).`);
  if (frames.length) {
    lines.push(
      `Frames provided, oldest to newest: ${frames.map((f, i) => `image ${i + 1} at ${f.t.toFixed(1)} s`).join(', ')}.`,
    );
  } else {
    lines.push('No frames are available.');
  }
  if (cues.length) {
    lines.push('Subtitles near this moment:');
    for (const c of cues) {
      lines.push(`[${c.start.toFixed(1)}-${c.end.toFixed(1)} s] ${c.text}`);
    }
  } else {
    lines.push('No subtitles near this moment.');
  }
  lines.push(`Question: ${question}`);
  return {system: SYSTEM_PROMPT, user: lines.join('\n')};
};
