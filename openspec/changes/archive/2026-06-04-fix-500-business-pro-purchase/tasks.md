# Tasks: Fix 500 Error on Paid Plan Purchase

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | ~100–150    |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                            | Likely PR | Notes                                                                                                                                                 |
| ---- | ----------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Restore DB default + clean up route + add tests | Single PR | All changes are tightly coupled; splitting would leave the route broken without the migration or tests incomplete — single PR is the correct boundary |

## Phase 1: Schema & Migration

- [x] 1.1 Uncomment `.default(sql\`nextval('seq_plan_payment_b001')\`)`in`src/core/database/schema.ts`line 817 for`ticket_correlative`
- [x] 1.2 Run `pnpm db:generate` to produce migration 0015 (Drizzle tagged as `0015_crazy_sharon_ventura`) re-adding the DEFAULT
- [x] 1.3 Review generated migration — line 53 correctly adds `SET DEFAULT nextval('seq_plan_payment_b001')`. Other changes are accumulated schema drift from post-0014 modifications — expected Drizzle behavior

## Phase 2: Route Cleanup

- [x] 2.1 Remove `ticketCorrelative: undefined as any` from `app/api/billing/purchase-plan/route.ts` line 216 — field is now omitted from `.values()` entirely; DB default fills it

## Phase 3: Tests (Strict TDD — RED → GREEN → REFACTOR)

- [x] 3.1 [RED] Write failing unit test — test fails as expected (`ticketCorrelative` still present in values)
- [x] 3.2 [GREEN] Make test pass — route cleanup removes `ticketCorrelative` from values, all 6 tests pass
- [x] 3.3 [REFACTOR] Polish test — 6 tests covering happy path + 5 edge cases (invalid plan, free plan, missing issuer, missing fields, ticketNumber computation)
- [x] 3.4 Verify full pipeline — `pnpm test:unit` ✅ 98 tests pass (9 files). `pnpm type-check` has 31 pre-existing errors (none in changed files). `pnpm build` not attempted due to pre-existing type errors.
