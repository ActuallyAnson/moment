import {createHash} from 'node:crypto';

export type Grade = 'correct' | 'partial' | 'wrong' | 'hallucinated';
export const GRADES: Grade[] = ['correct', 'partial', 'wrong', 'hallucinated'];

export const normalizeAnswer = (a: string): string => a.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim();

// Identical answers to the same question share a key, so they are graded once.
export const gradeKey = (questionId: string, answer: string | null): string =>
  createHash('sha256').update(`${questionId}\u0000${normalizeAnswer(answer ?? '')}`).digest('hex').slice(0, 10);

export const score = (g: Grade): number => (g === 'correct' ? 1 : g === 'partial' ? 0.5 : 0);

export const ABSTAIN = /(not sure|can't tell|cannot tell|can't see|cannot see|don't see|do not see|not visible|no text|nothing (is )?written|unable to)/i;
export const isAbstention = (answer: string | null): boolean => ABSTAIN.test(answer ?? '');

export const percentile = (values: number[], p: number): number => {
  if (!values.length) {
    return 0;
  }
  const v = [...values].sort((a, b) => a - b);
  return v[Math.min(v.length - 1, Math.floor((p / 100) * v.length))];
};

export type Row = {id: string; category: string; answer: string | null; latencyMs: number; costUsd?: number; error?: string | null; grade?: Grade};

export type Summary = {
  n: number;
  graded: number;
  accuracy: number;
  byCategory: Record<string, {n: number; accuracy: number}>;
  hallucinationRate: number;
  notVisibleAbstention: number; // share of 'not visible' answers that abstain
  falseAbstention: number; // share of answerable questions that abstain
  p50: number;
  p95: number;
  costPerQuestion: number;
};

export const summarize = (rows: Row[]): Summary => {
  const graded = rows.filter((r) => r.grade);
  const by: Record<string, Row[]> = {};
  for (const r of graded) {
    (by[r.category] ??= []).push(r);
  }
  const acc = (rs: Row[]) => (rs.length ? rs.reduce((s, r) => s + score(r.grade as Grade), 0) / rs.length : 0);
  const nv = rows.filter((r) => r.category === 'not visible');
  const answerable = rows.filter((r) => r.category !== 'not visible');
  return {
    n: rows.length,
    graded: graded.length,
    accuracy: acc(graded),
    byCategory: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, {n: v.length, accuracy: acc(v)}])),
    hallucinationRate: graded.length ? graded.filter((r) => r.grade === 'hallucinated').length / graded.length : 0,
    notVisibleAbstention: nv.length ? nv.filter((r) => isAbstention(r.answer)).length / nv.length : 0,
    falseAbstention: answerable.length ? answerable.filter((r) => isAbstention(r.answer)).length / answerable.length : 0,
    p50: percentile(rows.map((r) => r.latencyMs), 50),
    p95: percentile(rows.map((r) => r.latencyMs), 95),
    costPerQuestion: rows.length ? rows.reduce((s, r) => s + (r.costUsd ?? 0), 0) / rows.length : 0,
  };
};

// Paired comparison: per question, which config scored higher (only where both are graded).
export const paired = (a: Row[], b: Row[]): {wins: number; losses: number; ties: number} => {
  const bm = new Map(b.map((r) => [r.id, r]));
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const r of a) {
    const o = bm.get(r.id);
    if (!r.grade || !o?.grade) {
      continue;
    }
    const d = score(r.grade) - score(o.grade);
    if (d > 0) {
      wins++;
    } else if (d < 0) {
      losses++;
    } else {
      ties++;
    }
  }
  return {wins, losses, ties};
};
