# Feature requests

Each request comes from a real friction-log entry (`docs/FRICTION_LOG.md`).

| # | Request | Why it matters | Priority |
|---|---|---|---|
| 1 | Make `vega virtual-device start --timeout N` terminate at the timeout and print a cause; document boot hangs on Apple Silicon / newer macOS (friction #5) | A VVD that never reaches the home screen blocks every Vega developer, and the command kept running past its timeout for 17+ minutes | critical |
| 2 | Keep `VideoPlayer.currentTime` stable right after `pause()`, or document the behaviour (#10) | It silently returned 0, so an app can send wrong timestamps without any error | critical |
| 3 | Document the emulator-to-host address (10.0.2.2) and the cleartext policy for `fetch` (#9) | Every app that talks to a dev backend needs it, and it is only discoverable by inspecting the device's routing table | important |
| 4 | Have `build-vega` show the watchman wait and time out; warn about macOS-protected folders in the install docs (#6) | It looks like a hang for 13+ minutes at 0% CPU | important |
| 5 | Update the w3cmedia setup docs to the current package version and RN 0.83 template, and show the surface-created / metadata-loaded ordering (#7) | The documented version and babel preset are out of date and `play()` before the source is set fails silently | important |
| 6 | State the 960x540 dp canvas and the 1080p conversion beside the typography/safe-area guidance (#16) | Designs written in 1080p pixels render twice as large | important |
| 7 | Show an account-verification status banner in the AWS console and on the Bedrock page (#12) | A new account is blocked from Bedrock for up to 2 hours with no earlier warning | important |
| 8 | Document a recommended total-deadline pattern across SDK retries for interactive apps (#15) | Default SDK retries can exceed any UI timeout | important |
| 9 | A `--yes` / non-interactive Vega installer flag (#4) | The installer needs a TTY, which breaks scripted setup | nice-to-have |
| 10 | `vega virtual-device status` and auto-start on `run-app` (#14) | The VVD does not survive the Mac sleeping | nice-to-have |
| 11 | Document the real key-event names the VVD emits (`play`, `rewind`, `forward`) (#17) | The docs list names the device does not send | nice-to-have |
| 12 | Allow `vdcm set` for accessibility settings on the VVD; make the Text Banner dialog respond to injected keys; document the Text Banner for verifying spoken output (#18) | Screen-reader behavior is hard to verify without a person at the keyboard | nice-to-have |
| 13 | Note on the Converse API page that it is authorized by `bedrock:InvokeModel` (#13) | The policy editor rejects the obvious action name | nice-to-have |
| 14 | Document local-file playback and the `/pkg/assets/raw` convention (#8) | The only source was a community answer | nice-to-have |
