# Design: Business Public Info (UI-only storefront Nosotros + BusinessPreviewCard)

## Technical Approach

Pure presentational UI-only change (spec R1-R6). No schema/migration/action/grid/dead-code edits; data already on the full `business` row. We (1) add **optional props** + real `VerificationBadge` + `SocialLinksRow` to `BusinessPreviewCard`, and (2) enrich `StorefrontAboutSection`'s left column reusing copied `AboutSection.module.css` classes — never reactivating orphaned `AboutSection.tsx`.

## Architecture Decisions

### D1: `coverImageUrl` handling — **Option (b): contract-only prop, no header render**

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| (a) Render in header w/ fallback to logo | Extra capture surface; remote-image CORS + dark-mode PNG risk | Rejected |
| (b) **Accept prop, do not render yet** | Zero visual risk; keeps R4 contract | **Chosen** |
| (c) Only in Nosotros | Diverges from card contract (R4 lists it as card prop) | Rejected |

**Rationale**: lowest risk to html-to-image capture and dark mode; satisfies R4. Render deferred to a future change.

### D2: Component structure — **inline subcomponents inside `BusinessPreviewCard.tsx`**

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| Separate `SocialLinksRow.tsx` + `VerificationBadge.tsx` | Reusable across card + Nosotros, but new files + cross-imports inflate diff & risk | Rejected |
| **Inline subcomponents in card file** | Reuses existing Preview* pattern (PreviewHeader, PreviewLegalRep); bounded diff; a `SocialLinksRow` ALSO exported from card for Nosotros reuse | **Chosen** |

**Rationale**: matches the file's internal-subcomponent style; `SocialLinksRow` is a tiny flex row — not worth over-engineering. Nosotros reuses it via import from the card module (single source for brand SVG glyphs).

### D3: VerificationBadge mapping (from `verificationStatus`)

Four states + fallback; internal config keyed off enum. Uses inline-SVG icons (html-to-image safe — no Material ligatures in the **card**). The Nosotros section uses `md-icon` (outside captured area).

| status | label | color token (dark-safe) | inline-SVG icon |
|--------|-------|-------------------------|-----------------|
| `verified` | Verificado | tertiary `var(--md-sys-color-tertiary)` bg 12% | badge-check |
| `pending` | En verificación | secondary `#eab308`→`#a16207` | hourglass |
| `unverified`/null/unknown | Sin verificar | on-surface-variant | info/outline |
| `rejected` | No verificado | error `var(--md-sys-color-error)` | cancel |

Styles copied from `AboutSection.module.css` (`.verificationBadge`, per-status, `.verificationText/Title/Subtitle`) — rendered as **spans using the card's `isDark` palette**, not the section CSS module.

### D4: Nosotros left column (`infoCard`) structure

Order + DetailRow pattern (icon + label + value, copied CSS): description → `personType` label + `storeType` → email (`mailto:`) → phone (`wa.me` digits, from `whatsappNumber` fallback `legalRepPhone`) → `VerificationBadge` → `SocialLinksRow` (from card, when any key present).

Links: `target="_blank"` + `rel="noopener noreferrer"` + descriptive `aria-label`; missing optional fields render no row.

## Data Flow

```
business row (full, already present)
   │
   ├─ StorefrontAboutSection ──► left infoCard rows (type/sector/email/wa.me/badge/social)
   │                              ▲ SocialLinksRow re-imported from card
   │
   └─ BusinessPreviewCard ──► optional props ──► VerificationBadge + SocialLinksRow
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/shared/components/business/BusinessPreviewCard.tsx` | Modify (+~70) | optional props in interface; internal `VerificationBadge` + exported `SocialLinksRow`; real status badge replaces decorative `VerifiedIcon` |
| `app/[slug]/(app)/BusinessPageContent.tsx` | Modify (+~40) | enrich `StorefrontAboutSection` left column; pass new card props |
| `app/[slug]/(app)/storefrontAbout.module.css` | Create (+~80) | copied badge/detailRow/contactLink classes (NOT from dead AboutSection wiring) |
| `tests/unit/businessPreviewCard.test.tsx` | Create | mock `@/core/storefront` + `md-icon`; render new props |
| `tests/unit/storefrontAboutSection.test.tsx` | Create | derivations: sparse/full business fixtures |

## Interfaces / Contracts

```ts
// BusinessPreviewCardProps additions (all optional)
{
  socialLinks?: Record<string, string>;   // {instagram,facebook,twitter,tiktok,youtube}
  whatsappNumber?: string | null;
  legalRepPhone?: string | null;
  verificationStatus?: 'verified'|'pending'|'unverified'|'rejected' | null;
  coverImageUrl?: string | null;          // accepted, not rendered (D1)
  storeType?: string | null;
}
// Exported from card module for Nosotros reuse
export function SocialLinksRow({ socialLinks, isDark }): JSX.Element
```

`wa.me` from digits: `https://wa.me/${phone.replace(/\D/g,'')}`.

## Testing Strategy (strict TDD — RED→GREEN→REFACTOR)

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (card) | new props render true badge + social row; no props → unchanged; links have `target=_blank rel=noopener noreferrer` + `aria-label` | mock `@/shared/components/ui` + `@/core/storefront` (returns `'light'` scheme, fake config, `'#000'` text, `{}` theme); `md-icon` stub like `NavItem.test.tsx` |
| Unit (section) | full fixture → all rows; sparse → no empty rows; exact wa.me/mailto hrefs; each status → matching label/style | jsdom; `getPersonTypeLabel`/`getVerificationConfig` copied as pure helpers and unit-tested |

Card icons are inline SVG (no material font). `html-to-image` is a dynamic import on download only (`showDownloadButton=false` → never invoked in tests).

## Migration / Rollout

None. `git revert` (or checkout the two components + delete tests) = instant, non-destructive.

## Open Questions

- [ ] None blocking. `coverImageUrl` render deferred by D1.

## Estimation (line budget 400)

| File | Δ lines |
|------|---------|
| BusinessPreviewCard.tsx | +~70 |
| BusinessPageContent.tsx | +~40 |
| storefrontAbout.module.css | +~80 |
| businessPreviewCard.test.tsx | +~130 |
| storefrontAboutSection.test.tsx | +~90 |
| **Total** | **~310** (under 400, no chained PR needed) |
