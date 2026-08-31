# Verification Report — business-public-info

**Change**: `business-public-info` (`storefront-public-info`)
**Artifact store**: openspec (files) + Engram (`sdd/business-public-info/verify-report`, project `store-lite-eirl`)
**Date**: 2026-08-30
**Verdict**: **PASS** — 6/6 requirements compliant, 12/12 spec scenarios covered by 21 passing tests

## Completeness

| Artifact | Status |
|----------|--------|
| Spec (R1–R6, 12 scenarios) | ✅ retrieved |
| Tasks | ✅ retrieved |
| Apply-progress | ✅ retrieved |
| Design | ✅ retrieved |

## Build / Tests / Coverage

| Check | Result |
|-------|--------|
| Targeted suite (`businessPreviewCard.test.tsx` + `storefrontAboutSection.test.tsx`) | ✅ 21 passed (21) |
| Full suite (`pnpm vitest run`) | ✅ 993 passed / 998 — 5 fails all in `settingsActions.test.ts` (pre-existing plan-enforcement / PostHog, unrelated to this change). 92/93 files pass. |
| Type-check (`tsc --noEmit`) | ✅ exit 0 |
| Lint | ✅ 0 errors; 1 warning (changed file) |
| Coverage (changed files) | Not isolated; project-wide 1.48% (pre-existing config). Informational. |

## Strict TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | RED→GREEN→REFACTOR documented in apply-progress |
| RED confirmed (test files exist) | ✅ | both test files present |
| GREEN confirmed (tests pass) | ✅ | 21/21 pass on execution |
| Triangulation | ✅ | parameterized status tests (each status → label), exact-href asserts |
| Safety Net / refactor | ✅ | new files, no modified-file regression |

Note: apply-progress reported GREEN "9/9 and 12/12"; actual counts are card 8 / section 13 (same 21 total) — minor reporting mismatch only.

## Spec Compliance Matrix

| Req | Scenario | Status | Evidence |
|-----|----------|--------|----------|
| R1 | Fully populated business | ✅ | storefrontAboutSection.test.tsx L76–114 (full fixture: description, type, mailto, wa.me, badge, social) |
| R1 | Sparse business | ✅ | L130–143, L145–149 (no empty rows/placeholders) |
| R2 | Each enum status | ✅ | card test L53–64; section test L116–128 |
| R2 | Unknown status | ✅ | card L408 fallback; section getVerificationConfig L40–51; tests L190–204 |
| R3 | Social link | ✅ | card test L72–92; section L104–114 |
| R3 | Phone link | ✅ | card test L94–108 (wa.me digits); section L92–109 |
| R4 | New props supplied | ✅ | card test L72–108; StorefrontAboutSection passes all new props L184–189 |
| R4 | No new props | ✅ | card test L38–51 (unchanged); active callers (create-business BusinessPreview.tsx) pass no new props; tsc clean |
| R5 | Dark scheme | ✅ CLOSED (2026-08-30) | See "R5 Closure Addendum" below — dark branch now exercised by `ae9b4d3` |
| R5 | Capture safety (no Material ligature in card) | ✅ | New badges/social rows use inline SVG; the card's Material `Icon` elements (palette/download) sit OUTSIDE `captureRef` |
| R6 | Card with new props | ✅ | card test L37–108 (mocks `@/core/storefront` + `@/shared/components/ui`) |
| R6 | Section derivation logic | ✅ | storefrontAboutSection.test.tsx L154–204 (getPersonTypeLabel/getVerificationConfig pure helpers) |

## Correctness

| Check | Result | Evidence |
|-------|--------|----------|
| DB enum matches card union | ✅ | `schema/businesses.ts` L69–73: `['unverified','pending','verified','rejected']` == card `VerificationStatus` |
| `socialLinks` present on Business | ✅ | `schema/businesses.ts` L1417: `socialLinks: jsonb` default `{}` |
| `verificationStatus` never null in DB | ✅ | `.notNull().default('unverified')` (L71–73) — card handles null defensively anyway |
| R2 "no verified style for others" enforced | ✅ | both card badge (L408) and section helper (L48–50) |

## Design Coherence

| Decision | Status | Notes |
|----------|--------|-------|
| D1 `coverImageUrl` contract-only, not rendered | ✅ | accepted prop (L162), never rendered in card header |
| D2 inline subcomponents in card + exported `SocialLinksRow` | ✅ | `VerificationBadge` + `SocialLinksRow` in card file; section imports `SocialLinksRow` |
| D3 VerificationBadge mapping (4 states + fallback + inline SVG) | ✅ | `VERIFICATION_BADGE_META` + `VerificationBadge` |
| D4 Nosotros left column order | ✅ | description→type→email→phone→badge→social |
| **DEVIATION**: section extracted to own `StorefrontAboutSection.tsx` (design said inline in BusinessPageContent) | ⚠️ | Justified by testability (BusinessPageContent is untestable, ~15–24 mocks). No spec requirement broken. |

