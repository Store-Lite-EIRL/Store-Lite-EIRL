## Exploration: Fix 500 Error on PLAN BUSINESS PRO Purchase

### Current State

The purchase flow for SaaS plans works as follows:

1. **UI**: `app/pricing/page.tsx` renders `PricingCard` components with display prices (Emprendedor S/30, Business Pro S/55, Enterprise AI S/90 — these are display-only prices, not matching actual charges)
2. **CulqiCheckout**: Shows Culqi payment modal with the display price + 18% IGV
3. **usePurchasePlan hook**: Sends POST to `/api/billing/purchase-plan` with plan data + Culqi token
4. **API Route `POST /api/billing/purchase-plan`**: Validates request → calculates amounts from `PLAN_PRICES` table (in céntimos) → charges Culqi via API → inserts into `plan_payments` → upserts `business_subscriptions` → returns success

Business Pro (`business_pro`) is properly defined across all layers:

- `PlanType` type union ✅
- `PLAN_ENTITLEMENTS` record ✅
- `subscriptionPlanEnum` ✅
- `PLAN_PRICES` record ✅
- `PricingCard` plan enum mapping ✅

### Affected Areas

1. **`app/api/billing/purchase-plan/route.ts`** (line 216) — **ROOT CAUSE LOCATION**
   - `ticketCorrelative: undefined as any` is passed as the value for a `NOT NULL` column with no database DEFAULT

2. **`migrations/0010_aromatic_boomer.sql`** (line 41) — **THE MIGRATION THAT BROKE IT**
   - `ALTER TABLE "plan_payments" ALTER COLUMN "ticket_correlative" DROP DEFAULT;`
   - This migration removes the `DEFAULT nextval('seq_plan_payment_b001')` that was originally defined in migration 0008

3. **`src/core/database/schema.ts`** (lines 815-818) — **DRIFT CAUSE**
   - The `.default(sql\`nextval('seq_plan_payment_b001')\`)` is COMMENTED OUT in the Drizzle schema
   - The cascade: commented out schema → Drizzle detected drift → generated migration 0010 to drop DB default → default gone → INSERT fails

4. **`src/core/database/schema.ts`** (line 818) — **THE EXPECTED DEFAULT**
   - `ticketCorrelative: integer('ticket_correlative').notNull()` — no DEFAULT at all

5. **`app/pricing/page.tsx`** (lines 59-109) — **SECONDARY ISSUE**
   - Display prices (S/30, S/55, S/90) don't match `PLAN_PRICES` in the backend (S/59, S/99, S/149)
   - Not the 500 error cause, but a significant pricing/display issue

6. **`app/pricing/components/PricingCard.tsx`** (line 831) — **SECONDARY ISSUE**
   - CulqiCheckout `amount` uses display price not actual backend price

### Root Cause Analysis

**Primary Root Cause: Dropped database DEFAULT on `ticket_correlative` column**

The chain of events:

1. **Migration 0008** (`0008_lyrical_wilson_fisk.sql`) created `plan_payments` with:

   ```sql
   "ticket_correlative" integer DEFAULT nextval('seq_plan_payment_b001') NOT NULL
   ```

   And created the sequence `seq_plan_payment_b001`.

2. **The Drizzle schema** (`src/core/database/schema.ts`) had the DEFAULT commented out:

   ```typescript
   // .default(sql`nextval('seq_plan_payment_b001')`),
   ticketCorrelative: integer('ticket_correlative').notNull(),
   ```

3. **Drizzle detected schema drift**: The database had a DEFAULT that the schema didn't declare. Drizzle-kit generated migration 0010 (`0010_aromatic_boomer.sql`) to sync the DB to the schema:

   ```sql
   ALTER TABLE "plan_payments" ALTER COLUMN "ticket_correlative" DROP DEFAULT;
   ```

4. **Migration 0010 was applied** (confirmed in `migrations/meta/_journal.json`, idx 10).

5. **After 0010, the column has NO DEFAULT**: `ticket_correlative` is `integer NOT NULL` with no default value.

6. **The API route** (`purchase-plan/route.ts`, line 216) passes:

   ```typescript
   ticketCorrelative: undefined as any,
   ```

   expecting the database to auto-generate the value. Drizzle ORM omits `undefined` values from the INSERT statement. Since the column has neither a DEFAULT nor a value in the INSERT, PostgreSQL throws:

   ```
   null value in column "ticket_correlative" violates not-null constraint
   ```

