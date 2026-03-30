CREATE TYPE "public"."subscription_plan" AS ENUM('basico', 'emprendedor', 'business_pro', 'enterprise_ai');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'past_due', 'canceled', 'expired', 'trialing');--> statement-breakpoint
CREATE TABLE "business_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"plan_type" "subscription_plan" DEFAULT 'basico' NOT NULL,
	"plan_status" "subscription_status" DEFAULT 'inactive' NOT NULL,
	"plan_start_date" timestamp with time zone,
	"plan_end_date" timestamp with time zone,
	"plan_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"gateway_subscription_id" text,
	"gateway_customer_id" text,
	"gateway_plan_id" text,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_subscriptions_gateway_subscription_id_unique" UNIQUE("gateway_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "payment_flow" text[];--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "geo_region" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "geo_placename" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "seo_keywords" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_business_subscriptions_business_id" ON "business_subscriptions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_subscriptions_gateway_sub_id" ON "business_subscriptions" USING btree ("gateway_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_business_subscriptions_created_at" ON "business_subscriptions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_products_slug" ON "products" USING btree ("business_id","slug");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "unique_product_slug" UNIQUE("business_id","slug");--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "payment_flow_length_check" CHECK (coalesce(array_length("businesses"."payment_flow", 1), 0) <= 5);