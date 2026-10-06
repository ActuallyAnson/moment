# Eval summary

Generated 2026-10-06T12:04:00.982Z. Accuracy = (correct + 0.5 x partial) / graded. Grades are assistant-graded against the owner-confirmed expected answers; an owner spot-check sample validates them (see PROGRESS).

| config | n | graded | accuracy | halluc. | not-visible abstain | false abstain | p50 ms | p95 ms | $/question |
|---|---|---|---|---|---|---|---|---|---|
| c13-dlg-verbatim | 11 | 11 | 100% | 0% | 0% | 0% | 0 | 0 | 0.00000 |
| c14-dlg-frames2 | 11 | 11 | 91% | 0% | 0% | 0% | 1573 | 2067 | 0.00008 |

## Accuracy by category (graded items; differences of 1-2 items are noise)

| config | dialogue | no dialogue |
|---|---|---|
| c13-dlg-verbatim | 100% (8) | 100% (3) |
| c14-dlg-frames2 | 88% (8) | 100% (3) |

## Paired comparison vs c13-dlg-verbatim (questions where both are graded)

| config | wins | losses | ties |
|---|---|---|---|
| c14-dlg-frames2 | 0 | 2 | 9 |

## Noise floor (identical runs, repeat)

| config | questions whose answer text differs between run 0 and run 1 |
|---|---|
| c13-dlg-verbatim | 0 of 11 |
| c14-dlg-frames2 | 0 of 11 |

## No-dialogue honesty (deterministic plumbing check, not model accuracy)

| config | answers that honestly say there is no transcript |
|---|---|
| c13-dlg-verbatim | 100% |
| c14-dlg-frames2 | 100% |

Ungraded answers: 0. Runs: eval/results/c13-dlg-verbatim__dev3__2026-10-06__7ab4b65a (node backend/scripts/run.ts c13-dlg-verbatim --split dev3 --repeat 2 --prod-timeouts); eval/results/c14-dlg-frames2__dev3__2026-10-06__5be599cb (node backend/scripts/run.ts c14-dlg-frames2 --split dev3 --repeat 2 --prod-timeouts)
