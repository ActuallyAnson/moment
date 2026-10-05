# Friction Log

Each entry: task, steps, expected vs actual, severity, workaround, suggestion.

## 1. Homebrew awscli fails to start on macOS (Apple Silicon)
- **Task:** install the AWS CLI via Homebrew.
- **Steps:** `brew install awscli`, then `aws --version` (also after `brew reinstall awscli`).
- **Expected:** prints the version.
- **Actual:** `ImportError ... Library not loaded: /opt/homebrew/opt/aws-c-s3/lib/libaws-c-s3.1.2.dylib`. Homebrew installed aws-c-s3 1.3.0 while awscli 2.37.8 links against 1.2.
- **Severity:** medium (blocks Bedrock setup until fixed).
- **Workaround:** pending; fallback is the official AWS CLI pkg installer.
- **Suggestion:** pin compatible aws-c-* versions in the formula, or document the pkg installer as the supported path.

## 2. Homebrew ffmpeg has no drawtext filter
- **Task:** generate a test video with a burned-in timestamp.
- **Steps:** `ffmpeg -filters | grep drawtext` (no output).
- **Expected:** drawtext available.
- **Actual:** the default `ffmpeg` formula omits freetype. `ffmpeg-full` includes it but is much larger.
- **Severity:** low.
- **Workaround:** use `testsrc`, which has a built-in frame counter and timer.
- **Suggestion:** none for the hackathon tooling; noted for the clip prep docs.

## 3. Vega installer requires closing VS Code
- **Task:** install the Vega SDK.
- **Steps:** read https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html
- **Expected:** installer can run alongside a running editor.
- **Actual:** docs ask to close VS Code first, which interrupts any session using it as a terminal host.
- **Severity:** low.
- **Workaround:** close VS Code before running the installer.
- **Suggestion:** have the installer detect a running VS Code and offer to install the extension later.

## 4. Vega installer needs stdin; piped install fails
- **Task:** install the Vega SDK non-interactively from a terminal agent.
- **Steps:** `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash`
- **Expected:** installs with defaults.
- **Actual:** the CLI downloads, then fails at the "Enter new component installation directory" prompt with `failed to read input: EOF`. The script also reads `/dev/tty`, which is unavailable without a terminal.
- **Severity:** low.
- **Workaround:** download the script to a file and run `yes '' | bash get_vvm.sh`.
- **Suggestion:** support a `--yes` / non-interactive flag, and fall back to defaults when stdin is not a TTY.

## 5. Vega Virtual Device stuck on Fire TV boot logo (macOS 27, Apple Silicon)
- **Task:** boot the VVD (Phase 0 no-go gate).
- **Steps:** `vega virtual-device start --timeout 180` on macOS 27 / M-series / 18 GB RAM, SDK 0.24.12112.
- **Expected:** boots to the home screen within the timeout and appears in `vega device list`.
- **Actual:** the VVD window opened and sat on the Fire TV logo for 17+ minutes at ~250% CPU. `vega device list` stayed empty, and the `start` command ignored its 180 s timeout and kept running.
- **Severity:** high (blocks the whole Vega path).
- **Workaround:** killed all VVD/dutyfree processes, then `vega virtual-device start --timeout 600`; the second boot registered and reported "Virtual device ready" within about a minute. Cause of the first hang is unknown (first-boot image setup is a guess, not verified).
- **Suggestion:** the timeout should terminate the process and print the cause; the troubleshooting page (kvd-issues) has no entry for boot hangs on Apple Silicon or newer macOS releases; list the supported macOS versions in the install doc.

## 6. Metro/`build-vega` hangs silently on watchman under ~/Documents (macOS)
- **Task:** build the hello-world app (`npm run build:app`).
- **Steps:** repo in `~/Documents/GitHub/...`, `watchman` installed via Homebrew for the Vega prerequisites, run `react-native build-vega --build-type Release`.
- **Expected:** build completes in a minute or two.
- **Actual:** 13+ minutes at 0% CPU with no output. With stdin closed, Metro prints `Waiting for Watchman watch-project (Ns)...` forever. Root cause: macOS shows a one-time dialog "watchman would like to access files in your Documents folder" that is easy to miss, and watchman blocks until it is answered. The wrapper (`npm run build:app` via npm-run-all) hides Metro's message entirely.
- **Severity:** high (looks like a hang, costs 15+ minutes).
- **Workaround:** a stub `watchman` earlier on PATH that exits 1 makes Metro fall back and the build succeeds; the proper fix is to click Allow on the macOS prompt (or keep the repo outside Documents/Desktop/Downloads).
- **Suggestion:** the install docs should warn that macOS protects Documents/Desktop/Downloads and say to keep projects elsewhere or grant watchman access; `build-vega` should surface the watchman wait message and time out.

