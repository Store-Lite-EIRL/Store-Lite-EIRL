ALTER TABLE "product_categories" DROP CONSTRAINT "unique_business_category";--> statement-breakpoint
DROP INDEX "idx_categories_slug";--> statement-breakpoint
DROP INDEX "idx_products_title_search";--> statement-breakpoint
DROP INDEX "idx_profiles_full_name";--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "person_type" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "legal_rep_name" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "legal_rep_role" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "legal_rep_phone" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "legal_rep_email" text;--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "second_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stars" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_status" text DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_info" text;--> statement-breakpoint
CREATE INDEX "idx_categories_business_id_name" ON "product_categories" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "idx_products_title_search" ON "products" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_profiles_full_name" ON "profiles" USING btree ("full_name");--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "unique_business_category" UNIQUE("business_id","name");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "stock_check" CHECK ("products"."stock" >= 0);