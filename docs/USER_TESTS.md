# User tests

Goal: find out whether people can discover and use "ask about this moment" on a TV remote, whether they trust the answers, and what confuses them. 3 to 5 sessions, about 10 minutes each. Frame the product as **AI-enhanced viewing with an accessibility benefit**; do not claim it is built for blind or low-vision viewers unless such testers took part, and then report only what they said.

## Setup (moderator)
- Mac with the Vega Virtual Device and the backend running (see README: stub vs live mode). Use `BEDROCK_MODE=live`.
- Remote = keyboard in the emulator window. Print or show this **key card**: arrows = D-pad, **Enter = Select**, **Esc = Back**, **F2 = Menu**, **F4 = Play/Pause**.
- macOS: System Settings > Keyboard > turn on "Use F1, F2, etc. keys as standard function keys", otherwise F2/F4 change brightness or media.
- Start the app fresh for each person (`vega run-app ...`), set text size to normal, close other windows.
- Remote participants: (a) share the emulator window over Zoom/Meet and give them remote control (observes real key choices, with some lag); (b) they tell you which button to press and you press it (works anywhere, but you lose the "did they find Menu" signal, so mark these sessions as mode b); (c) a recorded demo plus the questions below, for concept feedback only, not usability.

## Consent and privacy
Say it out loud before starting: "This takes about 10 minutes. We're testing the app, not you. You can stop any time. I'll take notes; may I record the screen and audio? No faces unless you agree." Quotes are attributed as P1 to P5, no names. Delete any recordings after the hackathon.

## Script (about 10 minutes)
1. **Intro (1 min).** "Think aloud: say what you're looking at and what you expect." Do not explain the Menu key.
2. **Task 1, discover (about 2 min).** "Watch the clip. If you're curious about something on screen, find a way to ask about it." Observe: time until they open the panel, whether they use the on-screen hint, which key they try. No help for 60 seconds, then say "there's a Menu key" and note that you helped.
3. **Task 2, text (1 min).** "Ask what the text on screen says" (play to about 0:02 of the Market Street clip, or about 0:24 of Tears of Steel). Observe: moving focus, reading the answer, noticing the "Based on..." line.
4. **Task 3, return (30 s).** "Go back to the video." Observe: Back vs Resume vs Menu vs Play/Pause.
5. **Task 4, ask again (1 min).** "Ask a second question about a later moment." Observe: Ask another vs reopening.
6. **Task 5, optional.** "Make the text bigger." (Text size button.)
7. **After (3 min).** Ask the three questions below, then the ratings.
Moderator may only say: "What are you thinking?" and "What would you expect to happen?"

## After the test: 3 questions
1. When would you actually use this?
2. Did you trust the answer? Why or why not?
3. What was confusing or slow?

Ratings (1 = disagree, 5 = agree): It was easy to use. The answers were useful. I would use this again. Free text: "One thing I would change."

## Low-vision testers (if found)
Ask through people you know or local accessibility groups, with a clear purpose, no pressure and a small thank-you. Let them use their own settings (screen reader, magnifier) and sit where they choose. Run a dedicated session with VoiceView on (Back + Menu held for 3 s on the emulator; known limitation: see FRICTION_LOG). Do not generalise from one or two people.

## Session log (copy one row per person)
| Session | Date | Remote mode (a/b/c) | Screen reader (y/n) | Found Menu unaided? time | Task 2 | Task 3 | Task 4 | Ratings (ease / useful / again) |
|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | |
| P2 | | | | | | | | |
| P3 | | | | | | | | |
| P4 | | | | | | | | |
| P5 | | | | | | | | |

## Issues and quotes
Severity: 1 blocker, 2 major, 3 minor, 4 cosmetic.
| # | Issue | Seen in | Quote | Severity | Fix, or Deferred and why |
|---|---|---|---|---|---|
| 1 | | | | | |

## Findings
(Filled in after the sessions: top issues fixed, issues deferred with reasons, notable quotes.)
