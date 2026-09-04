-- E4: Integrity check/unique constraints (DB debt group E)
-- Prefix 0037 chosen because the manual operator-style migration chain on disk
-- reaches 0036 (0036_add_performance_composite_indexes.sql). The Drizzle journal
-- chain does not track manual operator SQL; using 0037 continues the highest
-- existing manual prefix by +1, keeping the two naming families undisturbed.
--
-- These constraints are ADDITIVE only and safe to apply on production via the
-- Supabase SQL editor or a future runner.
--
-- A read-only audit ran against the live production DB and found ZERO violations:
--   - payments.amount:    0 rows with amount <= 0   -> SAFE for amount > 0
--   - products.stars:     0 rows with stars < 0     -> SAFE for stars >= 0
--   - product_media:      0 duplicate (product_id, display_order) -> SAFE for UNIQUE
--
-- Each statement is wrapped in a DO block to make re-runs idempotent, because
-- PostgreSQL does not support IF NOT EXISTS on ADD CONSTRAINT.

-- payments.amount must be strictly positive
DO $$
BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- products.stars must be non-negative
DO $$
BEGIN
  ALTER TABLE products
    ADD CONSTRAINT products_stars_non_negative CHECK (stars >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- product_media must not repeat the same display_order per product
DO $$
BEGIN
  ALTER TABLE product_media
    ADD CONSTRAINT unique_product_media_display_order UNIQUE (product_id, display_order);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
