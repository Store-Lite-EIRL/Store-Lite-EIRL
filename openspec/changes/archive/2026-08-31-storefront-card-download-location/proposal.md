# Proposal: storefront-card-download-location

## Intent

The public storefront's NOSOTROS section currently hard-codes `showDownloadButton={false}` on the embedded `BusinessPreviewCard`, preventing owners from downloading their card PNG from the public page. Additionally, there is no "How to get there?" link to Google Maps — the existing `LocationMap` is an iframe embed, not a deep-link text anchor. Both features are UI-only, using data already present on the `business` row.

## Scope

### In Scope

1. **Download PNG button (owner-only)** — Thread `isOwner` (strict, NOT `isStaff`) from `BusinessPageContent` → `StorefrontProductGridSection` → `StorefrontAboutSection`. Change `showDownloadButton={false}` to `showDownloadButton={isOwner}`. Add `aria-label` to the download button if absent. Full capture logic reused from `BusinessPreviewCard.handleDownload`.
2. **"Cómo llegar?" Google Maps deep link** — Pure helper `buildGoogleMapsUrl(business)` producing `https://www.google.com/maps/search/?api=1&query=<encoded>`. Render an anchor only when at least one location part exists (`address`, `city`, `departamento`, `provincia`, `distrito`, `country`). `target="_blank"` `rel="noopener noreferrer"`.

### Out of Scope

- `LocationMap.tsx` — iframe embed, not the deep-link requested.
- Schema changes, migrations, server actions, new DB fields.
- Reactivating orphaned `AboutSection.tsx`.
- Download card extraction into a separate component (over-engineering).

## Capabilities

### New Capabilities

None. Both features augment the existing `storefront-public-info` capability at the spec level.

### Modified Capabilities

- `storefront-public-info`: Add R7 (download button gated on strict `isOwner`) and R8 ("Cómo llegar?" Google Maps deep link). These are requirement-level additions to the existing spec.

## Approach

**Option A (recommended):** Smallest diff, full reuse of hardened capture logic.

1. Add `isOwner?: boolean` to `StorefrontAboutSectionProps` (currently absent).
2. In `BusinessPageContent.tsx` line ~926, pass `isOwner={isOwner}` to `<StorefrontAboutSection>`.
3. In `StorefrontAboutSection`, change `showDownloadButton={false}` → `showDownloadButton={isOwner}`.
4. Add `buildGoogleMapsUrl` pure helper (co-located in `StorefrontAboutSection.tsx`, following existing `getPersonTypeLabel`/`getVerificationConfig` pattern).
5. Render "Cómo llegar?" anchor below address row when `buildGoogleMapsUrl` returns a non-empty string.
6. Unit tests: update `storefrontAboutSection.test.tsx` (owner button appears/absent, maps link present/absent, sparse fixture still yields 0 links). Add `buildGoogleMapsUrl` unit test.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/[slug]/(app)/StorefrontAboutSection.tsx` | Modified | Add `isOwner` prop, pass to `showDownloadButton`, add Maps link + helper |
| `app/[slug]/(app)/BusinessPageContent.tsx` | Modified | Pass `isOwner` to `<StorefrontAboutSection>` at line ~926 |
| `tests/unit/storefrontAboutSection.test.tsx` | Modified | Assert download button owner-gated, Maps link, sparse fixture unchanged |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Owner-vs-staff confusion: `StorefrontProductGridSection` line 409 passes `isOwner={isStaff}` (truthy for all members). Must NOT use that value. | Medium | Use the page-level `isOwner` (strict boolean from `getMemberPermissions`), bypass the renamed `_isOwner` in `BusinessPageContentUI`. |
| Sparse fixture regression: adding always-rendered Maps link would break `sparseBusiness` assert `toHaveLength(0)`. | Low | Gate Maps link strictly on `buildGoogleMapsUrl` returning non-empty string; sparse fixture has no address → 0 links preserved. |
| Download button `aria-label`: current `<Button>` children include Material icon only, no accessible label. | Low | Add `aria-label="Descargar tarjeta"` to the download button. |
| html-to-image in storefront: client-side capture with custom theme vars. | Low | Already hardened in `BusinessPreviewCard`; dark mode uses `colorScheme` tokens. Verify visually in dark mode. |

## Rollback Plan

Revert the two changed files (`StorefrontAboutSection.tsx`, `BusinessPageContent.tsx`) and the test file. No database or server-side state affected — pure UI.

## Dependencies

None. All data (`isOwner`, address fields) already available on the page.

## Success Criteria

- [ ] Owner sees download button on NOSOTROS card; non-owner staff and anonymous visitors do not.
- [ ] "Cómo llegar?" link renders with correct encoded Google Maps URL when address fields exist.
- [ ] Sparse business fixture still renders zero links.
- [ ] Download button has descriptive `aria-label`.
- [ ] All existing tests pass; new assertions green.