7. **The catch block** (line 266-275) catches this as a generic error and returns:
   ```json
   {
     "error": "Error interno del servidor",
     "details": "null value in column \"ticket_correlative\" violates not-null constraint"
   }
   ```
   Status 500.

The sequence `seq_plan_payment_b001` still exists in the database (0010 only dropped the DEFAULT, not the sequence), but it's orphaned — nothing references it.

**Why SPECIFICALLY Business Pro?** This error affects ALL paid plans (emprendedor, business_pro, enterprise_ai — basico is rejected early at line 105-110 because price is 0). The user likely only tested Business Pro. Emprendedor and Enterprise AI would also fail with the same 500 error.

**Could Culqi itself return a 500?** The `POST /api/billing/purchase-plan` route returns a 500 from the catch block at line 266-275. This is NOT a Culqi error — it's a database INSERT error caught and re-wrapped.

### Approaches

1. **Restore the DEFAULT on the column** — Add the sequence default back to the Drizzle schema and create a migration to re-add it.
   - Pros: Fixes the root cause, the sequence already exists
   - Cons: Requires a new migration, Drizzle schema drift fixed properly
   - Effort: Low

2. **Generate correlative in code** — Calculate the next correlative using a database query or use `Math.max() + 1` from existing rows.
   - Pros: No migration needed, code is explicit
   - Cons: Race conditions possible without a transaction, adds complexity
   - Effort: Medium

3. **Use a random/unique identifier instead of sequential** — Replace integer correlative with a UUID-based or timestamp-based ticket number.
   - Pros: No sequence needed, no race conditions
   - Cons: Changes the ticket numbering scheme, SUNAT requirements may expect sequential numbers
   - Effort: Medium

4. **Hybrid: Restore schema DEFAULT + clean up the code** — Re-add the `.default(sql\`nextval('seq_plan_payment_b001')\`)`in the Drizzle schema, generate a migration, and keep`ticketCorrelative: undefined as any` (which allows the DB default to kick in when omitted).
   - Pros: Matches the original intent, minimal code change, sequence already exists
   - Cons: The `undefined as any` is still technically a type-smuggling hack
   - Effort: Low

### Recommendation

**Approach 4 (Hybrid: restore schema DEFAULT + clean up)** is the best path:

1. **Uncomment the DEFAULT in the Drizzle schema** at `src/core/database/schema.ts`, restoring:
   ```typescript
   ticketCorrelative: integer('ticket_correlative')
     .notNull()
     .default(sql`nextval('seq_plan_payment_b001')`),
   ```
2. **Generate a new Drizzle migration** to re-add the DEFAULT to the database column.
3. **Run the migration** in the target environment.
4. **Optionally clean up** `ticketCorrelative: undefined as any` — either keep it (Drizzle will omit it and the DB default kicks in) or remove it from the `.values()` object entirely.

This is the safest because:

- The sequence already exists in the database (just orphaned)
- It restores the original intent of the schema
- Minimal code changes
- Handles all paid plans, not just business_pro

### Risks

- **Sequence state**: If `seq_plan_payment_b001` already has advanced values (from the period when the DEFAULT existed + migration 0008 was active), new payments will continue from the current sequence value. This is actually fine — it prevents duplicate correlatives.
- **Another drift**: If someone re-runs `drizzle-kit` introspection, it might again detect the default as drift if the schema doesn't match. The fix must be applied to the schema FIRST, then generate the migration.
- **No tests exist**: There are zero tests for the billing/purchase flow. Adding coverage should be part of the fix.
- **Display price vs actual price mismatch**: The frontend shows S/55 for Business Pro but the backend charges S/99. This is a separate bug that should be addressed separately, but could confuse users.

### Ready for Proposal

**Yes** — the root cause is clearly identified:

- **File**: `app/api/billing/purchase-plan/route.ts` line 216 (`ticketCorrelative: undefined as any`)
- **Proximate cause**: Drizzle ORM omits `undefined` from INSERT → NOT NULL constraint violation on `ticket_correlative`
- **Root cause chain**: Commented-out schema default → Drizzle drift → migration 0010 dropped the DB DEFAULT → column has no default → INSERT fails
- **Fix**: Restore the DEFAULT in schema + new migration to sync the database
