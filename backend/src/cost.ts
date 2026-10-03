import {appendFile, readFile} from 'node:fs/promises';

// On-demand USD per 1M tokens (input, output). Source: AWS Price List API
// (pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/<region>/index.json),
// read by the planning agent on 2026-10-04. Re-verify against the account before relying on it.
const PRICES: Record<string, [number, number]> = {
  'amazon.nova-lite-v1:0|us-east-1': [0.06, 0.24],
  'amazon.nova-lite-v1:0|ap-southeast-1': [0.081, 0.324],
  'amazon.nova-pro-v1:0|us-east-1': [0.8, 3.2],
  'amazon.nova-pro-v1:0|ap-southeast-1': [1.08, 4.32],
};

export const estimateCost = (model: string, region: string, inputTokens: number, outputTokens: number): number | null => {
  const base = model.replace(/^(us|eu|apac|global)\./, '');
  const p = PRICES[`${base}|${region}`];
  return p ? (inputTokens * p[0] + outputTokens * p[1]) / 1_000_000 : null;
};

export type CostRow = {
  date: string;
  model: string;
  region: string;
  images: number;
  inputTokens: number;
  outputTokens: number;
  estCostUsd: number;
  note: string;
};

export const logCost = (path: string, row: CostRow): Promise<void> =>
  appendFile(
    path,
    `${row.date},${row.model},${row.region},${row.images},${row.inputTokens},${row.outputTokens},${row.estCostUsd.toFixed(6)},${row.note.replace(/,/g, ';')}\n`,
  );

export const totalSpent = async (path: string): Promise<number> => {
  let text = '';
  try {
    text = await readFile(path, 'utf8');
  } catch {
    return 0;
  }
  return text
    .trim()
    .split('\n')
    .slice(1)
    .reduce((sum, line) => sum + (Number(line.split(',')[6]) || 0), 0);
};

export const THRESHOLDS = [50, 100, 130] as const;

// Returns the thresholds newly crossed by moving from `before` to `after` dollars.
export const crossed = (before: number, after: number): number[] => THRESHOLDS.filter((t) => before < t && after >= t);

export const HARD_STOP_USD = 130;
