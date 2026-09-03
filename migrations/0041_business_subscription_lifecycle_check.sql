-- =====================================================
-- MIGRATION: 0041_business_subscription_lifecycle_check
-- =====================================================
-- Description: Enforce the subscription lifecycle sanity invariant
--              `plan_end_date >= plan_start_date` on business_subscriptions.
--
-- Context (A3 of PENDING-DATABASE-DEBT.md, Store_Lite):
--   The A3 plan requested a "partial unique (active/trial) + lifecycle checks".
--   Audit (2026-09, read-only, both DBs) found:
--     - A UNIQUE(business_id) constraint (`unique_business_subscription`) ALREADY
--       exists in both DBs, so "one subscription per business" is already enforced
--       (stronger than the partial-unique A3 asked for). Nothing to add there.
--     - The only missing invariant is the time-sanity CHECK: end >= start.
--     - Data is clean in both DBs (0 rows with plan_end_date < plan_start_date),
--       so this constraint is additive and will not reject existing rows.
--
--   Null-safe by design: `plan_end_date` may be NULL (a sub without a fixed end,
--   e.g. free/base tier). The CHECK only applies when BOTH dates are present.
--   If plan_start_date is NULL, the row is left valid (no end-before-start risk).
--
-- Apply via operator to BOTH environments (dev and prod), same script:
--   node scripts/apply-migration.mjs migrations/0041_...sql
--   or paste into Supabase SQL editor (dev then prod).
-- =====================================================

-- Step 1: Add the lifecycle sanity CHECK (idempotent: only adds if not present).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_business_subscription_date_order'
      AND conrelid = 'public.business_subscriptions'::regclass
  ) THEN
    ALTER TABLE "public"."business_subscriptions"
      ADD CONSTRAINT chk_business_subscription_date_order
      CHECK (
        plan_end_date IS NULL
        OR plan_start_date IS NULL
        OR plan_end_date >= plan_start_date
      );
  END IF;
END $$;
--> statement-breakpoint
