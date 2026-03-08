CREATE TABLE "business_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"theme_mode" text DEFAULT 'light' NOT NULL,
	"contrast_level" text DEFAULT 'standard' NOT NULL,
	"custom_colors" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_business_settings" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"cover_image_url" text,
	"address" text,
	"store_type" text,
	"description" text,
	"whatsapp_number" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "name_length_check" CHECK (char_length("businesses"."name") >= 3 AND char_length("businesses"."name") <= 100),
	CONSTRAINT "slug_format_check" CHECK (char_length("businesses"."slug") >= 3 AND char_length("businesses"."slug") <= 50 AND "businesses"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "description_length_check" CHECK (char_length("businesses"."description") <= 1000),
	CONSTRAINT "whatsapp_format_check" CHECK ("businesses"."whatsapp_number" ~ '^\+?[1-9]\d{1,14}$')
);
--> statement-breakpoint
ALTER TABLE "store_settings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stores" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "store_settings" CASCADE;--> statement-breakpoint
DROP TABLE "stores" CASCADE;--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "unique_store_category";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_store_id_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_store_id_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_store_id_stores_id_fk";
--> statement-breakpoint
DROP INDEX "idx_messages_store_id";--> statement-breakpoint
DROP INDEX "idx_categories_store_id";--> statement-breakpoint
DROP INDEX "idx_products_store_id";--> statement-breakpoint
DROP INDEX "idx_messages_is_read";--> statement-breakpoint
DROP INDEX "idx_messages_created_at";--> statement-breakpoint
DROP INDEX "idx_categories_slug";--> statement-breakpoint
DROP INDEX "idx_categories_display_order";--> statement-breakpoint
DROP INDEX "idx_products_display_order";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_business_settings_business_id" ON "business_settings" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_owner_id" ON "businesses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_slug" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_businesses_is_active" ON "businesses" USING btree ("is_active") WHERE "businesses"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_businesses_created_at" ON "businesses" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_business_id" ON "messages" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_categories_business_id" ON "product_categories" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_products_business_id" ON "products" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_messages_is_read" ON "messages" USING btree ("business_id","is_read") WHERE "messages"."is_read" = false;--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("business_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "product_categories" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "idx_categories_display_order" ON "product_categories" USING btree ("business_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_products_display_order" ON "products" USING btree ("business_id","display_order");--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "store_id";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "store_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "store_id";--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "unique_business_category" UNIQUE("business_id","slug");