# Tasks: Business Public Info (UI-only Nosotros + BusinessPreviewCard)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~310 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Card contract + Nosotros section + tests | PR 1 (base: main) | ~310 lines, self-contained, both test files included |

## Phase 1: Card contract (strict TDD RED→GREEN→REFACTOR)

- [ ] 1.1 RED — Create `tests/unit/businessPreviewCard.test.tsx`: mock `@/core/storefront` (light scheme, fake config, '#000' text, {} theme) and `@/shared/components/ui` (md-icon stub like NavItem.test.tsx). Assert: without new props rendering unchanged; `verificationStatus` → badge label per status; `socialLinks` → anchors with `target=_blank`, `rel="noopener noreferrer"`, aria-label; `whatsappNumber` → `https://wa.me/<digits>`. Run `pnpm vitest run tests/unit/businessPreviewCard.test.tsx` → fail (RED).
- [ ] 1.2 GREEN — In `src/shared/components/business/BusinessPreviewCard.tsx`: add optional props `socialLinks?`, `whatsappNumber?`, `legalRepPhone?`, `verificationStatus?`, `coverImageUrl?` (contract-only, NOT rendered — D1), `storeType?`; internal `VerificationBadge` (D3 mapping verified/pending/unverified/rejected + null → "Sin verificar"; inline SVG, isDark palette) rendered only when `verificationStatus !== undefined`; exported `SocialLinksRow` (inline SVG glyphs, aria-labels) when any key present; keep decorative `VerifiedIcon` when prop absent (R4).
- [ ] 1.3 REFACTOR — Dedupe badge/icon/color helpers; rerun file test + `pnpm lint` + `pnpm type-check` green.

## Phase 2: Nosotros section (strict TDD RED→GREEN→REFACTOR)

- [ ] 2.1 RED — Create `tests/unit/storefrontAboutSection.test.tsx`: full fixture → description, personType+storeType, mailto email, wa.me phone, per-status badge, social row; sparse fixture → no empty rows; exact hrefs; per-status label/style. Run → fail.
- [ ] 2.2 GREEN — In `app/[slug]/(app)/BusinessPageContent.tsx`: enrich left `infoCard` (D4 order description → personType+storeType → email mailto → wa.me digits `phone.replace(/\D/g,'')` → VerificationBadge → SocialLinksRow imported from card); pass new props to `<BusinessPreviewCard>`; export pure helpers `getPersonTypeLabel` / `getVerificationConfig`.
- [ ] 2.3 GREEN — Create `app/[slug]/(app)/storefrontAbout.module.css` (+~80): `.verificationBadge` + per-status colors + `.detailRow` + `.contactLink` copied from `AboutSection.module.css` (dark-safe `var(--md-sys-*)`).
- [ ] 2.4 REFACTOR — Both suites green; run `pnpm vitest run`, `pnpm lint`, `pnpm type-check`.

## Phase 3: Verification

- [ ] 3.1 Full suite `pnpm vitest run` passes; grep `BusinessPreviewCard` callers (settings/create-business) unchanged.
- [ ] 3.2 Manual smoke: NOSOTROS on `[slug]` page (light+dark, sparse+full business); card download path intact.

## Phase 4: Suggested commits (work-unit, NOT executed)

- [ ] 4.1 `test(business): add BusinessPreviewCard props + section derivation tests`
- [ ] 4.2 `feat(business): real verification badge and social links in card`

### Precedence

Phase 1 before Phase 2 (section imports `SocialLinksRow` from card); within phases, RED before GREEN before REFACTOR; 2.3 lands with 2.2.