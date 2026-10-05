# Decisions

| Date | Decision | Why | Alternatives |
|---|---|---|---|
| 2026-10-04 | Platform: Vega OS (React Native) | User on Apple Silicon Mac; Vega is Amazon's newer platform | Fire OS on Android TV emulator |
| 2026-10-04 | Backend: TypeScript/Node | One language across app, backend, eval | Java/Spring Boot, Python, C++ |
| 2026-10-04 | App name: Moment | User choice | scene-qa placeholder |
| 2026-10-04 | Vision models: Nova Lite primary, Nova Pro fallback (provisional) | Cheap, Amazon-native, image input; to be verified against docs and account | literal:other Bedrock vision models |
| 2026-10-04 | `react-native-w3cmedia` latest (2.3.2), RN 0.83 `helloWorld` template, default babel config | Works on the VVD; doc's pinned 2.1.80 and babel preset are stale | `rn83-alpha` tag, `helloWorld-rn72` template (not needed) |
| 2026-10-04 | Bundled clip played from `/pkg/assets/raw/clip.mp4` | Works on VVD, no host networking needed yet | HTTPS from host machine |
| 2026-10-04 | Ask key = Menu (F2 on the VVD keyboard); Select also opens it while idle | Home is OS-owned; play/pause/rewind/forward may belong to media modules and viewers expect them to keep their meaning | Play/pause key |
| 2026-10-04 | Act on key-up only | Avoids the opening key's release selecting the first question | Act on key-down |
| 2026-10-04 | Backend reached at 10.0.2.2:8787; backend binds 127.0.0.1 | Works on the VVD with no firewall prompt | `vda reverse` + 127.0.0.1 |
| 2026-10-04 | Removed unused template files (tiles, images, template tests) | Dead code; UI tests are out of scope per brief | Keep |
| 2026-10-04 | Clip: Tears of Steel excerpt 0:20-1:05 (CC-BY 3.0), original audio replaced with silence | Has dialogue + official SRT, readable on-screen text, two people, lab scene; the soundtrack is credited CC-BY-ND, which the brief says to avoid | Sintel (animated, fallback), Big Buck Bunny (no dialogue) |
| 2026-10-04 | Media files not committed; `clips/fetch-tos.sh` rebuilds them; index.json + subs.srt are committed | Keeps repo small; reproducible | Git LFS |
| 2026-10-04 | Bedrock: us-east-1, in-region `amazon.nova-lite-v1:0` primary, `amazon.nova-pro-v1:0` fallback (to verify on the account) | No inference profile needed there; cheapest; no model-access request for Amazon models per AWS docs | ap-southeast-1 (Geo profiles only, ~35% higher price) |
| 2026-10-04 | `@aws-sdk/client-bedrock-runtime` is NOT installed yet; LiveClient imports it lazily | Over the 1 MB dependency rule; ask when AWS exists | Install now |
| 2026-10-04 | Only live calls are written to eval/cost_log.csv; stub calls are not | Stub rows would pollute the spend total | Log both |
| 2026-10-04 | Prompt says: name people only if subtitles name them; never identify real faces | Nova docs say it refuses to identify individuals | None |
| 2026-10-05 | Installed `@aws-sdk/client-bedrock-runtime` in backend (14 MB node_modules) | Needed for the live Bedrock call; user pre-approved the Bedrock integration | Raw SigV4 over fetch (more code, no benefit) |
| 2026-10-05 | AWS profile `moment` (IAM user `moment-dev`, InvokeModel + list actions only), region us-east-1 | Least privilege; key stored only in ~/.aws | Console session login, Bedrock API key |
| 2026-10-05 | System prompt v2: describe what frames show, narrate action oldest->newest for "what happened", say "I'm not sure" only when the answer is not in any frame, no "Answer:" label; parser also strips the label | v1 over-refused on 3/10 questions the frames clearly answer | Switch to Nova Pro (not tried yet) |
