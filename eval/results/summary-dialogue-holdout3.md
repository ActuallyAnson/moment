# Eval summary

Generated 2026-10-09T17:45:31.906Z. Accuracy = (correct + 0.5 x partial) / graded. Grades are assistant-graded against the owner-confirmed expected answers; an owner spot-check of 15 answers found the assistant somewhat more generous (see the README).

| config | n | graded | accuracy | halluc. | not-visible abstain | false abstain | p50 ms | p95 ms | $/question |
|---|---|---|---|---|---|---|---|---|---|
| c13-dlg-verbatim | 11 | 11 | 100% | 0% | 0% | 0% | 0 | 0 | 0.00000 |

## Accuracy by category (graded items; differences of 1-2 items are noise)

| config | dialogue | no dialogue |
|---|---|---|
| c13-dlg-verbatim | 100% (8) | 100% (3) |

## No-dialogue honesty (deterministic plumbing check, not model accuracy)

| config | answers that honestly say there is no transcript |
|---|---|
| c13-dlg-verbatim | 100% |

Ungraded answers: 0. Runs: eval/results/c13-dlg-verbatim__holdout3__2026-10-06__7ab4b65a (node backend/scripts/run.ts c13-dlg-verbatim --split holdout3 --prod-timeouts)
