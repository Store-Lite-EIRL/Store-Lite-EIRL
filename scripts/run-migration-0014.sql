-- =====================================================
-- MIGRATION: 0014_finalization_flow
-- Description: Add finalization flow fields and enums
-- =====================================================

-- 1. Add new values to notification_type enum
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_finalization_requested' BEFORE 'system';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_finalization_confirmed' BEFORE 'system';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_finalization_rejected' BEFORE 'system';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'order_auto_finalized' BEFORE 'system';

-- 2. Add new value to payment_status enum (used by payments.status)
ALTER TYPE "public"."payment_status" ADD VALUE IF NOT EXISTS 'esperando_confirmacion';

-- 3. Add new columns to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "finalization_requested_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "finalization_confirmed_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "finalization_deadline" timestamp with time zone;

-- 4. Add new indexes for performance
CREATE INDEX IF NOT EXISTS "idx_payments_finalization_requested_at" ON "payments" USING btree ("finalization_requested_at" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_payments_finalization_deadline" ON "payments" USING btree ("finalization_deadline");
