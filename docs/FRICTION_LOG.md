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
