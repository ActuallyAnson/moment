export const NOT_SURE = "I'm not sure.";

// Normalise model output: strip markdown/quotes, collapse whitespace, keep at most two sentences.
export const parseAnswer = (raw: string | undefined | null): string => {
  const text = (raw ?? '')
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["“](.*)["”]$/, '$1')
    .trim();
  if (!text) {
    return NOT_SURE;
  }
  const sentences = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) ?? [text];
  return sentences
    .slice(0, 2)
    .map((s) => s.trim())
    .join(' ');
};