## Issues

### WARNING
1. **R5 "Dark scheme" scenario untested** — no test passes `colorScheme='dark'` or exercises the card's `isDark=true` branch in `VerificationBadge`/`SocialLinksRow` (tests mock the scheme to `'light'`). Dark-safe tokens are statically defined (card `colorDark`, CSS `--md-sys-*`) but the branch is not proven at runtime. Cosmetic/presentational, not business logic — hence WARNING not CRITICAL.
   - Files: `tests/unit/businessPreviewCard.test.tsx` L5–12, `src/shared/components/business/BusinessPreviewCard.tsx` L422 / L482–484
2. **Changed-file coverage not isolated** — project-wide coverage 1.48% (pre-existing vitest config); the applied change files' coverage couldn't be isolated. Informational per strict-TDD.

### SUGGESTION
1. **Lint complexity** — `StorefrontAboutSection.tsx:132` function complexity 23 > 20 max. Refactor the section into smaller sub-render functions.
2. **Apply-progress GREEN counts** — reported "9/9 and 12/12"; actual are 8 and 13 (still 21 total). Minor bookkeeping mismatch only.

### CRITICAL
None.

## Pre-existing failures (NOT part of this change)
5 fails in `tests/unit/server-actions/settingsActions.test.ts` ("plan enforcement") — updateBusinessSlug / updateStorefrontTheme / updateCulqiCredentials — pre-existing PostHog/plan-related, unrelated to business-public-info (which touches storefront UI + card only).

## Next Recommended
**archive** — all R1–R6 compliant, 21 targeted + 993 full-suite tests pass, non-blocking WARNINGs only. Optionally add a dark-scheme test in a follow-up.

## Risks
- ~~R5 dark branch untested~~ **CLOSED** (see below); remaining risk is greenfield token drift.
- `StorefrontAboutSection` complexity creeping toward the lint threshold — watch during future edits.

---

## R5 Closure Addendum (2026-08-30)

**Commit**: `ae9b4d3` — `test(business): cover dark scheme in badge and social rows` (on `feat/business-public-info`).
**Re-validation**: PASS.

### What was added
In `tests/unit/businessPreviewCard.test.tsx`, a new block `describe('BusinessPreviewCard — dark color scheme (R5 coverage)')` with 4 tests, plus the mock updated so `normalizeStorefrontColorScheme` returns `'dark'` when `colorScheme === 'dark'` (light default preserved for existing tests):
1. `verificationStatus="verified"` + `colorScheme="dark"` → badge `color: #4ade80` (verified `colorDark`).
2. `verificationStatus="verified"` (no scheme) → badge `color: #16a34a` (verified light color) — light branch intact.
3. `colorScheme="dark"` + socialLinks + whatsapp → social background `rgba(255,255,255,0.14)` (dark) — AND re-asserts the safe-link contract (`target=_blank`, `rel="noopener noreferrer"`, `href`, and wa.me digits).
4. socialLinks (no scheme) → social background `rgba(255,255,255,0.5)` (light) — light branch intact.

### Why it closes R5
R5's "Dark scheme" scenario required a test that exercises the card's `isDark=true` branch in **both** `VerificationBadge` and `SocialLinksRow` with the safe-link contract intact. Tests 1 & 3 do exactly that (asserting `colorDark` `#4ade80` badge + dark social background), while tests 2 & 4 confirm the light branch is unchanged — no regression. The contract (R4: optional props, R3: safe links) is preserved.

### Execution evidence (re-validated)
- Targeted suite: `pnpm vitest run tests/unit/businessPreviewCard.test.tsx tests/unit/storefrontAboutSection.test.tsx` → **25 passed (25)** (card 12 + section 13).
- `pnpm exec tsc --noEmit` → **exit 0**.
- Full suite: `pnpm vitest run` → **997 passed / 1002**, 5 fails all in `settingsActions.test.ts` (pre-existing plan-enforcement, unrelated). No regression.

### Remaining findings after R5 closure
- **WARNING**: `Changed-file coverage not isolated` (project-wide 1.48%, pre-existing config) — informational, not blocking.
- **SUGGESTION** (non-blocking): `StorefrontAboutSection.tsx:132` lint complexity 23 > 20.
- **SUGGESTION** (non-blocking): apply-progress GREEN counts "9/9, 12/12" vs actual 8/13 (same 21).
- **CRITICAL**: none.

**R5 status: ✅ CLOSED / PASS. No open CRITICAL or WARNING remains from this change (only informational coverage + non-blocking suggestions).**
