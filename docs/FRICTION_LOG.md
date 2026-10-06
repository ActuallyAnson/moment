# Friction Log

Every entry has: task, steps, expected vs actual, severity, workaround, suggestion. Environment for all entries: macOS 27 (Apple Silicon, 18 GB RAM), Vega SDK 0.24.12112, Node 24.4.1, Bedrock in us-east-1, Oct 4-5 2026.
The entries most useful to the platform teams are 5, 6, 7, 9, 10, 12, 16 and 18.

## 1. Homebrew awscli fails to start on macOS (Apple Silicon)
- **Task:** install the AWS CLI via Homebrew.
- **Steps:** `brew install awscli`, then `aws --version`; repeated after `brew reinstall awscli`.
- **Expected:** prints the version.
- **Actual:** `ImportError ... Library not loaded: /opt/homebrew/opt/aws-c-s3/lib/libaws-c-s3.1.2.dylib`. Homebrew had installed aws-c-s3 1.3.0 while awscli 2.37.8 links against 1.2.
- **Severity:** medium (blocks Bedrock setup until fixed).
- **Workaround:** `brew reinstall aws-c-s3 awscli` (reinstalling both together fixed it the next day, awscli 2.37.9).
- **Suggestion:** pin compatible aws-c-* versions in the formula, or document the official pkg installer as the supported path.

## 2. Homebrew ffmpeg has no drawtext filter
- **Task:** generate a test video with a burned-in timestamp.
- **Steps:** `ffmpeg -filters | grep drawtext` returns nothing.
- **Expected:** drawtext is available.
- **Actual:** the default `ffmpeg` formula omits freetype; `ffmpeg-full` includes it but is much larger.
- **Severity:** low.
- **Workaround:** use the `testsrc` source, which has a built-in frame counter.
- **Suggestion:** mention it in clip-preparation docs for projects that need text overlays.

## 3. Vega installer requires closing VS Code
- **Task:** install the Vega SDK.
- **Steps:** follow https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html.
- **Expected:** the installer can run next to a running editor.
- **Actual:** the docs ask to close VS Code first, which interrupts any session that uses it as a terminal host.
- **Severity:** low.
- **Workaround:** close VS Code before running the installer.
- **Suggestion:** detect a running VS Code and offer to install the extension later.

## 4. Vega installer needs stdin; piped install fails
- **Task:** install the Vega SDK from a non-interactive shell.
- **Steps:** `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash`.
- **Expected:** installs with defaults.
- **Actual:** the CLI downloads, then fails at the "Enter new component installation directory" prompt with `failed to read input: EOF`; the script also reads `/dev/tty`, which is unavailable without a terminal.
- **Severity:** low.
- **Workaround:** download the script to a file and run `yes '' | bash get_vvm.sh` (or run it in a normal terminal window).
- **Suggestion:** support a `--yes` flag and fall back to defaults when stdin is not a TTY.

## 5. Vega Virtual Device stuck on the Fire TV boot logo (macOS 27, Apple Silicon)
- **Task:** boot the Vega Virtual Device (VVD).
- **Steps:** `vega virtual-device start --timeout 180`.
- **Expected:** boots to the home screen within the timeout and appears in `vega device list`.
- **Actual:** the VVD window opened and stayed on the Fire TV logo for 17+ minutes at about 250% CPU; `vega device list` stayed empty and the `start` command ignored its 180 s timeout and kept running.
- **Severity:** high (blocks the whole Vega path).
- **Workaround:** kill all VVD processes, then `vega virtual-device start --timeout 600`; the second boot reported "Virtual device ready" within about a minute. The cause of the first hang is unknown.
- **Suggestion:** make the timeout terminate the process and print a cause; add boot hangs on Apple Silicon and newer macOS releases to the troubleshooting page; list supported macOS versions in the install doc.

## 6. `build-vega` hangs silently on watchman under ~/Documents (macOS)
- **Task:** build the hello-world app.
- **Steps:** repo inside `~/Documents/GitHub/...`, watchman installed via Homebrew (a Vega prerequisite), run `npm run build:app` (which runs `react-native build-vega --build-type Release`).
- **Expected:** the build completes in a minute or two.
- **Actual:** 13+ minutes at 0% CPU with no output. With stdin closed, Metro prints `Waiting for Watchman watch-project (Ns)...` forever. Cause: macOS shows a one-time dialog "watchman would like to access files in your Documents folder" that is easy to miss, and watchman blocks until it is answered; the npm wrapper hides Metro's message entirely.
- **Severity:** high (looks like a hang, cost about 15 minutes).
- **Workaround:** click Allow on the macOS prompt, or keep the project outside Documents/Desktop/Downloads. (A stub `watchman` earlier on PATH that exits 1 also let the build finish.)
- **Suggestion:** warn in the install docs about macOS-protected folders; have `build-vega` surface the watchman wait message and time out.

