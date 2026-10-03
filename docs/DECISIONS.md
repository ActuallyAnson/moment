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
