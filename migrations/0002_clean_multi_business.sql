-- =====================================================
-- MIGRATION: Multi-Business Support (Clean Version)
-- =====================================================
-- This migration renames stores to businesses and enables
-- multiple businesses per user by removing unique constraint
-- =====================================================

-- Step 1: Rename tables
ALTER TABLE "store_settings" RENAME TO "business_settings";
ALTER TABLE "stores" RENAME TO "businesses";

-- Step 2: Rename columns in business_settings
ALTER TABLE "business_settings" RENAME COLUMN "store_id" TO "business_id";

-- Step 3: Rename columns in related tables
ALTER TABLE "product_categories" RENAME COLUMN "store_id" TO "business_id";
ALTER TABLE "products" RENAME COLUMN "store_id" TO "business_id";
ALTER TABLE "messages" RENAME COLUMN "store_id" TO "business_id";

-- Step 4: Drop the unique constraint that limits one business per user
ALTER TABLE "businesses" DROP CONSTRAINT IF EXISTS "unique_owner_store";

-- Step 5: Rename constraints (if they exist)
ALTER TABLE "business_settings" DROP CONSTRAINT IF EXISTS "unique_store_settings";
ALTER TABLE "business_settings" ADD CONSTRAINT "unique_business_settings" UNIQUE("business_id");

ALTER TABLE "product_categories" DROP CONSTRAINT IF EXISTS "unique_store_category";
ALTER TABLE "product_categories" ADD CONSTRAINT "unique_business_category" UNIQUE("business_id", "slug");

-- Step 6: Rename indexes
DROP INDEX IF EXISTS "idx_stores_owner_id";
CREATE INDEX "idx_businesses_owner_id" ON "businesses" USING btree ("owner_id");

DROP INDEX IF EXISTS "idx_stores_slug";
CREATE INDEX "idx_businesses_slug" ON "businesses" USING btree ("slug");

DROP INDEX IF EXISTS "idx_stores_is_active";
CREATE INDEX "idx_businesses_is_active" ON "businesses" USING btree ("is_active") WHERE "businesses"."is_active" = true;

DROP INDEX IF EXISTS "idx_stores_created_at";
CREATE INDEX "idx_businesses_created_at" ON "businesses" USING btree ("created_at" DESC NULLS LAST);

DROP INDEX IF EXISTS "idx_store_settings_store_id";
CREATE INDEX "idx_business_settings_business_id" ON "business_settings" USING btree ("business_id");

DROP INDEX IF EXISTS "idx_categories_store_id";
CREATE INDEX "idx_categories_business_id" ON "product_categories" USING btree ("business_id");

DROP INDEX IF EXISTS "idx_products_store_id";
CREATE INDEX "idx_products_business_id" ON "products" USING btree ("business_id");

DROP INDEX IF EXISTS "idx_messages_store_id";
CREATE INDEX "idx_messages_business_id" ON "messages" USING btree ("business_id");

-- Step 7: Update composite indexes
DROP INDEX IF EXISTS "idx_categories_slug";
CREATE INDEX "idx_categories_slug" ON "product_categories" USING btree ("business_id", "slug");

DROP INDEX IF EXISTS "idx_categories_display_order";
CREATE INDEX "idx_categories_display_order" ON "product_categories" USING btree ("business_id", "display_order");

DROP INDEX IF EXISTS "idx_products_display_order";
CREATE INDEX "idx_products_display_order" ON "products" USING btree ("business_id", "display_order");

DROP INDEX IF EXISTS "idx_messages_is_read";
CREATE INDEX "idx_messages_is_read" ON "messages" USING btree ("business_id", "is_read") WHERE "messages"."is_read" = false;

DROP INDEX IF EXISTS "idx_messages_created_at";
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("business_id", "created_at" DESC NULLS LAST);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables renamed: stores -> businesses, store_settings -> business_settings
-- Columns renamed: store_id -> business_id in all related tables
-- Unique constraint removed: Users can now have multiple businesses
-- All indexes updated to use new naming convention
-- =====================================================
