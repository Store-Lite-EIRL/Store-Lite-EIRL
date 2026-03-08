CREATE TYPE "public"."contrast_level" AS ENUM('standard', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_phone" text,
	"message_text" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sender_name_check" CHECK (char_length("messages"."sender_name") >= 2),
	CONSTRAINT "sender_email_check" CHECK ("messages"."sender_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
	CONSTRAINT "message_text_check" CHECK (char_length("messages"."message_text") >= 10 AND char_length("messages"."message_text") <= 1000)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_store_category" UNIQUE("store_id","slug"),
	CONSTRAINT "category_name_check" CHECK (char_length("product_categories"."name") >= 2 AND char_length("product_categories"."name") <= 50)
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"media_url" text NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "title_length_check" CHECK (char_length("products"."title") >= 3 AND char_length("products"."title") <= 200),
	CONSTRAINT "description_length_check" CHECK (char_length("products"."description") <= 2000),
	CONSTRAINT "price_check" CHECK ("products"."price" >= 0),
	CONSTRAINT "currency_check" CHECK (char_length("products"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"provider_id" text,
	"age" integer,
	"address" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "age_check" CHECK ("profiles"."age" >= 13 AND "profiles"."age" <= 120)
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"theme_mode" text DEFAULT 'light' NOT NULL,
	"contrast_level" text DEFAULT 'standard' NOT NULL,
	"custom_colors" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_store_settings" UNIQUE("store_id")
);
--> statement-breakpoint
CREATE TABLE "stores" (
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
	CONSTRAINT "stores_slug_unique" UNIQUE("slug"),
	CONSTRAINT "unique_owner_store" UNIQUE("owner_id"),
	CONSTRAINT "name_length_check" CHECK (char_length("stores"."name") >= 3 AND char_length("stores"."name") <= 100),
	CONSTRAINT "slug_format_check" CHECK (char_length("stores"."slug") >= 3 AND char_length("stores"."slug") <= 50 AND "stores"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "description_length_check" CHECK (char_length("stores"."description") <= 1000),
	CONSTRAINT "whatsapp_format_check" CHECK ("stores"."whatsapp_number" ~ '^\+?[1-9]\d{1,14}$')
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_store_id" ON "messages" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_messages_is_read" ON "messages" USING btree ("store_id","is_read") WHERE "messages"."is_read" = false;--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("store_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_categories_store_id" ON "product_categories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "product_categories" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "idx_categories_display_order" ON "product_categories" USING btree ("store_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_product_media_product_id" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_media_display_order" ON "product_media" USING btree ("product_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_products_store_id" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_is_available" ON "products" USING btree ("is_available") WHERE "products"."is_available" = true;--> statement-breakpoint
CREATE INDEX "idx_products_display_order" ON "products" USING btree ("store_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_products_created_at" ON "products" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_products_title_search" ON "products" USING gin ("title");--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_profiles_full_name" ON "profiles" USING gin ("full_name");--> statement-breakpoint
CREATE INDEX "idx_store_settings_store_id" ON "store_settings" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_stores_owner_id" ON "stores" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_stores_slug" ON "stores" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_stores_is_active" ON "stores" USING btree ("is_active") WHERE "stores"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_stores_created_at" ON "stores" USING btree ("created_at" DESC NULLS LAST);