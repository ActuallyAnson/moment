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
