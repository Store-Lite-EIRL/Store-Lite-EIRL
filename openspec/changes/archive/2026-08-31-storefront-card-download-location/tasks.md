# Tasks: storefront-card-download-location

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~91 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Download button (R7) + Maps link (R8) | PR 1 | single PR; base = main |

## Phase 1: Threading isOwner (R7)

- [ ] 1.1 In `BusinessPageContent.tsx` (`BusinessPageContentUI`, line ~172) rename ignored `_isOwner` to `isOwner` so the strict boolean is usable downstream.
- [ ] 1.2 In `BusinessPageContent.tsx` line ~409 change `isOwner={isStaff}` → `isOwner={isOwner}` on `<StorefrontProductGridSection>`.
- [ ] 1.3 In `BusinessPageContent.tsx` line ~926 add `isOwner={isOwner}` to `<StorefrontAboutSection>`.
- [ ] 1.4 Add `isOwner: boolean` (required) to `StorefrontAboutSectionProps` in `StorefrontAboutSection.tsx`; thread into component.

## Phase 2: Download button gated on isOwner (R7)

- [ ] 2.1 In `StorefrontAboutSection.tsx` change `showDownloadButton={false}` → `showDownloadButton={isOwner}`.
- [ ] 2.2 In `BusinessPreviewCard.tsx` add optional `downloadButtonLabel?: string` (default `"Descargar tarjeta"`), apply as `aria-label` on download `<Button>` (~line 759) — non-breaking, callers untouched.

## Phase 3: Google Maps deep link (R8)

- [ ] 3.1 In `StorefrontAboutSection.tsx` co-locate + export pure `buildGoogleMapsUrl(business: Business): string` joining non-empty parts among address/city/departamento/provincia/distrito/country with `encodeURIComponent` into `https://www.google.com/maps/search/?api=1&query=<enc>`; return `''` if 0 parts.
- [ ] 3.2 Add `MapLinkRow` component rendered in `detailsGrid` AFTER `DireccionRow`; gated `{url && <a/>}` with text "Cómo llegar", `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Cómo llegar"`.

## Phase 4: Tests (strict TDD, `pnpm vitest run`)

- [ ] 4.1 RED — add `buildGoogleMapsUrl` unit tests: full parts → encoded URL; partial (city+provincia) → encoded subset; zero parts → `''`; confirm fail.
- [ ] 4.2 GREEN — implement `buildGoogleMapsUrl`; tests pass.
- [ ] 4.3 RED — jsdom tests in `storefrontAboutSection.test.tsx`: `isOwner=true` → `<button aria-label="Descargar tarjeta">` present; staff/anonymous (`isOwner=false`) → absent; confirm fail.
- [ ] 4.4 GREEN — thread prop + gate; owner tests pass.

## Phase 5: Integration assertions (R8) + regression

- [ ] 5.1 Update `renderSection` helper to accept/pass `isOwner` (default `false`).
- [ ] 5.2 Add jsdom test: `fullBusiness` (address/city/country) → Maps anchor href `https://www.google.com/maps/search/?api=1&query=Av.%20Lima%20123%2C%20Lima%2C%20Per%C3%BA`, `target=_blank`, `rel=noopener noreferrer`.
- [ ] 5.3 Confirm sparse fixture still renders 0 links (existing ~line 136 assert) — no regression.

## Phase 6: Cleanup

- [ ] 6.1 Run `pnpm vitest run` full suite; run `pnpm lint` / typecheck; fix any fallout.
- [ ] 6.2 Verify no other `StorefrontAboutSection` caller breaks (prop added is optional-safe at page wiring).

## Implementation Order

Phase 1 first (unblocks strict `isOwner`), then 2 (button) & 3 (Maps) in parallel as both depend only on Phase 1; Phase 4/5 tests written RED before each feature, GREEN after; Phase 6 final regression.

## Next Step

Ready for sdd-apply (single PR, no chaining, no decision gate).
