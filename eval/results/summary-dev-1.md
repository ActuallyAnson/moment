# Eval summary

Generated 2026-10-09T17:45:31.664Z. Accuracy = (correct + 0.5 x partial) / graded. Grades are assistant-graded against the owner-confirmed expected answers; an owner spot-check of 15 answers found the assistant somewhat more generous (see the README).

| config | n | graded | accuracy | halluc. | not-visible abstain | false abstain | p50 ms | p95 ms | $/question |
|---|---|---|---|---|---|---|---|---|---|
| c4-f5-subs | 15 | 15 | 73% | 0% | 100% | 0% | 2294 | 3453 | 0.00025 |
| c1-f1 | 15 | 15 | 53% | 0% | 100% | 15% | 2016 | 3206 | 0.00006 |
| c2-f3 | 15 | 15 | 63% | 0% | 100% | 8% | 1921 | 3466 | 0.00015 |
| c3-f5 | 15 | 15 | 70% | 0% | 100% | 0% | 2630 | 3780 | 0.00025 |
| c5-w8-subs | 15 | 15 | 77% | 0% | 100% | 0% | 2357 | 3674 | 0.00025 |
| c6-pro | 15 | 15 | 70% | 0% | 100% | 0% | 2355 | 3346 | 0.00336 |
| c7-v3 | 15 | 15 | 87% | 0% | 100% | 0% | 2273 | 3395 | 0.00026 |

## Accuracy by category (graded items; differences of 1-2 items are noise)

| config | action | counting/spatial | identity | not visible | on-screen text |
|---|---|---|---|---|---|
| c4-f5-subs | 40% (5) | 100% (3) | 50% (2) | 100% (2) | 100% (3) |
| c1-f1 | 20% (5) | 100% (3) | 50% (2) | 100% (2) | 33% (3) |
| c2-f3 | 40% (5) | 83% (3) | 50% (2) | 100% (2) | 67% (3) |
| c3-f5 | 30% (5) | 100% (3) | 50% (2) | 100% (2) | 100% (3) |
| c5-w8-subs | 50% (5) | 100% (3) | 50% (2) | 100% (2) | 100% (3) |
| c6-pro | 50% (5) | 67% (3) | 50% (2) | 100% (2) | 100% (3) |
| c7-v3 | 60% (5) | 100% (3) | 100% (2) | 100% (2) | 100% (3) |

## Paired comparison vs c4-f5-subs (questions where both are graded)

| config | wins | losses | ties |
|---|---|---|---|
| c1-f1 | 1 | 5 | 9 |
| c2-f3 | 1 | 3 | 11 |
| c3-f5 | 0 | 1 | 14 |
| c5-w8-subs | 1 | 0 | 14 |
| c6-pro | 2 | 4 | 9 |
| c7-v3 | 5 | 1 | 9 |

## Noise floor (identical runs, repeat)

| config | questions whose answer text differs between run 0 and run 1 |
|---|---|
| c4-f5-subs | 2 of 15 |

Ungraded answers: 0. Runs: eval/results/c4-f5-subs__2026-10-05__ac27e88d (node backend/scripts/run.ts c4-f5-subs --split dev --repeat 2); eval/results/c1-f1__2026-10-05__1fc28d87 (node backend/scripts/run.ts c1-f1 --split dev); eval/results/c2-f3__2026-10-05__43a7b1e6 (node backend/scripts/run.ts c2-f3 --split dev); eval/results/c3-f5__2026-10-05__0028808c (node backend/scripts/run.ts c3-f5 --split dev); eval/results/c5-w8-subs__2026-10-05__56094aa7 (node backend/scripts/run.ts c5-w8-subs --split dev); eval/results/c6-pro__2026-10-05__f310f480 (node backend/scripts/run.ts c6-pro --split dev); eval/results/c7-v3__2026-10-05__ee9aee0f (node backend/scripts/run.ts c7-v3 --split dev)
