# Moment

AI-enhanced viewing for Fire TV: while a video plays, press a button and ask about the current moment ("What just happened?", "Who is on screen?", "What does the text say?") and get a short answer on screen.

Status: work in progress (Phase 1: remote loop with a stubbed answer).

## Run (Mac, Apple Silicon)
1. Install the Vega SDK (https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html) and start the virtual device: `vega virtual-device start`.
2. Backend (stub): `cd backend && npm start` (listens on 127.0.0.1:8787; the virtual device reaches it at 10.0.2.2:8787).
3. App: `cd app && npm install && npm run build:app && vega run-app build/aarch64-release/moment_aarch64.vpkg com.anson.moment.main -d VirtualDevice`.
4. Press Menu (F2 in the virtual device window) to ask a question; Back resumes playback.

See `docs/` for progress, decisions and the friction log. License: MIT.
