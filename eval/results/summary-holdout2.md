# Eval summary

Generated 2026-10-06T06:24:36.098Z. Accuracy = (correct + 0.5 x partial) / graded. Grades are assistant-graded against the owner-confirmed expected answers; an owner spot-check sample validates them (see PROGRESS).

| config | n | graded | accuracy | halluc. | not-visible abstain | false abstain | p50 ms | p95 ms | $/question |
|---|---|---|---|---|---|---|---|---|---|
| c7-v3 | 24 | 24 | 63% | 4% | 67% | 0% | 2392 | 3455 | 0.00031 |

## Accuracy by category (graded items; differences of 1-2 items are noise)

| config | action | counting/spatial | identity | not visible | on-screen text |
|---|---|---|---|---|---|
| c7-v3 | 54% (12) | 67% (3) | 50% (3) | 67% (3) | 100% (3) |

## Noise floor (identical runs, repeat)

| config | questions whose answer text differs between run 0 and run 1 |
|---|---|
| c7-v3 | 2 of 24 |

Ungraded answers: 0. Runs: eval/results/c7-v3__holdout2__2026-10-06__ee9aee0f (node backend/scripts/run.ts c7-v3 --split holdout2 --repeat 2 --prod-timeouts)
