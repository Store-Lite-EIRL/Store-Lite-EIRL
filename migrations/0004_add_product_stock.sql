-- =====================================================
-- MIGRATION: Add product stock
-- =====================================================
-- Adds stock field to products table
-- =====================================================

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_check') THEN
    ALTER TABLE "products" ADD CONSTRAINT "stock_check" CHECK (stock >= 0);
  END IF;
END $$;
