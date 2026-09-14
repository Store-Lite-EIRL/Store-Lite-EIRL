# Skill Registry — Store_Lite (store-lite-eirl)

> Index of available agent skills. The `SKILL.md` at each path is the source of truth — sub-agents receive exact paths and read the full file. This registry is an index, not a summary.

Generated: 2026-09-05
Cache status: regenerated (no previous registry found)

## Registry Contract

- Skip `sdd-*`, `_shared`, and `skill-registry` from indexing.
- Deduplicate by skill name; project-level copies win over user-level copies.
- Same skill in multiple user locations: keep the first source in scan order.
- Convention index files (`AGENTS.md`, etc.) are listed, plus referenced shared docs.

## Scanned Sources

| Source | Found |
| ------ | ----- |
| `~/.config/opencode/skills/` | ✅ (mirror set; superseded by project copies where duplicated) |
| `~/.agents/skills/` | ✅ (Dart/Flutter set — unique) |
| `~/.claude/skills/` | ✅ (mirror set; superseded) |
| `~/.config/kilo/skills/`, `~/.gemini/skills/`, `~/.cursor/skills/`, `~/.copilot/skills/`, `~/.codex/skills/`, `~/.qwen/skills/` | ✅ (mirror sets; superseded) |
| `{root}/.openclaw/skills/` | ✅ (project-level Gentle AI set — preferred for duplicated skills) |
| `{root}/.claude/skills/` | ✅ (`integration-nextjs-app-router` — unique project skill) |

## Indexed Skills

| Skill | Trigger / Description | Scope | Path |
| ----- | --------------------- | ----- | ---- |
| branch-pr | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\branch-pr\SKILL.md` |
| chained-pr | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\chained-pr\SKILL.md` |
| cognitive-doc-design | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\cognitive-doc-design\SKILL.md` |
| comment-writer | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\comment-writer\SKILL.md` |
| go-testing | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\go-testing\SKILL.md` |
| issue-creation | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\issue-creation\SKILL.md` |
| judgment-day | Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\judgment-day\SKILL.md` |
| skill-creator | Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\skill-creator\SKILL.md` |
| skill-improver | Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\skill-improver\SKILL.md` |
| work-unit-commits | Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs, or keeping tests and docs with code. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\work-unit-commits\SKILL.md` |
| integration-nextjs-app-router | PostHog integration for Next.js App Router applications. | project | `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.claude\skills\integration-nextjs-app-router\SKILL.md` |
| dart-add-unit-test | Write and organize unit tests for functions, methods, and classes using `package:test`. Use when creating new logic or fixing bugs to ensure code remains correct and regression-free. | user | `C:\Users\Ernestiboro\.agents\skills\dart-add-unit-test\SKILL.md` |
| dart-flutter-patterns | Production-ready Dart and Flutter patterns (null safety, immutable state, async composition, widget architecture, state management, GoRouter, Dio, Freezed, clean architecture). Use when writing or reviewing Dart and Flutter code. | user | `C:\Users\Ernestiboro\.agents\skills\dart-flutter-patterns\SKILL.md` |
| dart-generate-test-mocks | Define and generate mock objects for external dependencies using `package:mockito` and `build_runner`. Use when unit testing classes that depend on complex external services. | user | `C:\Users\Ernestiboro\.agents\skills\dart-generate-test-mocks\SKILL.md` |
| dart-resolve-package-conflicts | Workflow for fixing package version conflicts. Use when `pub get` fails due to incompatible package versions. | user | `C:\Users\Ernestiboro\.agents\skills\dart-resolve-package-conflicts\SKILL.md` |
| dart-run-static-analysis | Execute `dart analyze` and `dart fix --apply`. Use during development and before committing. | user | `C:\Users\Ernestiboro\.agents\skills\dart-run-static-analysis\SKILL.md` |
| find-skills | Helps users discover and install agent skills when they ask "how do I do X", "find a skill for X", or express interest in extending capabilities. | user | `C:\Users\Ernestiboro\.agents\skills\find-skills\SKILL.md` |
| flutter-add-integration-test | Configures Flutter Driver for app interaction and converts MCP actions into permanent integration tests. Use when adding integration testing or automating user flows. | user | `C:\Users\Ernestiboro\.agents\skills\flutter-add-integration-test\SKILL.md` |
| flutter-apply-architecture-best-practices | Architects a Flutter application using the recommended layered approach (UI, Logic, Data). Use when structuring a new project or refactoring for scalability. | user | `C:\Users\Ernestiboro\.agents\skills\flutter-apply-architecture-best-practices\SKILL.md` |
| flutter-expert | Use when building cross-platform applications with Flutter 3+ and Dart. Widget development, Riverpod/Bloc state management, GoRouter navigation, platform implementations, performance. | user | `C:\Users\Ernestiboro\.agents\skills\flutter-expert\SKILL.md` |
| flutter-setup-declarative-routing | Configure `MaterialApp.router` with `go_router` for URL-based navigation and deep links. | user | `C:\Users\Ernestiboro\.agents\skills\flutter-setup-declarative-routing\SKILL.md` |
| flutter-use-http-package | Use the `http` package to execute GET, POST, PUT, DELETE requests against REST APIs. | user | `C:\Users\Ernestiboro\.agents\skills\flutter-use-http-package\SKILL.md` |

## Skipped (per registry contract)

- `sdd-*` phase skills (init, explore, propose, spec, design, tasks, apply, verify, archive, onboard) — load via the orchestrator's SDD delegation, not the registry. Canonical copy: `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\{name}\SKILL.md`
- `skill-registry`, `_shared` — support artifacts, not invokable skills.

## Convention Indexes and Shared References

| File | Role |
| ---- | ---- |
| `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\AGENTS.md` | Project agent instructions (persona, Engram protocol, SDD orchestrator contract, strict TDD marker) |
| `C:\Users\Ernestiboro\.config\opencode\AGENTS.md` | Global agent instructions (persona, Engram protocol) |
| `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\_shared\sdd-phase-common.md` | Shared SDD phase loading/retrieval/persistence/return envelope |
| `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\_shared\skill-resolver.md` | How delegators select and pass skill paths |
| `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\_shared\openspec-convention.md` | openspec layout and writing rules |
| `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\_shared\engram-convention.md` | Engram artifact naming |
| `C:\Users\Ernestiboro\Desktop\Proyects\web\Store_Lite\.openclaw\skills\_shared\persistence-contract.md` | Persistence contracts across modes |
| `C:\Users\Ernestiboro\.config\opencode\skills\_shared\*` | Global fallback copies of the same shared references |

## Notes

- 22 skills indexed (11 project, 11 user).
- 5 mirror locations carry identical copies of the Gentle AI set (`~/.claude/skills`, `~/.config/kilo/skills`, `~/.gemini/skills`, `~/.cursor/skills`, `~/.copilot/skills`, `~/.codex/skills`, `~/.qwen/skills`, `~/.config/opencode/skills`); duplicates resolved to the project-level `.openclaw/skills/` copies.
- `.atl/` is gitignored (see `.gitignore` line 7) — registry is local to the workspace.