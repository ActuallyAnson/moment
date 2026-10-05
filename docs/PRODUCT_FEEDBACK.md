# Product feedback

One section per tool used to build Moment. Each answers: what we used it for, what worked, what needs work, how onboarding went, and whether we would build with it again. Facts come from `docs/FRICTION_LOG.md` (entries referenced as #n), `docs/PROGRESS.md` and `eval/`.

## Vega SDK, Vega Virtual Device and `react-native-w3cmedia`
- **Used for:** the whole Fire TV app: React Native 0.83 UI, video playback with `VideoPlayer`/`KeplerVideoSurfaceView`, remote-key handling (`useTVEventHandler`, `BackHandler`, `TVFocusGuideView`), screen-reader labels, and testing on the Vega Virtual Device (VVD) with `vega run-app` and `inputd-cli` key injection.
- **What worked:** the VVD runs on Apple Silicon and, once booted, restarts in about a minute. The `helloWorld` template built and ran; `react-native-w3cmedia` 2.3.2 played a bundled MP4 without changing the template's babel config. `inputd-cli` made remote testing repeatable from the command line (a full no-mouse run through ask, answer, retry and Back). The VoiceView Text Banner shows the text that would be spoken, which let us check labels without audio (#18). Focus management with `TVFocusGuideView` trapping and `hasTVPreferredFocus` worked on the first try.
- **What needs work:** the first VVD boot hung on the Fire TV logo for 17+ minutes and ignored its timeout (#5); `build-vega` stalled silently on a macOS permission prompt for watchman (#6); the w3cmedia docs pin an old version and the README example hides an ordering trap where `play()` before the source is set fails silently (#7); `currentTime` read 0 right after `pause()` (#10); the layout canvas is 960x540 dp, easy to confuse with 1080p guidance (#16); the emulator-to-host address and `fetch` cleartext policy are undocumented (#9); key event names differ from the docs (#17); VoiceView can only be enabled through a key gesture and a system dialog then trapped injected keys (#18); the installer needs a TTY (#4) and asks to close VS Code (#3).
- **Onboarding:** the SDK installed and a hello-world app ran on the first day (Oct 4), after the boot hang was cleared by one restart and the watchman prompt was answered. Video playback needed one fix (#7). About 35 minutes of avoidable waiting on that first day came from the boot hang and the watchman stall.
- **Would we build with it again?** Yes. The React Native model and the emulator were productive once running. The main asks are reliable emulator boot and a few documentation fixes (see `docs/FEATURE_REQUESTS.md`).

## Amazon Bedrock (Amazon Nova Lite and Nova Pro) and the Converse API
- **Used for:** the "AWS Builder" part of the project. Each question is one Converse call in us-east-1 to `amazon.nova-lite-v1:0` with up to five JPEG frames (512 px wide) plus a text prompt, returning a one- or two-sentence answer. Nova Pro (`amazon.nova-pro-v1:0`) was compared in the experiment.
- **What worked:** image input with several frames per request in one call; no model-access request was needed for the Nova models. Measured on our 35-question test split: p50 about 2.5 s and p95 3.2 s per answer with Nova Lite, about $0.0003 per question (about 3.7K-3.9K input tokens for five 512 px frames), and 348 live calls cost $0.2613 in total. The usage numbers returned by Converse made an exact cost log easy. With our final prompt Nova Lite read on-screen text correctly on most questions (70% on the test split, 5 questions) and abstained correctly on 91% of "not visible" questions; counting was weaker (50%, 6 questions).
- **What needs work:** a brand-new account was blocked with "account is currently being verified" for a while, with no earlier warning (#12). Nova Pro was throttled on 1 of 35 sequential requests. Nova Lite was over-cautious with a plain "say I'm not sure if unsure" prompt (it refused 3 of 8 answerable dev questions it should have answered), and weak on "what just happened" action questions (63% on the test split, 4 questions). Model behavior on identity questions about live-action people was not tested beyond describing appearance; Amazon's documentation says Nova will not identify individuals.
- **Onboarding:** Account, IAM user and CLI profile were set up in one sitting; the verification wait was the surprise. `list-foundation-models` and the Converse request format were straightforward once access worked.
- **Would we build with it again?** Yes. At three hundredths of a cent per question it is cheap enough to evaluate many configurations; in our test a 13x more expensive model (Nova Pro) was not better (69% vs 73%) and was slower at p95 (5.0 s vs 3.2 s).

## AWS IAM and the AWS CLI
- **Used for:** a least-privilege IAM user (`bedrock:InvokeModel` plus list actions) and an AWS CLI profile used by the backend and eval scripts.
- **What worked:** the least-privilege user was enough for everything, including Converse. Credentials stay in the local AWS profile, never in the repository.
- **What needs work:** `bedrock:Converse` is not an IAM action (#13); the Homebrew awscli build failed to start until reinstalled together with its dependency (#1).
- **Onboarding:** straightforward once we found the Converse/`InvokeModel` mapping.
- **Would we use it again?** Yes.

## AWS SDK for JavaScript v3 (`@aws-sdk/client-bedrock-runtime`)
- **Used for:** the live Bedrock client in the Node backend (`ConverseCommand`), with one reused client, a per-attempt `AbortSignal` and our own retry (4 s then 3 s attempts).
- **What worked:** typed requests and the usage fields in the response; the lazy import keeps stub mode and tests free of AWS.
- **What needs work:** default retries have no total deadline, so we disabled them and built our own (#15); the install is about 14 MB of `node_modules`.
- **Onboarding:** quick.
- **Would we use it again?** Yes.

## ffmpeg
- **Used for:** cutting clip excerpts, replacing audio with silence, transcoding to H.264/AAC for the TV, and extracting 512 px keyframes at 2 fps.
- **What worked:** seeking directly into remote files, so a 372 MB source did not need a full download; one command per step.
- **What needs work:** the default Homebrew build has no `drawtext` filter (#2).
- **Onboarding:** none needed.
- **Would we use it again?** Yes.

## Node.js 24
- **Used for:** the backend, the eval harness and all scripts, written in TypeScript and run directly with Node's built-in type stripping, plus `node:test`.
- **What worked:** no build step and fast tests (the whole backend suite runs in well under a second on the development Mac).
- **What needs work:** `.ts` imports need explicit extensions and no enums, which surprised us once.
- **Onboarding:** none needed.
- **Would we use it again?** Yes.
