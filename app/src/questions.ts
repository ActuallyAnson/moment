// Order shown in the panel. The first one gets the initial focus. "What did they just say?" is answered from the
// subtitles (see backend/src/ask.ts); the other four are answered by the vision model.
export const QUESTIONS = [
  'What just happened?',
  'What did they just say?',
  'Who is on screen?',
  'What does the text say?',
  'What should I notice here?',
] as const;

export const DIALOGUE_QUESTION = 'What did they just say?';
