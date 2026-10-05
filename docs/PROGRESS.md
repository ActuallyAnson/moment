# Progress

## 2026-10-04 (Phase 0, in progress)
- Done: repo skeleton, MIT license, .gitignore, docs stubs, Rosetta + watchman + ffmpeg installed, 60 s test clip generated (clips/testpattern_60s.mp4).
- Blocked/pending: Vega SDK install (needs VS Code closed), awscli broken (deferred to Phase 2).
- Next: install Vega SDK, boot Vega Virtual Device, hello-world app, video playback gate.
- Vega SDK 0.24.12112 installed; VVD boots (second attempt); hello-world app builds and runs on the VVD (screenshot-verified).
- Phase 0 DONE: bundled 60 s clip plays on the VVD; `currentTime` read via a 250 ms poll; `pause()`/`play()` verified (paused at 5.04 s, resumed, 8.94 s a few seconds later). Watchman permission granted, so builds no longer need a workaround.
- Open: awscli broken (Homebrew); user must create AWS account (credits form pending). VVD boot hung once on first start.
- Next: Phase 1 (Opus plan, then confirm): remote key -> overlay -> stub answer; verify the VVD host-loopback address.

## 2026-10-04 (Phase 1 done)
- Remote loop works end to end on the VVD with injected remote keys (no mouse): Menu opens overlay + pauses, D-pad moves a clearly visible focus, Enter asks the stub backend, answer card shows, Back dismisses and resumes (video counter 12 -> 19 s).
- Failure path verified: backend down -> "Couldn't reach the answer service." card with Try again / Close; retry succeeds after the backend returns.
- Bug found and fixed: currentTime read 0 after pause() (friction #10).
- Not tested: the 8 s timeout path (only connection-refused), Back during loading, a physical remote key mapping (Menu = F2 on the VVD keyboard per the VVD log).
- Backend: `cd backend && npm start` (stub, 1 s delay). App: `cd app && npm run build:app`, then `vega run-app build/aarch64-release/moment_aarch64.vpkg com.anson.moment.main -d VirtualDevice`.
- Next: Phase 2 (Opus plan): needs AWS account + CLI, one real clip with a handwritten SRT, ffmpeg keyframes, Bedrock call.

## 2026-10-04 (Phase 2, everything except live Bedrock)
- Clip: Tears of Steel excerpt (45 s, CC-BY 3.0, silent audio), 90 frames at 2 fps / 512 px, subtitles re-timed (clips/fetch-tos.sh, clips/NOTICE.md).
- Backend: POST /ask {clipId, timestamp, question} -> window selection (last 4 s, <=5 frames; subtitles +/-10 s) -> prompt -> VisionClient (stub now, live Converse ready, lazy SDK import) -> parsed answer {answer, latencyMs, framesUsed, model}. 20 unit tests pass (`cd backend && npm test`).
- Cost guard: live calls only, written to eval/cost_log.csv, warns at $50/$100/$130, refuses live calls at $130 unless ALLOW_OVER_BUDGET=1 (tested with a fake live client).
- App: plays the new clip on the VVD and sends the new request shape; a Menu press at 0:16 returned the stub answer through the new pipeline.
- eval/questions.jsonl: 10 drafted Q&A (2 each: action, identity, on-screen text, counting/spatial, not visible), all `confirmed: false`. YOU need to check each one against the clip. `node backend/scripts/run-eval.ts` runs them (stub plumbing check only).
- BLOCKED until an AWS account exists: any real answer, accuracy, real latency, image-token cost, whether Nova refuses identity questions on live-action frames, model availability. NO-GO/GO is therefore undecided.
- Next: AWS account -> CLI -> credentials -> `npm install @aws-sdk/client-bedrock-runtime` (ask first) -> BEDROCK_MODE=live smoke test (one text question, one identity question) -> run the 10 questions.

## 2026-10-05
- GitHub: private repo ActuallyAnson/moment created and pushed (main + phase tags).
- AWS: account created (Free plan, $100 credits), IAM user `moment-dev`, CLI profile `moment` works (`sts get-caller-identity`), Nova Lite/Pro/2 Lite listed with image input in us-east-1.
- First live call blocked: "account is currently being verified" (friction #12). No cost incurred, no live rows in cost_log.csv.
- Next: retry live smoke test once verification finishes (`AWS_PROFILE=moment AWS_REGION=us-east-1 BEDROCK_MODE=live node backend/src/server.ts`), then run the 10 questions.

## 2026-10-05 (Phase 2 live run)
- AWS verification cleared; live Nova Lite works (us-east-1).
- 10 confirmed questions, default config (5 frames / last 4 s + subtitles +/-10 s): 5 correct, 2 partial, 3 wrong, 0 hallucinated. p50 2.5 s, p95 2.9 s, ~$0.00023/question. Details: eval/results/live-lite-default.grades.md.
- All 3 wrong answers are "I'm not sure" on things the frames show (over-cautious prompt); 2 answers carry a stray "Answer:" prefix.
- Go/no-go: NOT decided; waiting on owner. Reproduce: `AWS_PROFILE=moment AWS_REGION=us-east-1 BEDROCK_MODE=live BEDROCK_MODEL_ID=amazon.nova-lite-v1:0 node backend/scripts/run-eval.ts <label>`.
- Prompt v2 re-run (same 10, optimistic because tuned on them): 7 correct, 3 partial, 0 wrong, 0 hallucinated; p50 2.7 s, p95 3.1 s. Grades: eval/results/live-lite-prompt-v2.grades.md.
- End to end on the VVD with the live backend works (2 questions, 2.5 s and 2.9 s server-side, answers shown on the card).
- Known weaknesses for Phase 3: speaker misattribution from unlabeled subtitles; subtitle text answered as if it were on-screen text; terse answers on identity questions.
- Phase 2 gate: criteria met under provisional grading; waiting for the owner's GO before tagging phase-2-done / starting Phase 3.

## 2026-10-05 (Phase 3 in progress)
- 6 clips via `node backend/scripts/fetch-clips.ts` (manifest: clips/manifest.json), 50 confirmed questions (15 dev / 35 test; eval/questions.jsonl); review page `node backend/scripts/make-review-page.ts`.
- Reliability done and tested: retry/timeout, request IDs, answer cache, error mapping (504/502/503), 34 backend tests. On the VVD: slow backend -> "Still thinking..." then "The answer took too long." + Try again; backend killed mid-request -> "Couldn't reach the answer service."; Back during loading resumes playback with no stale card.
- Next: eval harness (configs, run, grading page, summary), prompt v3 on dev only, c1-c6 runs, owner grading, test split run, choose default.
- Eval harness built and tested (42 backend tests): `node backend/scripts/run.ts <config> --split dev|test`, blind grading page `node backend/scripts/grade-page.ts <runDirs...>`, `grade-import.ts`, `summarize.ts`. Configs c1-f1, c2-f3, c3-f5, c4-f5-subs, c5-w8-subs, c6-pro, c7-v3 in eval/configs/.
- Dev split (15 questions) run live on all 7 configs (c4 twice): 143 live calls so far, $0.078 total. Noise floor: 2/15 answers differ between two identical c4 runs at temperature 0 (minor wording).
- Prompt v3 + routing were designed before seeing dev results (fixes for the known weaknesses); c7-v3 is evaluated on dev like the others. Test split (35) untouched.
- Waiting for the owner to grade the 64 distinct dev answers (eval/grading/grade.html), then `node backend/scripts/grade-import.ts <grades.csv>` and `node backend/scripts/summarize.ts eval/results/c*__2026-10-05__*`.

## 2026-10-05 (Phase 3 done)
- Test split (35 questions, run once per finalist; assistant-graded against owner-confirmed expected answers):
  c4 (old default) 61% / halluc 3% / not-visible abstention 82% / p95 4.1 s; **c7-v3 73% / 3% / 91% / p95 3.2 s**; c8-v3-w8 69% / 0% / 91% / 3.7 s; c6-pro 69% / 3% / 82% / 5.0 s, $0.0039 per question (13x), 1 of 35 requests throttled by Bedrock (error, ungraded).
- Dev split (15 questions, used to design v3, so optimistic): c1-f1 57%, c2-f3 67%, c3-f5 70%, c4 73%, c5-w8 83%, c6-pro 80%, c7-v3 87%, c8-v3-w8 77%.
- Noise floor: 2/15 answers differ between two identical c4 runs at temperature 0. Differences of 1-2 questions per category are noise; the c7-vs-c4 paired result (5-0-30) is the one clear signal.
- Default switched to c7-v3 in the backend (DEFAULT_WINDOW, DEFAULT_PROMPT_VERSION, routing). Live smoke test fixed the Phase 2 failure cases.
- Grading: all 165 distinct answers were graded by the assistant, labelled `assistant-graded` in eval/grades/manual.csv. An owner spot-check of 15 answers (eval/grading/recheck.html, grades hidden) is still pending; the agreement rate must be reported with the results.
- Known issues: action questions are weakest; "What does the text say?" can return text shown a few seconds earlier inside the window (my question tt14 expected "not sure"; graded partial); counting across a 4 s window can count people from earlier frames; Nova Pro throttles under sequential load.
- Total live spend: about $0.28 over about 330 calls (eval/cost_log.csv).
- Reproduce: `AWS_PROFILE=moment AWS_REGION=us-east-1 node backend/scripts/run.ts <config> --split test`, grade, `node backend/scripts/summarize.ts <runDirs>`. Results: eval/results/summary-dev.md, summary-test.md.
- Process note: the first test run overwrote some dev result folders because the split was not in the folder name; dev results were restored from git (c8's dev run re-run) and run.ts now includes the split and refuses to overwrite.

## 2026-10-05 (Phase 4, build part done; user tests pending)
- Measured the VVD canvas (960x540 dp, scale 2) and rebuilt the UI with a px() helper: safe-area margins, 28 px minimum text, "Press Menu or Select to ask about this moment" hint (5 s at start/after resume, again every 60 s), answer card with "Based on the last N seconds..." note, "Ask another" / "Resume" buttons, loading dots, text-size toggle, consistent remote behavior. Verified on the VVD by key injection and screenshots: Menu open/close, Ask another at the same moment, Back, Play/Pause (idle: player pauses; overlay open: closes and resumes), text size on, error paths from Phase 3 unchanged.
- App tests: 11 jest tests (contrast ratios for every colour pair at WCAG AA, spoken time, window note); backend 42 tests.
- Accessibility: roles, labels, hints and a spoken orientation line added. VoiceView can be enabled on the VVD with a Back+Menu hold; the Text Banner showed the focused button's label ("What just happened?") and, on the answer card, "Answer: ... Based on the last 4 seconds of video and recent dialogue (subtitles)" (after the Ask another label fix: duplicated period and trailing "Ask another question" removed). Actual audio and Menu-key behavior under VoiceView are not verified (see FRICTION_LOG #18).
- docs/USER_TESTS.md has the 10-minute script, post-test questions, rating items, consent notes and tables. NEXT (owner): run 3-5 sessions, fill the tables; then I fix the top issues. The phone companion page was not started (owner chose to skip for now).
- Quality note from the live check: at 0:12 the default config said "The woman raised her left hand to her face" (the true event is her raising a robotic hand toward the man), i.e. action answers are still the weakest category.
