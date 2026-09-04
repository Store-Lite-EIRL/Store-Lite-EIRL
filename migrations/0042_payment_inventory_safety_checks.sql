-- =====================================================
-- MIGRATION: 0042_payment_inventory_safety_checks
-- =====================================================
-- Description: Add/restore two CHECK constraints that enforce
--              basic inventory and payment safety at the DB level.
--
-- 1) products.stock >= 0 (stock_check)
--    Already exists in dev (from manual migration 0004/0002),
--    but MISSING in prod. This was dropped by 0009 and never
--    re-applied. 0 negative-stock rows verified in both DBs.
--
-- 2) payments.amount > 0 (payments_amount_positive)
--    Defined in Drizzle schema (orders.ts:122) but never applied
--    to ANY database. 0 violating rows: 85 payments in dev,
--    0 in prod.
--
-- Both constraints are idempotent (IF NOT EXISTS) and additive:
-- no existing rows will be rejected.
--
-- Apply via operator to BOTH environments (dev and prod):
--   node scripts/apply-migration.mjs migrations/0042_...sql
--   or paste into Supabase SQL editor (dev then prod).
-- =====================================================

-- Step 1: products.stock >= 0 (reconcile dev/prod drift)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stock_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE "products"
      ADD CONSTRAINT "stock_check" CHECK ("stock" >= 0);
  END IF;
END $$;
--> statement-breakpoint

-- Step 2: payments.amount > 0 (Drizzle-defined, never applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_amount_positive'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE "payments"
      ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);
  END IF;
END $$;
--> statement-breakpoint