## 7. w3cmedia docs pin an old version and hide an ordering trap
- **Task:** play a bundled MP4 with `VideoPlayer` and `KeplerVideoSurfaceView` on React Native 0.83.
- **Steps:** follow media-player-setup (pins `~2.1.80` and a `metro-react-native-babel-preset` babel config) and the package README example.
- **Expected:** copy-paste setup works on the current `helloWorld` template.
- **Actual:** npm `latest` (2.3.2) worked without touching `babel.config.js` (the documented preset is from the RN 0.72 era). The README example calls `play()` inside `onSurfaceViewCreated`, but the surface was created twice before `loadedmetadata`, so `play()` ran without a source and the clock stayed at 0 with no error.
- **Severity:** medium (silent failure, no error event).
- **Workaround:** call `play()` only after both the surface exists and `loadedmetadata` has fired.
- **Suggestion:** update the docs to the current version and template, and show the surface-created / metadata-loaded ordering in the example.

## 8. Local asset playback path is undocumented
- **Task:** play a video file bundled inside the app.
- **Steps:** looked in the official media docs for a local-file URI; found only HTTPS URLs.
- **Expected:** a documented path convention for packaged assets.
- **Actual:** `/pkg/assets/raw/clip.mp4`, with the file at `app/assets/raw/clip.mp4`, worked. The path came from a developer-community answer, not the official docs.
- **Severity:** low.
- **Workaround:** use that path.
- **Suggestion:** document local-file playback and the `/pkg/assets/raw` convention.

## 9. Host address from the VVD is undocumented
- **Task:** call a backend running on the development Mac from the app on the VVD.
- **Steps:** searched the Vega docs for the emulator-to-host loopback address; read the device's default route (`vega exec vda -s emulator-5554 shell cat /proc/net/route`).
- **Expected:** a documented host address (as on other emulators).
- **Actual:** nothing in the docs. The default gateway is 10.0.2.2 (QEMU user-mode networking) and it reached a Node server bound to 127.0.0.1 on the Mac. Plain-HTTP `fetch` worked with `com.amazon.network.service` in the manifest (whether that service is required was not tested). The cleartext setting is documented only for WebViews.
- **Severity:** medium.
- **Workaround:** use `http://10.0.2.2:<port>` (or `vda reverse`).
- **Suggestion:** document the host address and the cleartext policy for `fetch`.

## 10. `player.currentTime` reads 0 immediately after `pause()`
- **Task:** capture the playback timestamp when the viewer presses the Ask key.
- **Steps:** call `pause()`, then read `currentTime` in the same handler (w3cmedia 2.3.2, VVD).
- **Expected:** the paused position.
- **Actual:** 0, so a question was sent with t=0 while the clip was at 12 s. Reading `currentTime` first and then pausing gives the right value (12.6 s, matching the burned-in counter). A timer that logged `currentTime` after pausing in an earlier test read correctly, so the cause may be timing-related (not verified).
- **Severity:** high (silently wrong data).
- **Workaround:** read the time before pausing.
- **Suggestion:** document the behaviour, or keep `currentTime` stable while paused.

## 11. Injecting remote keys needs `vda shell`; the examples don't say so
- **Task:** drive the app without a mouse for repeatable tests.
- **Steps:** `vega exec inputd-cli button_press KEY_MENU`.
- **Expected:** the key press reaches the VVD.
- **Actual:** "No such file": `inputd-cli` lives on the device. `vega exec vda -s emulator-5554 shell "inputd-cli button_press KEY_MENU"` works. `vda` itself is not on PATH after `source ~/vega/env`.
- **Severity:** low.
- **Workaround:** the full command above.
- **Suggestion:** show the complete command in the inputd-cli doc.

## 12. A new AWS account blocks Bedrock until "verification" completes (up to 2 h)
- **Task:** first live Bedrock Converse call (Nova Lite) from a freshly created account on the Free plan.
- **Steps:** create the account, an IAM user with `bedrock:InvokeModel`, `aws configure`, call Converse.
- **Expected:** the call works (the IAM identity and `list-foundation-models` already worked).
- **Actual:** `AccessDeniedException: Your account is currently being verified. Verification normally takes less than 2 hours.` Nothing in the console warned about this beforehand.
- **Severity:** medium (a surprise wait during a deadline-driven hackathon).
- **Workaround:** wait (it cleared on a later retry the same day), or contact AWS support after 2 hours.
- **Suggestion:** show a verification-status banner in the console and on the Bedrock page; mention it in hackathon onboarding.

## 13. `bedrock:Converse` is not an IAM action
- **Task:** write a least-privilege policy for the Converse API.
- **Steps:** add `bedrock:Converse` to a JSON policy in the IAM editor.
- **Expected:** an action matching the API name.
- **Actual:** "The action bedrock:Converse does not exist"; the Converse API is authorized by `bedrock:InvokeModel`.
- **Severity:** low.
- **Workaround:** allow `bedrock:InvokeModel` (plus the list actions used for checks).
- **Suggestion:** note the mapping on the Converse API reference page.

