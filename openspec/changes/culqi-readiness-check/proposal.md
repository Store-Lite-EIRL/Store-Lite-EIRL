# Proposal: Culqi Readiness Check

## Intent

Sellers purchase a Culqi payment gateway plan but get rejected because their store doesn’t meet Culqi’s production requirements. The existing `PaymentsConfig.tsx` has a static HTML checklist (visual only, no validation). This change replaces the static checklist with an automated readiness check that validates all 9 Culqi requirements server‑side, shows real‑time status indicators (✅/⚠️/❌), a progress bar, and only enables the “Send to Culqi” button when all checks pass.

## Scope

### In Scope
- Server‑side validation of 9 Culqi requirements against business data
- API endpoint (or server action) that returns validation results per business
- UI component in PaymentsSettings that fetches validation results, renders status indicators, progress bar, and conditionally enables the “Send to Culqi” button
- Validation logic for: product count, product images, descriptions, prices; legal pages (terms, returns, complaints); contact info (email, address); social media links

### Out of Scope
- Test user/password provision for Culqi reviewer
- Contact info display on storefront “NOSOTROS” section
- Changes to Culqi integration logic or checkout flow

## Capabilities

### New Capabilities
- `culqi-readiness-check`: Automated validation of Culqi production requirements, server‑side validation function, API endpoint, and UI readiness indicator in Payments settings.

### Modified Capabilities
- None (no existing spec covers seller‑store settings validation)

## Approach

1. Create a `culqiReadinessValidation` server function that queries the business record and evaluates each requirement.
2. Expose the function via a server action (or API route) called by the PaymentsConfig component on mount and after relevant changes.
3. Extend the existing PaymentsConfig UI to replace the static HTML checklist with a dynamic component that displays the validation results, progress bar, and a disabled/enabled “Send to Culqi” button.
4. Store validation results in a lightweight cache (e.g., React state) to avoid re‑querying on every render; revalidate on business data mutations.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/billing/PaymentsConfig.tsx` | Modified | Replace static checklist with dynamic readiness component |
| `src/features/billing/actions.ts` (or new file) | New | Server‑side validation function and server action |
| `src/core/database/schema/businesses.ts` | Modified | Add TypeScript types for preferences fields used in validation (if not already typed) |
| `src/features/billing/PaymentSettings.tsx` (or similar) | Modified | Import and render the new readiness component |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Validation queries may impact performance | Low | Use efficient SQL queries; cache results in component state; revalidate only on data changes |
| Preferences schema may be missing fields | Medium | Add explicit TypeScript types for `terms`, `returns`, `complaintsEnabled`, `socialLinks`; fallback to null/undefined checks |
| UI may become cluttered with many indicators | Low | Use collapsible sections or a compact progress bar with tooltip details |

## Rollback Plan

- Revert changes to `PaymentsConfig.tsx` (restore static HTML checklist).
- Remove the new validation server action/function.
- Delete any new TypeScript types added for preferences fields.
- No database migration required; rollback is purely code revert.

## Dependencies

- None (all required data already exists in `businesses.preferences` and `products` tables).

## Success Criteria

- [ ] Validation function correctly evaluates all 9 requirements against existing business data.
- [ ] UI shows real‑time status indicators (✅/⚠️/❌) for each requirement.
- [ ] Progress bar displays “X de 9 requisitos cumplidos” and updates automatically.
- [ ] “Send to Culqi” button is disabled until all checks pass.
- [ ] Validation runs without noticeable performance degradation.
- [ ] No regressions in existing PaymentsConfig functionality.