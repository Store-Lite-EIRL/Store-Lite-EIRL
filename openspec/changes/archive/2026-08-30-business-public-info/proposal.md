# Proposal: Business Public Info (UI-only "Nosotros" + BusinessPreviewCard enrichment)

## Intent

The storefront NOSOTROS tab shows a sparse left column (address + WhatsApp) and a decorative always-green "verified" badge on the BusinessPreviewCard. Public visitors can't see real social links, verification state, email, phone, storeType/personType — all already on the full `business` row (`resolveBusinessSlug` has no column restriction). Surface this existing public data at the UI layer only.

## Scope

### In Scope
- Enrich left infoCard: real verification badge (from `verificationStatus`), personType/storeType, email (mailto), phone (wa.me), social links (target=_blank rel=noopener, aria-label).
- `BusinessPreviewCard`: OPTIONAL props (`socialLinks?`, `whatsappNumber?`, `legalRepPhone?`, `verificationStatus?`, `coverImageUrl?`, `storeType?`) + reusable inline-SVG social row + real verification badge.
- Copy (not wire) patterns from orphaned `AboutSection.module.css` (badge, contactLink, detailRow).
- Add unit tests (mock `@/core/storefront` + `md-icon`).

### Out of Scope
- No schema/migration/server-action/query changes (business already full).
- Do NOT touch product grid / search (`StorefrontProductGridSection`).
- Do NOT reactivate orphaned `AboutSection.tsx` (dead code stays dead; copy CSS only).
- Do NOT change the other 2 card callers (settings, create-business `BusinessPreview.tsx`) — optional props only.

## Capabilities

### New Capabilities
- `storefront-public-info`: presentational display of a business's public profile (description, real verification state, person/company type, sector, mailto/wa.me/social links with target=_blank rel=noopener) on the storefront NOSOTROS view + truthful verification and social rows inside the downloadable `BusinessPreviewCard`.

### Modified Capabilities
- None (no existing spec-level behavior change; card contract grows by optional props only).

## Approach

Variante A+C-lite (per exploration):
1. Add optional props + reusable inline-SVG `SocialLinksRow` + real `VerificationBadge` to the card; replace decorative always-green `VerifiedIcon` with status-driven rendering.
2. Enrich `StorefrontAboutSection` left column reusing copied `AboutSection.module.css` classes, passing real `business.*` + new card props.
3. Keep html-to-image safe (inline SVG, no Material ligatures); badge/social rows use isDark + `var(--md-sys-...)`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/shared/components/business/BusinessPreviewCard.tsx` | Modified | Optional props + SocialLinksRow + VerificationBadge |
| `app/[slug]/(app)/BusinessPageContent.tsx` | Modified | `StorefrontAboutSection` left column enriched |
| `app/[slug]/(app)/AboutSection.module.css` | Read-only | Design source; classes copied |
| `tests/unit/...card.test.tsx` + about test | New | Render new props; mock `@/core/storefront` + `md-icon` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking other 2 card callers | Low | Optional props only |
| html-to-image captures Material ligatures wrong | Med | Inline SVG only in card |
| Dark-mode contrast on new rows/badges | Med | isDark + `var(--md-sys-...)` tokens |
| Decorative badge risk | Low | Render only from real `verificationStatus` |

## Rollback Plan

`git revert` of the change commit (or `git checkout --` the two component files + delete added tests). No data/DB changes → non-destructive, instant.

## Dependencies

- None external; uses only `business` fields already present (`socialLinks`, `whatsappNumber`, `legalRepPhone`, `verificationStatus`, `storeType`, `personType`, `email`).

## Success Criteria

- [ ] NOSOTROS shows real badge, personType/storeType, email (mailto), phone (wa.me), social links when present.
- [ ] Card renders truthful badge + social row; settings/create callers unchanged.
- [ ] Cards still capture correctly via html-to-image (no Material ligatures).
- [ ] `pnpm test:unit` / `lint` / `type-check` pass; new tests cover new props.
