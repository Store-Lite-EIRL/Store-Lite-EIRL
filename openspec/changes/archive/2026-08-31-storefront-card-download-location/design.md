# Design: storefront-card-download-location

## Technical Approach

Smallest-diff, UI-only change (spec R7, R8). Reuse the hardened `BusinessPreviewCard.handleDownload` capture by flipping `showDownloadButton` from a hard-coded `false` to a strict `isOwner` boolean threaded from the page. Add a pure `buildGoogleMapsUrl(business)` helper (co-located with the existing `getPersonTypeLabel`/`getVerificationConfig` pure-helper pattern) and render a "Cómo llegar?" anchor gated strictly on it returning a non-empty string. No schema, migration, server action, or new DB field.

## Architecture / Component Structure

### Props

`StorefrontAboutSectionProps` (StorefrontAboutSection.tsx:124-129) — add one required boolean:

| Prop | Type | Notes |
|------|------|-------|
| `business` | `Business` | unchanged |
| `storefrontTheme` | `StorefrontTheme \| null \| undefined` | unchanged |
| `previewCardTheme` | `StorefrontTheme \| null \| undefined` | unchanged |
| `storefrontColorScheme?` | `StorefrontColorScheme` | unchanged |
| `isOwner` | `boolean` | **NEW** — strict owner boolean |

`BusinessPreviewCard` (`showDownloadButton`, default `true`) already gates correctly; no change needed there besides `aria-label` (Decision D2).

### Threading path (Decision D1)

```
BusinessPageContent (isOwner, page-level strict)         app/[slug]/(app)/(home)/page.tsx:194
   └─ BusinessPageContentUI (_isOwner)                   BusinessPageContent.tsx:172 (renamed, unused)
        └─ StorefrontProductGridSection (isOwner={isOwner})   :409  ← change from isStaff
             └─ StorefrontAboutSection (isOwner={isOwner})    :926  ← add prop
```

`BusinessPageContentUI` receives `isOwner` but renames it `_isOwner` (ignored). Currently `StorefrontProductGridSection` gets `isOwner={isStaff}` (line 409) — truthy for owner AND all permissioned staff. **Change line 409** to `isOwner={isOwner}` (feed the strict boolean down). The grid still passes semantic `isOwner` to its children (`Feed`, `StorefrontNoticeBar`, etc.), now correctly strict. Then **line 926** add `isOwner={isOwner}` to `<StorefrontAboutSection>`.

## Data Flow

```
business row (address,city,departamento,provincia,distrito,country)
   └─ buildGoogleMapsUrl(business) → string ('' if no parts)
        └─ truthy ? render <a target=_blank rel=noopener noreferrer> : render nothing

page isOwner → BusinessPageContentUI → StorefrontProductGridSection → StorefrontAboutSection
   └─ <BusinessPreviewCard showDownloadButton={isOwner} />
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/[slug]/(app)/StorefrontAboutSection.tsx` | Modify | Add `isOwner: boolean` prop; add `buildGoogleMapsUrl` pure helper (nested row helper `MapLinkRow`); change `showDownloadButton={false}`→`{isOwner}`; render "Cómo llegar?" anchor in the direction row; add `aria-label` to download button revealed via a new optional `downloadButtonLabel` prop on the card |
| `app/[slug]/(app)/BusinessPageContent.tsx` | Modify | Line 409 `isOwner={isStaff}`→`isOwner={isOwner}`; line 926 add `isOwner={isOwner}` |
| `src/shared/components/business/BusinessPreviewCard.tsx` | Modify | Add optional `downloadButtonLabel?: string` prop (default `"Descargar tarjeta"`), applied as `aria-label` on the download `<Button>` (line 759) — non-breaking |
| `tests/unit/storefrontAboutSection.test.tsx` | Modify | Add owner-gated button tests, Maps link tests, `buildGoogleMapsUrl` tests; keep sparse zero-link assert |

## Interfaces / Contracts

```ts
// StorefrontAboutSection.tsx (co-located pure helper, exported for tests)
export function buildGoogleMapsUrl(business: Business): string {
  const parts = [
    business.address, business.city, business.departamento,
    business.provincia, business.distrito, business.country,
  ]
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map((p) => p.trim());
  if (parts.length === 0) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
}
```

`Business.address/country/city/departamento/provincia/distrito` are all `string | null` (`typeof businesses.$inferSelect`), so the helper must filter null/empty.

## Testing Strategy (strict TDD)

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (pure) | `buildGoogleMapsUrl` | No jsdom needed: full parts → encoded URL; partial (city+provincia) → encoded subset; zero parts → `''`. Add to `storefrontAboutSection.test.tsx` alongside existing pure-helper tests |
| Unit (jsdom) | Owner sees download button | render `StorefrontAboutSection isOwner` → assert `<button>` with `aria-label="Descargar tarjeta"` present |
| Unit | Non-owner staff/customer | `isOwner=false` → absent (covers staff & anonymous) |
| Unit | Maps anchor present | `fullBusiness` (has address/city/country) → anchor href = encoded `https://www.google.com/maps/search/?api=1&query=Av.%20Lima%20123%2C%20Lima%2C%20Per%C3%BA`, `target=_blank`, `rel=noopener noreferrer`, `aria-label="Cómo llegar"` |
| Unit | Sparse → zero links | existing `queryAllByRole('link')).toHaveLength(0)` still holds (no address → no Maps link) |

Existing `renderSection` helper must pass `isOwner` (default `false`). Tests mock nothing for the section (it renders the real card already).

## Migration / Rollout

No migration. `downloadButtonLabel` is optional with default → existing `BusinessPreview.tsx`/`AboutSection.tsx` callers unaffected.

## Open Questions

- None.

# Decisions & Estimation

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| D1 Threading | (a) reuse grid's `isOwner={isStaff}` | leaks button to permissioned non-owners — violates R7 | **Feed strict `isOwner`** (line 409→`isOwner={isOwner}`, line 926 add `isOwner`) |
| D2 `aria-label` | (a) hard-code on card button | can't vary per caller; one caller today | **Optional `downloadButtonLabel` prop** (default `"Descargar tarjeta"`), non-breaking |
| D3 Helper location | (a) co-located exported pure fn in `StorefrontAboutSection.tsx` | follows existing `getPersonTypeLabel` pattern; unit-tests without jsdom | **Co-located & exported** |
| D4 Link placement | (a) inside `DireccionRow` (address row) | wrong — row is `null` when no address, but Maps link should render when any location part exists | **Separate `MapLinkRow`** rendered in `detailsGrid` after `DireccionRow`, gated on helper truthy |
| D5 Helper contract | (a) return `''` when 0 parts | keeps sparse fixture at zero links; falsy check = no render | **Return `''`**; render `{url && <a…/>}` |
| D6 Link attrs | role/text | descriptive aria + safe external | `"Cómo llegar"`, `target=_blank`, `rel="noopener noreferrer"` |

## Estimation (budget 400)

| File | Est. Δ | Notes |
|------|--------|-------|
| `StorefrontAboutSection.tsx` | +30/−2 | helper + MapLinkRow + prop + showDownloadButton |
| `BusinessPageContent.tsx` | +2/−0 | two prop-passing edits |
| `BusinessPreviewCard.tsx` | +4/−0 | optional label prop + aria-label |
| `storefrontAboutSection.test.tsx` | +55/−0 | new describes/tests |

**Total ≈ 91 changed lines.** Risk: **Low** — well under the 400-line budget.
