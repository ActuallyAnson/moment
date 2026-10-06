import type {Cue} from './srt.ts';
import type {Frame} from './window.ts';

export type PromptVersion = 'v2' | 'v3';
export type PromptVariant = 'action-change' | 'action-video';

export const ACTION_VIDEO_INSTRUCTION =
  'For this question you get a short video clip that ends at the pause. Say what happens in it: who moves, where, and what they do. Describe the motion, not just the scene.';

export const ACTION_CHANGE_INSTRUCTION =
  'For this question, say what changed between the first and the last image: who moved, where, and what they did. Describe the motion, not just the scene.';
export const PROMPT_VERSION = 'v2';

export const SYSTEM_PROMPT = [
  'You are a viewing companion on a TV. A viewer paused a video and asks about the current moment.',
  'You see up to a few frames leading up to the paused moment (oldest first) and nearby subtitles.',
  'Answer directly in at most two short sentences, in plain language, with no label such as "Answer:".',
  'Describe what the frames show. For "what happened", describe the action across the frames from oldest to newest. For counting questions, count what you can see.',
  'Say "I\'m not sure." only when the frames and subtitles do not contain the answer, for example when the thing asked about is not in any frame.',
  'Do not identify real people from their faces. Use a name only if the subtitles say it; otherwise describe appearance and clothing.',
].join(' ');

const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const SYSTEM_PROMPT_V3 = [
  'You are a viewing companion on a TV. A viewer paused a video and asks about the current moment.',
  'You see up to a few frames leading up to the paused moment (oldest first). You may also get a transcript of nearby spoken dialogue.',
  'Answer directly in at most two short sentences, in plain language, with no label such as "Answer:".',
  'Describe what the frames show. For "what happened", describe the action across the frames from oldest to newest. For counting questions, count what you can see.',
  'On-screen text means only writing that is visible inside the images. Never quote dialogue as on-screen text. If a question asks about text and none is visible in the images, say "I\'m not sure."',
  'The dialogue transcript does not say who is speaking. Attribute a line to a specific person only if the images make it unambiguous; otherwise say "someone says".',
  'For "who" questions, describe each visible person or character from left to right: appearance, clothing and what they are doing, one short sentence each (at most two in detail).',
  'Say "I\'m not sure." only when the images and transcript do not contain the answer, for example when the thing asked about is not in any frame.',
  'Do not identify real people from their faces. Use a name only if the dialogue says it; otherwise describe appearance and clothing.',
].join(' ');

const offsetLabel = (c: Cue, t: number): string => {
  if (c.start <= t && c.end >= t) {
    return 'being spoken at the pause';
  }
  return c.end < t ? `${Math.round(t - c.end)} s before the pause` : `${Math.round(c.start - t)} s after the pause`;
};

const buildPromptV3 = (args: {question: string; t: number; frames: Frame[]; cues: Cue[]}, variant?: PromptVariant): {system: string; user: string} => {
  const {question, t, frames, cues} = args;
  const lines: string[] = [`The video is paused at ${t.toFixed(1)} s (${mmss(t)}).`];
  const label = (f: Frame, i: number) => (variant === 'action-change' || variant === 'action-video' ? `image ${i + 1} (${Math.max(0, t - f.t).toFixed(1)} s before the pause)` : `image ${i + 1} at ${f.t.toFixed(1)} s`);
  if (variant === 'action-video') {
    lines.push('A short video clip of the last moments before the pause is attached (it ends at the pause). Watch how things move in it.');
  }
  if (variant !== 'action-video') lines.push(frames.length ? `Images, oldest to newest: ${frames.map(label).join(', ')}.` : 'No images are available.');
  if (cues.length) {
    lines.push('Spoken dialogue (audio transcript, NOT visible on screen; speakers are not labeled):');
    for (const c of cues) {
      lines.push(`[${offsetLabel(c, t)}] ${c.text}`);
    }
  } else {
    lines.push('No dialogue transcript is provided.');
  }
  lines.push(`Question: ${question}`);
  return {system: variant ? `${SYSTEM_PROMPT_V3} ${variant === 'action-video' ? ACTION_VIDEO_INSTRUCTION : ACTION_CHANGE_INSTRUCTION}` : SYSTEM_PROMPT_V3, user: lines.join('\n')};
};

export const buildPrompt = (
  args: {question: string; t: number; frames: Frame[]; cues: Cue[]},
  version: PromptVersion = 'v2',
  variant?: PromptVariant,
): {system: string; user: string} => {
  if (version === 'v3') {
    return buildPromptV3(args, variant);
  }
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
