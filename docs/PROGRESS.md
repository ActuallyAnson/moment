# Progress

## 2026-10-04 (Phase 0, in progress)
- Done: repo skeleton, MIT license, .gitignore, docs stubs, Rosetta + watchman + ffmpeg installed, 60 s test clip generated (clips/testpattern_60s.mp4).
- Blocked/pending: Vega SDK install (needs VS Code closed), awscli broken (deferred to Phase 2).
- Next: install Vega SDK, boot Vega Virtual Device, hello-world app, video playback gate.
- Vega SDK 0.24.12112 installed; VVD boots (second attempt); hello-world app builds and runs on the VVD (screenshot-verified).
- Phase 0 DONE: bundled 60 s clip plays on the VVD; `currentTime` read via a 250 ms poll; `pause()`/`play()` verified (paused at 5.04 s, resumed, 8.94 s a few seconds later). Watchman permission granted, so builds no longer need a workaround.
- Open: awscli broken (Homebrew); user must create AWS account (credits form pending). VVD boot hung once on first start.
- Next: Phase 1 (Opus plan, then confirm): remote key -> overlay -> stub answer; verify the VVD host-loopback address.
