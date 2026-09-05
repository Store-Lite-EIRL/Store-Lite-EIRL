# Tasks: Culqi Readiness Check

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 310–385 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full feature: server action + client component + PaymentsConfig wiring + tests | PR 1 | All changes fit comfortably under 400 lines |

## Phase 1: Foundation (Types & Interfaces)

- [x] 1.1 Define `CheckResult` and `ReadinessResult` interfaces in `src/features/settings/actions/culqiReadiness.ts`
  - `CheckResult`: `{ id: string; label: string; passed: boolean; message: string }`
  - `ReadinessResult`: `{ ready: boolean; passedCount: number; checks: CheckResult[] }`
  - Lines: ~15

## Phase 2: Core Implementation (Server Action — TDD)

### 2A — RED (write failing tests)

- [x] 2.1 Create `tests/unit/culqiReadiness.test.tsx` with mock setup for `@/core/database/client` (`db.query.products.findMany`, `db.query.productMedia.findMany`, `db.query.businesses.findFirst`, `db.query.businessSettings.findFirst`)
  - Lines: ~40

- [x] 2.2 Write test: "all 9 checks pass when business has 5+ available products with images, descriptions, prices, terms, returns, complaints enabled, email, address, and social links" → expect `ready=true, passedCount=9`
  - Lines: ~25

- [x] 2.3 Write test: "product_count fails with count=0 when business has no products" → expect `passed=false`, message includes "0"
  - Lines: ~15

- [x] 2.4 Write tests for individual product checks: "product_images fails when a product has no media", "product_descriptions fails when description is null", "product_prices fails when price is 0"
  - Lines: ~30

- [x] 2.5 Write tests for legal/contact checks: "terms fails when preferences.terms is missing", "returns fails when preferences.returns is empty string", "complaints_book fails when complaintsEnabled is false", "contact_info fails when email is null", "social_media fails when social_links is empty object"
  - Lines: ~30

- [x] 2.6 Write test: "business not found returns all checks failing with ready=false"
  - Lines: ~10

- [x] 2.7 Run `npx vitest run tests/unit/culqiReadiness.test.tsx` — confirm all tests FAIL (RED phase)
  - Command: `npx vitest run tests/unit/culqiReadiness.test.tsx`

### 2B — GREEN (make tests pass)

- [x] 2.8 Implement `checkCulqiReadiness(businessId: string)` server action: query business, business_settings, products, product_media in parallel with `Promise.all`; evaluate each of the 9 checks independently; return `ReadinessResult`
  - File: `src/features/settings/actions/culqiReadiness.ts`
  - Lines: ~90

- [x] 2.9 Run `npx vitest run tests/unit/culqiReadiness.test.tsx` — confirm all tests PASS (GREEN phase)
  - Command: `npx vitest run tests/unit/culqiReadiness.test.tsx`

### 2C — REFACTOR

- [x] 2.10 Extract check evaluation logic into pure helper functions (`evaluateProductChecks`, `evaluateLegalChecks`, `evaluateContactChecks`) if code exceeds 60 lines in a single block
  - Lines: ~20 (reorganize only)

## Phase 3: UI Component (Client Component — TDD)

### 3A — RED

- [x] 3.1 Add component render tests in `tests/unit/culqiReadiness.test.tsx`: mock `checkCulqiReadiness` to return loading → skeleton shown; return results → progress bar shows "X de 9", check list renders 9 items with icons; return `ready=false` → button disabled
  - Lines: ~40

- [x] 3.2 Run `npx vitest run tests/unit/culqiReadiness.test.tsx` — confirm component tests FAIL
  - Command: `npx vitest run tests/unit/culqiReadiness.test.tsx`

### 3B — GREEN

- [x] 3.3 Create `app/[slug]/(app)/settings/components/CulqiReadinessCheck.tsx` as `'use client'` component
  - Props: `{ businessId: string }`
  - State: `loading`, `result: ReadinessResult | null`, `error: string | null`
  - Lines: ~90

- [x] 3.4 Implement loading state (Skeleton), results state (progress bar + check list with icons), error state (retry button)
  - Lines: included in 3.3

- [x] 3.5 Implement "Solicitar aprobación Culqi" button — enabled only when `result.ready === true`, disabled with missing count when `false`
  - Lines: included in 3.3

- [x] 3.6 Run `npx vitest run tests/unit/culqiReadiness.test.tsx` — confirm all tests PASS
  - Command: `npx vitest run tests/unit/culqiReadiness.test.tsx`

## Phase 4: Integration (PaymentsConfig Wiring)

- [x] 4.1 In `app/[slug]/(app)/settings/components/PaymentsConfig.tsx`: import `CulqiReadinessCheck`, replace static checklist (lines 216–290) with `<CulqiReadinessCheck businessId={business.id} />`
  - Lines: ~10 (replace ~75 lines)

- [x] 4.2 Verify `router.refresh()` is already called after credential save (line 56) — this triggers `CulqiReadinessCheck` to re-fetch
  - Lines: 0 (verification only)

- [x] 4.3 Run full test suite: `npx vitest run` — confirm no regressions
  - Command: `npx vitest run`

## Phase 5: Final Verification

- [x] 5.1 Run TypeScript check: `npx tsc --noEmit` — confirm no type errors
  - Command: `npx tsc --noEmit`

- [x] 5.2 Run `npx vitest run tests/unit/culqiReadiness.test.tsx` — final GREEN confirmation
  - Command: `npx vitest run tests/unit/culqiReadiness.test.tsx`

## Dependency Graph

```
1.1 (types)
 └─► 2.1–2.6 (RED: write tests)
      └─► 2.7 (RED: verify fails)
           └─► 2.8 (GREEN: implement action)
                └─► 2.9 (GREEN: verify passes)
                     └─► 2.10 (REFACTOR)
                          └─► 3.1–3.2 (RED: component tests)
                               └─► 3.3–3.5 (GREEN: implement component)
                                    └─► 3.6 (GREEN: verify component tests)
                                         └─► 4.1–4.2 (wire into PaymentsConfig)
                                              └─► 4.3 (full suite)
                                                   └─► 5.1–5.2 (final verification)
```