## 14. The VVD does not survive the Mac sleeping or restarting
- **Task:** relaunch the app on the VVD the next day.
- **Steps:** `vega run-app ... -d VirtualDevice`, then `vega device list`.
- **Expected:** the device is still running, or `run-app` starts it.
- **Actual:** "No devices found" and a "Couldn't find device 'VirtualDevice'" error; nothing had warned that the VVD had stopped.
- **Severity:** low.
- **Workaround:** `vega virtual-device start --timeout 600` (about a minute when it works).
- **Suggestion:** add `vega virtual-device status` and an option to auto-start on `run-app`.

## 15. Bedrock SDK retries and abort signals need care to bound latency
- **Task:** keep end-to-end time under the app's timeout with one retry.
- **Steps:** read the AWS SDK for JS v3 retry behavior; wrote fake clients that hang, flake or fail.
- **Expected:** a simple way to set a total deadline.
- **Actual:** the SDK retries by itself (default 3 attempts) with no total deadline, so a stuck call can exceed any UI timeout. We set `maxAttempts: 1`, pass an `AbortSignal` per attempt and wrap the call in our own race. This behavior is verified through fake clients in tests, not against a real hung connection.
- **Severity:** low.
- **Workaround:** the pattern above (attempt timeouts 4 s + 3 s).
- **Suggestion:** document a recommended total-deadline pattern for interactive use cases.

## 16. Layout canvas is 960x540 dp, not 1920x1080 px
- **Task:** size TV UI for 10-foot viewing.
- **Steps:** built the first UI from 1080p-pixel guidance, then read `Dimensions.get('window')` on the VVD.
- **Expected:** a 1920x1080 canvas.
- **Actual:** `{width: 960, height: 540, scale: 2}`. Sized for 1080p pixels, my first panel (860 wide, 46 px text) covered about 90% of the screen. The Fire TV design guidance is in 1080p pixels, so the two conventions are easy to mix up.
- **Severity:** medium.
- **Workaround:** a `px()` helper that scales from a 1920 reference.
- **Suggestion:** state the dp canvas and the conversion next to the typography and safe-area guidance.

## 17. Remote key event names differ from the docs
- **Task:** close the overlay when the viewer presses Play/Pause.
- **Steps:** logged `useTVEventHandler` events on the VVD.
- **Expected:** `playpause` (and `skip_*`) as listed in the docs.
- **Actual:** the VVD's Play/Pause key arrives as `play`; the others as `rewind` and `forward`.
- **Severity:** low.
- **Workaround:** accept `play`, `pause` and `playpause`.
- **Suggestion:** document the event names the VVD emits per key.

## 18. VoiceView on the VVD: enabling only via a key gesture; a system dialog then traps injected keys
- **Task:** verify screen-reader behavior of the overlay and the answer card.
- **Steps:** `vdcm set ".../VoiceViewEnabled" "ENABLED"`; then holding Back + Menu for 3 s through `inputd-cli`; then holding Fast-forward + Rewind for 3 s (Text Banner).
- **Expected:** a documented command enables VoiceView, and injected keys control the settings dialogs.
- **Actual:** `vdcm set` fails with "No permission for operation". The Back + Menu hold does enable VoiceView (`vdcm get` shows ENABLED). The Text Banner shows the text that would be spoken (very useful, no audio needed), but its explanatory dialog ignored injected Enter/Right/Down presses (even a double Enter). Turning VoiceView off with the same gesture and relaunching the app fixed it; the Text Banner setting persisted separately.
- **Not verified:** actual speech on the VVD, and whether VoiceView intercepts the Menu key (Menu still opened the panel with the banner on).
- **Severity:** medium for accessibility testing.
- **Workaround:** the Back + Menu hold, and reading the Text Banner.
- **Suggestion:** allow `vdcm set` for accessibility settings on the VVD, make the Text Banner dialog respond to injected keys, and document the Text Banner as a way to verify spoken output.

## 19. The app's `console.log` output could not be found on the VVD (release build)
- **Task:** read the app's own timing logs (`[moment] answer ms=... source=...`) to report end-to-end latency from the app.
- **Steps:** built a release app, ran it on the VVD, then searched the device with `vega exec vda -s emulator-5554 shell "journalctl --no-pager | grep moment"` (the journal had about 30 lines in total), `vega exec vda -s emulator-5554 logcat -d` (one empty line), and `ls /var/log` (empty). Debug builds, Metro's console and `vega` logging commands were not tried.
- **Expected:** a documented way to read `console.log` from a running app.
- **Actual:** none of the places above showed the app's output.
- **Severity:** low to medium (blocks measuring on-device timings from app code).
- **Workaround:** measure from the backend (request log with `source` and `waitedMs`) and from a client that makes the same HTTP calls (`backend/scripts/measure-prefetch.ts`); use the panel's on-screen "Paused at" label to read the playback position (`tools/dev/replay_check.py`).
- **Suggestion:** document where release-build JS logs go on the VVD, or add a `vega logs` command.
