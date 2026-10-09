# Eval summary

Generated 2026-10-09T17:45:32.051Z. Accuracy = (correct + 0.5 x partial) / graded. Grades are assistant-graded against the owner-confirmed expected answers; an owner spot-check of 15 answers found the assistant somewhat more generous (see the README).

| config | n | graded | accuracy | halluc. | not-visible abstain | false abstain | p50 ms | p95 ms | $/question |
|---|---|---|---|---|---|---|---|---|---|
| c4-f5-subs | 35 | 35 | 61% | 3% | 82% | 0% | 2643 | 4088 | 0.00030 |
| c7-v3 | 35 | 35 | 73% | 3% | 91% | 0% | 2480 | 3212 | 0.00030 |
| c8-v3-w8 | 35 | 35 | 69% | 0% | 91% | 4% | 2417 | 3724 | 0.00030 |
| c6-pro | 35 | 34 | 69% | 3% | 82% | 0% | 2557 | 5013 | 0.00389 |

## Accuracy by category (graded items; differences of 1-2 items are noise)

| config | action | counting/spatial | identity | not visible | on-screen text |
|---|---|---|---|---|---|
| c4-f5-subs | 38% (4) | 50% (6) | 44% (9) | 86% (11) | 70% (5) |
| c7-v3 | 63% (4) | 50% (6) | 67% (9) | 95% (11) | 70% (5) |
| c8-v3-w8 | 63% (4) | 42% (6) | 56% (9) | 95% (11) | 70% (5) |
| c6-pro | 38% (4) | 50% (6) | 67% (9) | 90% (10) | 80% (5) |

## Paired comparison vs c4-f5-subs (questions where both are graded)

| config | wins | losses | ties |
|---|---|---|---|
| c7-v3 | 5 | 0 | 30 |
| c8-v3-w8 | 7 | 3 | 25 |
| c6-pro | 7 | 3 | 24 |

Ungraded answers: 1. Runs: eval/results/c4-f5-subs__test__2026-10-05__ac27e88d (node backend/scripts/run.ts c4-f5-subs --split test); eval/results/c7-v3__test__2026-10-05__ee9aee0f (node backend/scripts/run.ts c7-v3 --split test); eval/results/c8-v3-w8__test__2026-10-05__5991d257 (node backend/scripts/run.ts c8-v3-w8 --split test); eval/results/c6-pro__test__2026-10-05__f310f480 (node backend/scripts/run.ts c6-pro --split test)
