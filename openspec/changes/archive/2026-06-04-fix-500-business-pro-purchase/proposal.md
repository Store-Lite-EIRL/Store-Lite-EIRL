# Proposal: Fix 500 Error on Any Paid Plan Purchase

## Intent

A Drizzle schema drift caused migration 0010 to drop the DB DEFAULT on `plan_payments.ticket_correlative`. The API route still passes `undefined` expecting the default to fill, but the column is `NOT NULL` with no default → PostgreSQL throws NOT NULL violation → 500 error on every paid plan purchase (emprendedor, business_pro, enterprise_ai).

## Scope

### In Scope

- Restore `.default(sql\`nextval('seq_plan_payment_b001')\`)`in Drizzle schema for`ticket_correlative`
- Generate and commit a new Drizzle migration to re-add the DEFAULT in the database
- Clean up `ticketCorrelative: undefined as any` in the API route
- Add unit/integration tests for the purchase flow (strict TDD: RED-GREEN-REFACTOR)

### Out of Scope

- Pricing display mismatch (S/55 UI vs S/99 backend) — separate bug, tracked separately
- Correlative generation strategy change (UUID, timestamp-based) — unnecessary, sequence works
- SUNAT invoice compliance review — not in scope for this fix

## Capabilities

### New Capabilities

None — this is a bug fix with no new spec-level capabilities.

### Modified Capabilities

None — no existing capability's behavioral requirements are changing; the fix restores the intended behavior.

## Approach

1. Uncomment the `.default(sql\`nextval('seq_plan_payment_b001')\`)`in`src/core/database/schema.ts`for`ticket_correlative`
2. Run `pnpm db:generate` (Drizzle Kit) to produce migration 0011 restoring the DEFAULT
3. Remove `ticketCorrelative: undefined as any` from `app/api/billing/purchase-plan/route.ts` — the field is omitted from `.values()` entirely, letting the DB default fill it
4. Write tests for the purchase flow (TDD: RED first, then fix + GREEN, then REFACTOR)
5. Verify locally with `pnpm test:unit && pnpm type-check && pnpm build`

## Affected Areas

| Area                                            | Impact   | Description                                         |
| ----------------------------------------------- | -------- | --------------------------------------------------- |
| `src/core/database/schema.ts` (L815-818)        | Modified | Uncomment `.default(...)` for `ticket_correlative`  |
| `drizzle/migrations/`                           | New      | Auto-generated migration 0011 re-adding the DEFAULT |
| `app/api/billing/purchase-plan/route.ts` (L216) | Modified | Remove `ticketCorrelative: undefined as any`        |
| `src/**/*.test.ts` (new)                        | New      | Tests for purchase flow                             |

## Risks

| Risk                                                     | Likelihood | Mitigation                                                                                |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Sequence value advanced while DEFAULT was absent         | Low        | Sequence still exists; new values continue from current position — no duplicates possible |
| Drizzle detects schema drift again on next introspection | Low        | Schema + DB are now in sync after migration; drift won't re-occur                         |
| Tests may reveal additional issues in the purchase flow  | Medium     | Fix those issues as part of the same change; scope is still narrow                        |

## Rollback Plan

Revert the schema change on `ticket_correlative`, revert the migration file, and run a new migration to drop the DEFAULT again. The sequence remains untouched either way.

## Dependencies

None.

## Success Criteria

- [ ] `pnpm test:unit` passes (including new tests for purchase flow)
- [ ] `pnpm type-check` passes with no errors
- [ ] `pnpm build` succeeds
- [ ] Migration 0011 applies cleanly — no drift warnings from Drizzle
- [ ] INSERT into `plan_payments` without explicitly providing `ticket_correlative` succeeds and auto-generates the correlative from the sequence
