# Grades: live-lite-prompt-v2 (Nova Lite, us-east-1, 5 frames / last 4 s + subtitles +/-10 s, revised prompt)

Provisional grades by the assistant; the project owner should re-grade (brief: owner grades).
NOTE: the prompt was revised after seeing v1 results on these same 10 questions, so this score is optimistic.

| id | category | grade | note |
|---|---|---|---|
| q01 | action | partial | people talking on a bridge; omits the robotic hand |
| q02 | action | partial | "The man is looking at the brain." correct but omits the eyepiece and line |
| q03 | identity | partial | "Two people are on screen." no description |
| q04 | identity | correct | man with glasses and a woman with long hair |
| q05 | on-screen text | correct | |
| q06 | on-screen text | correct | subtitles also contain the phrase |
| q07 | counting/spatial | correct | "Two." (no colours) |
| q08 | counting/spatial | correct | bridge, man on the left in a black jacket; woman not mentioned |
| q09 | not visible | correct | honest "I'm not sure" |
| q10 | not visible | correct | honest "I'm not sure", no invented name |

Totals: 7 correct, 3 partial, 0 wrong, 0 hallucinated (v1: 5 / 2 / 3 / 0).
Latency p50 2709 ms, p95 3128 ms. Cost about $0.00023 per question.

## Two extra live checks through the app on the emulator (not part of the 10)
- t=14.8 "What just happened?": "The man and woman are arguing. The woman is saying that she is freaked out by the man's robot hand." WRONG attribution: the woman has the robotic hand and says it to the man (the man says he is freaked out later). Cause: subtitles have no speaker labels.
- t=19.7 "What does the text say?": "Forty years later". No text is on screen then (the title card appears around 0:22); the model read a subtitle cue as if it were on-screen text.