## 7. w3cmedia docs pin an old version and show an ordering trap
- **Task:** play a bundled MP4 with `VideoPlayer` + `KeplerVideoSurfaceView` on RN 0.83.
- **Steps:** follow media-player-setup (pins `~2.1.80`, a metro-react-native-babel-preset babel config) and the package README.
- **Expected:** copy-paste setup works on the current `helloWorld` template.
- **Actual:** npm `latest` is 2.3.2 (worked without touching babel.config.js; the doc's babel preset is from the RN 0.72 era). The README example calls `play()` inside `onSurfaceViewCreated`, but the surface was created twice before `loadedmetadata`, so `play()` ran with no source and the clock stayed at 0 with no error.
- **Severity:** medium (silent failure, no error event).
- **Workaround:** call `play()` only after both the surface exists and `loadedmetadata` fired.
- **Suggestion:** update the doc to the current version and template, and show the surface-created / metadata-loaded ordering in the example.

## 8. Local asset path is undocumented
- **Task:** play a file bundled in the app.
- **Actual:** `/pkg/assets/raw/clip.mp4` worked, with the file at `app/assets/raw/clip.mp4`. The path came from a developer-community answer, not the official docs, which only show HTTPS URLs.
- **Severity:** low. **Suggestion:** document local-file playback and the `/pkg/assets/raw` convention.

## 9. Host address from the Vega Virtual Device is undocumented
- **Task:** call a backend running on the development Mac from the app on the VVD.
- **Steps:** searched the Vega docs for the emulator-to-host loopback address.
- **Expected:** a documented address (like Android's 10.0.2.2).
- **Actual:** nothing in the docs. The device's default gateway (`vega exec vda -s emulator-5554 shell cat /proc/net/route`) is 10.0.2.2, which is QEMU user-mode networking; it reached a Node server bound to 127.0.0.1 on the Mac. Plain-HTTP `fetch` worked with `com.amazon.network.service` in the manifest (whether that service is required was not tested). The cleartext setting is documented only for WebViews.
- **Severity:** medium. **Workaround:** use `http://10.0.2.2:<port>` (or `vda reverse`). **Suggestion:** document the host address and the cleartext policy for `fetch`.

## 10. `player.currentTime` reads 0 immediately after `pause()`
- **Task:** capture the playback timestamp when the viewer presses the Ask key.
- **Steps:** call `pause()`, then read `currentTime`, in the same handler (w3cmedia 2.3.2, VVD).
- **Expected:** the paused position.
- **Actual:** 0. The question was sent with t=0 although the clip was at 12 s. Reading `currentTime` first and then pausing gives the right value (12.6 s, matching the burned-in counter).
- **Severity:** high (silently wrong data). **Workaround:** read before pausing. **Suggestion:** document the behaviour, or keep `currentTime` stable while paused (the same value did read correctly in an earlier test that logged it from a timer after pausing, so the cause may be timing-related; not verified).

## 11. Injecting remote keys needs `vda shell`, and the CLI examples don't say so
- **Task:** drive the app without a mouse for repeatable tests.
- **Actual:** `vega exec inputd-cli button_press KEY_MENU` fails with "No such file"; it works as `vega exec vda -s emulator-5554 shell "inputd-cli button_press KEY_MENU"` (inputd-cli lives on the device). `vda` itself is not on PATH after `source ~/vega/env`.
- **Severity:** low. **Suggestion:** show the full command in the inputd-cli doc.

## 12. New AWS account blocks Bedrock until "verification" completes (up to 2 h)
- **Task:** first live Bedrock Converse call (Nova Lite) from a freshly created account on the Free plan.
- **Steps:** create account, IAM user with `bedrock:InvokeModel`, `aws configure`, call Converse.
- **Expected:** the call works (the IAM identity and `list-foundation-models` already worked).
- **Actual:** `AccessDeniedException: Your account is currently being verified. Verification normally takes less than 2 hours.` Nothing in the console pointed to this beforehand.
- **Severity:** medium (a surprise wait during a deadline-driven hackathon).
- **Workaround:** wait, or contact AWS support after 2 hours.
- **Suggestion:** show a verification-status banner in the console and in the Bedrock page; mention it in hackathon onboarding for credits.

## 13. `bedrock:Converse` is not an IAM action
- **Task:** write the least-privilege policy for Converse.
- **Actual:** the policy editor reports "The action bedrock:Converse does not exist"; the Converse API is authorized by `bedrock:InvokeModel`. Easy to get wrong because the API name suggests a matching action.
- **Severity:** low. **Suggestion:** note the mapping on the Converse API reference page.

## 14. Vega Virtual Device does not survive the Mac sleeping/restarting; `run-app` error is opaque
- **Task:** relaunch the app on the VVD the next day.
- **Actual:** `vega device list` printed "No devices found" and `run-app` said it could not find 'VirtualDevice' (that message is clear), but nothing in the earlier session warned that the VVD had stopped; restarting needed another `vega virtual-device start`.
- **Severity:** low. **Workaround:** restart the VVD (about one minute when it works). **Suggestion:** a `vega virtual-device status` command and auto-start on `run-app`.

## 15. Bedrock SDK retries and abort signals need care to bound latency
- **Task:** keep the end-to-end time under the app's timeout with one retry.
- **Actual:** the AWS SDK retries on its own (default 3 attempts) with no total deadline, so a stuck call can exceed any UI timeout. We set `maxAttempts: 1`, pass an `AbortSignal` per attempt and wrap the call in our own race; the SDK's abort behavior is only verified through fake clients in tests, not against a real hung connection.
- **Severity:** low. **Suggestion:** document a recommended pattern for a total deadline across retries for interactive use cases.

## 16. Layout canvas is 960x540 dp, not 1920x1080 px (easy to size everything 2x too big)
- **Task:** size TV UI for 10-foot viewing.
- **Actual:** `Dimensions.get('window')` on the VVD returns {width: 960, height: 540, scale: 2}. Written for 1080p pixels, my first panel (860 wide, 46 px text) covered about 90% of the screen. The Fire TV design guidance is written in 1080p pixels, so the two conventions are easy to mix up.
- **Severity:** medium. **Workaround:** a `px()` helper that scales from a 1920 reference. **Suggestion:** state the dp canvas and the conversion next to the typography and safe-area guidance in the Vega UX docs.

## 17. Remote key event names differ from what the docs list
- **Task:** close the overlay when the viewer presses Play/Pause.
- **Actual:** `useTVEventHandler` reports `play` for the VVD's Play/Pause key (with `rewind`, `forward`); the docs list `playpause`/`skip_*`. Found with an on-screen key logger.
- **Severity:** low. **Workaround:** accept `play`, `pause` and `playpause`. **Suggestion:** document the event names the VVD actually emits per key.

## 18. VoiceView on the VVD: enabling works only via a key gesture; a system dialog then traps injected keys
- **Task:** verify screen-reader behavior of the overlay and answer card.
- **Steps:** `vdcm set ".../VoiceViewEnabled" "ENABLED"` fails with "No permission for operation". Holding Back + Menu for 3 s (via `inputd-cli`) does enable it (`vdcm get` then shows ENABLED). Holding Fast-forward + Rewind for 3 s turns on the Text Banner, which shows the text that would be spoken (very useful, no audio needed), but its explanatory dialog then ignored injected Enter/Right/Down presses (even a double Enter), so I could not dismiss it from the command line. Toggling VoiceView off (same gesture) and relaunching the app fixed it; the Text Banner setting persisted separately and kept working.
- **Not verified:** actual speech/audio on the VVD, and whether VoiceView intercepts the Menu key (Menu still opened the panel in the VVD with the banner on).
- **Severity:** medium for accessibility testing. **Suggestion:** allow `vdcm set` for accessibility settings on the VVD, make the Text Banner dialog respond to injected keys, and document the Text Banner as a way to verify spoken output.
