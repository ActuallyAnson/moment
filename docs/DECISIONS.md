# Decisions

| Date | Decision | Why | Alternatives |
|---|---|---|---|
| 2026-10-04 | Platform: Vega OS (React Native) | User on Apple Silicon Mac; Vega is Amazon's newer platform | Fire OS on Android TV emulator |
| 2026-10-04 | Backend: TypeScript/Node | One language across app, backend, eval | Java/Spring Boot, Python, C++ |
| 2026-10-04 | App name: Moment | User choice | scene-qa placeholder |
| 2026-10-04 | Vision models: Nova Lite primary, Nova Pro fallback (provisional) | Cheap, Amazon-native, image input; to be verified against docs and account | literal:other Bedrock vision models |
| 2026-10-04 | `react-native-w3cmedia` latest (2.3.2), RN 0.83 `helloWorld` template, default babel config | Works on the VVD; doc's pinned 2.1.80 and babel preset are stale | `rn83-alpha` tag, `helloWorld-rn72` template (not needed) |
| 2026-10-04 | Bundled clip played from `/pkg/assets/raw/clip.mp4` | Works on VVD, no host networking needed yet | HTTPS from host machine |
