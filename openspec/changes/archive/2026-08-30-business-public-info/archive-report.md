# Archive Report: business-public-info

**Archived**: 2026-08-30
**Branch**: feat/business-public-info
**Commits**: 402723d (`feat(business): add public profile props to BusinessPreviewCard`), 39fd190 (`feat(storefront): enrich public Nosotros section with business info`)
**Verdict**: PASS (6/6 requirements, 12/12 spec scenarios, 21 targeted tests)
**Type**: UI-only presentational change (storefront NOSOTROS + BusinessPreviewCard)

## Summary

The NOSOTROS view and downloadable `BusinessPreviewCard` now surface data already present on the full `business` row: real verification status badge, person/company type, email (`mailto:`), phone (`wa.me`), and social links (`target="_blank"` + `rel="noopener noreferrer"` + `aria-label`). All new card props are optional — settings/create-business callers render exactly as before.

Key implementation details:

- `BusinessPreviewCard`: optional props `socialLinks?`, `whatsappNumber?`, `legalRepPhone?`, `verificationStatus?`, `coverImageUrl?` (contract-only, NOT rendered — design D1), `storeType?`; internal `VerificationBadge` + exported `SocialLinksRow` (inline SVG, html-to-image safe).
- `StorefrontAboutSection` extracted to its own file (design deviation, justified by testability) with pure helpers `getPersonTypeLabel` / `getVerificationConfig`.
- `storefrontAbout.module.css` with dark-safe `var(--md-sys-*)` tokens copied from the orphaned `AboutSection.module.css` (CSS only — dead component stays dead).

## Results

| Metric | Value |
|--------|-------|
| Requirements | 6/6 compliant (R1–R6) |
| Spec scenarios | 12/12 covered |
| Targeted tests | 21 passed (8 card + 13 section) |
| Full suite | 993 passed / 998 (5 fails pre-existing in `settingsActions.test.ts`, unrelated) |
| Type-check | ✅ exit 0 |
| Lint | ✅ 0 errors (1 warning) |
| Tasks | 7/7 planned phases complete (1.1–3.2) |

## Spec Sync

| Domain | Action | Details |
|--------|--------|---------|
| `storefront-public-info` | Created | New capability — delta was a full spec; copied to `openspec/specs/storefront-public-info/spec.md` (R1–R6, 12 scenarios). |

No existing capabilities modified; no destructive merge. `openspec/project.md` does not exist in this repo, so no capability index update needed.

## Artifacts

| Artifact | File | Engram observation |
|----------|------|--------------------|
| Exploration | `exploration.md` (not created — explore inline) | #603 |
| Proposal | `proposal.md` | #604 |
| Spec (delta) | `specs/storefront-public-info/spec.md` | #605 |
| Design | `design.md` | #606 |
| Tasks | `tasks.md` | #608 |
| Apply progress | (in Engram) | #609 |
| Verify Report | `verify-report.md` | #611 |
| Archive Report | `archive-report.md` (this file) | `sdd/business-public-info/archive-report` |

Engram project: `store-lite-eirl`, topic keys `sdd/business-public-info/*`.

## Verification Summary (from verify-report.md)

- WARNING (non-blocking): R5 "Dark scheme" scenario untested — no test passes `colorScheme='dark'`.
- WARNING (non-blocking): changed-file coverage not isolated (project-wide 1.48%, pre-existing config).
- SUGGESTION: `StorefrontAboutSection.tsx:132` complexity 23 > 20 max — watch in future edits.
- CRITICAL: none.

## Success Criteria Achieved

- ✅ NOSOTROS shows real badge, personType/storeType, email (mailto), phone (wa.me), social links when present.
- ✅ Card renders truthful badge + social row; settings/create callers unchanged.
- ✅ Cards capture correctly via html-to-image (inline SVG, no Material ligatures in captured area).
- ✅ `pnpm test:unit` / `lint` / `type-check` pass; new tests cover new props.

## SDD Cycle Complete

This change has been fully planned, implemented, verified, and archived.
Ready for the next change.