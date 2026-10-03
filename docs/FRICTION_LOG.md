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
