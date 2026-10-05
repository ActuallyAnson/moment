export const formatTime = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// "12 seconds", "1 minute 5 seconds": what a screen reader should say instead of "0:12".
export const spokenTime = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  if (total === 0) {
    return 'the start';
  }
  const m = Math.floor(total / 60);
  const s = total % 60;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  return [m ? part(m, 'minute') : '', s ? part(s, 'second') : ''].filter(Boolean).join(' ');
};

// The honest provenance line under an answer: how much video (and dialogue) it was based on.
export const windowNote = (t: number, framesUsed?: number[], cuesUsed?: number): string => {
  if (!framesUsed || framesUsed.length === 0) {
    return 'Based on this moment';
  }
  const n = Math.round(t - Math.min(...framesUsed));
  const video = n >= 1 ? `the last ${n} second${n === 1 ? '' : 's'} of video` : 'this moment';
  return cuesUsed && cuesUsed > 0 ? `Based on ${video} and recent dialogue (subtitles)` : `Based on ${video}`;
};
