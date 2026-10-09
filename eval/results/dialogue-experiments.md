# "What did they just say?": answered from the subtitles

**What it is.** A fifth preset question. It is answered from the subtitle cues that overlap the last 10 seconds before the pause (never cues that start after it), not from the picture. The default (variant A) quotes the last up to three lines word for word, oldest first, prefixed "Someone said:" because the subtitles do not label speakers; it makes no model call, so it costs nothing and returns in about 1 ms. If the clip has no subtitle file it says "This video has no subtitles, so I can't show what was said."; if it has subtitles but none in the window it says "No dialogue in the subtitles for the last 10 seconds." (both are deliberately not "I'm not sure", and never claim nobody spoke, because subtitles can leave lines out).

**Challenger (variant B).** Nova Lite, 2 frames from the last 2 s plus the transcript, told to quote the newest lines exactly and name a speaker only if the images make it unambiguous.

**Questions.** 22 new questions, all confirmed by the owner against the real subtitle lines (the clips are silent, so the subtitle file is the ground truth): 16 "dialogue" items (8 on Tears of Steel, 8 on Sintel) and 6 "no dialogue" items (a gap between cues on two clips, and four clips with no subtitle file). Split into `dev3` (11, for tuning) and `holdout3` (11, locked); the two splits use disjoint subtitle cues. Speakers were not attributed in any expected answer (nobody confirmed who speaks which line, and a name inside a line is usually the person spoken *to*).

**Decision rule, fixed before any run.** B replaces A only if B has no hallucinated answers across two repeats, accuracy at least A's, and gets the speaker right on at least half of items with a confirmed speaker. Otherwise A ships.

## Development split (dev3, 11 questions, each config run twice with the production timeouts)
| config | dialogue (8) | no dialogue (3) | hallucinated | p50 | cost / question |
|---|---|---|---|---|---|
| c13 verbatim from subtitles (A) | 100% | 100% | 0% | 0 ms | $0 |
| c14 Nova Lite + 2 frames (B) | 88% | 100% | 0% | 1.6 s | $0.00008 |

Paired, B had 0 wins and 2 losses against A: on one item it quoted an older line and left out the newest ("I'm not freaked out by- it's..."), and on another it altered the quoted text slightly. B named no speakers. Both configs gave identical answers across the two repeats (0 of 11 differ). No item had a confirmed speaker, so the speaker part of the rule could not be met either. **A ships.**

## Locked split (holdout3, 11 questions, A only, run once)
11 of 11 correct (8 dialogue, 3 "no dialogue"); see `summary-dialogue-holdout3.md`.

## How to read these numbers
- This is mostly a check that the *plumbing* is right (window rule, recency, honest no-subtitles answers), because variant A copies the subtitle text: it is exact by construction, and 100% says nothing about how well a model understands speech.
- Only 16 dialogue items exist because the two subtitled clips have only 11 cues each; they are small samples and the cues overlap between neighbouring pauses (the dev and locked splits were chosen to share none).
- Grading is by an automated assistant against owner-confirmed expected answers; an owner spot-check of 15 answers from earlier runs found the assistant somewhat more generous than the owner (see the README); the dialogue answers here are exact quotes, so that matters little for them.
- A cue that has already started is shown whole, including words that finish after the pause, as a subtitle viewer would see it. Tears of Steel's cue 9 also contains a quoted on-screen caption ("Fourty years later"), so that line appears as part of the dialogue answer.
- The clips are silent, so the feature is demonstrated on subtitled silent clips. It has not been tested with real audio, nor with deaf or hard-of-hearing viewers; Moment is AI-enhanced viewing that may help such viewers, not something built for them.
