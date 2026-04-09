-- =====================================================
-- MIGRATION: 0013_sync_businesses_schema
-- =====================================================
-- Description: Synchronizes 'businesses' columns and creates 'business_subscriptions'
-- =====================================================

-- Step 1: Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "public"."subscription_plan" AS ENUM('basico', 'emprendedor', 'business_pro', 'enterprise_ai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'past_due', 'canceled', 'expired', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add missing columns to 'businesses' table
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "tax_id" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "person_type" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "legal_rep_name" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "legal_rep_role" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "legal_rep_phone" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "legal_rep_email" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "payment_flow" text[];
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 7);
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 7);
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "geo_region" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "geo_placename" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "seo_title" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "seo_description" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "seo_keywords" text[];

-- Step 3: Create 'business_subscriptions' table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."business_subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "business_id" uuid NOT NULL REFERENCES "public"."businesses"("id") ON DELETE CASCADE,
    "plan_type" "public"."subscription_plan" DEFAULT 'basico' NOT NULL,
    "plan_status" "public"."subscription_status" DEFAULT 'inactive' NOT NULL,
    "plan_start_date" timestamp with time zone,
    "plan_end_date" timestamp with time zone,
    "plan_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gateway_subscription_id" text UNIQUE,
    "gateway_customer_id" text,
    "gateway_plan_id" text,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 4: Create missing indexes
DO $$ BEGIN
    CREATE INDEX "idx_businesses_owner_id" ON "public"."businesses" ("owner_id");
EXCEPTION WHEN duplicate_table THEN null; END $$;

DO $$ BEGIN
    CREATE INDEX "idx_business_subscriptions_business_id" ON "public"."business_subscriptions" ("business_id");
EXCEPTION WHEN duplicate_table THEN null; END $$;
