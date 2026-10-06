import {DIALOGUE_QUESTION, QUESTIONS} from '../src/questions';

describe('preset questions', () => {
  test('five distinct questions; the first keeps the initial focus; dialogue is second', () => {
    expect(QUESTIONS.length).toBe(5);
    expect(new Set(QUESTIONS).size).toBe(5);
    expect(QUESTIONS[0]).toBe('What just happened?');
    expect(QUESTIONS[1]).toBe(DIALOGUE_QUESTION);
  });
});
