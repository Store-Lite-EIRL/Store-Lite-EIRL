-- =====================================================
-- MIGRATION: Add Business Details
-- =====================================================
-- Adding missing columns to store all information from the creation form
-- =====================================================

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "tax_id" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "person_type" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "legal_rep_name" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "legal_rep_role" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "legal_rep_phone" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "legal_rep_email" text;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
