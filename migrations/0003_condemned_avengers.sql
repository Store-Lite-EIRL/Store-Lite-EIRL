CREATE TYPE "public"."payment_method" AS ENUM('card', 'yape', 'plin');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'not_delivered', 'delivered', 'completed', 'failed', 'disputed', 'refund_requested', 'refunded');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"is_from_store" boolean DEFAULT false,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"guest_id" text NOT NULL,
	"guest_name" text NOT NULL,
	"guest_gender" text NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"payment_method" text NOT NULL,
	"culqi_charge_id" text,
	"culqi_reference_code" text,
	"culqi_tracking_id" text,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivery_code_hash" text,
	"delivery_code_expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_culqi_charge_id_unique" UNIQUE("culqi_charge_id")
);
--> statement-breakpoint
CREATE TABLE "product_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"ip_address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_product_like" UNIQUE("product_id","ip_address")
);
--> statement-breakpoint
CREATE TABLE "seller_payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"document_type" text DEFAULT 'DNI' NOT NULL,
	"document_number" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_number" text NOT NULL,
	"bank_cci" text,
	"country" text DEFAULT 'PE' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_payout_accounts_seller_user_id_unique" UNIQUE("seller_user_id")
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stars" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_seller_user_id_profiles_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payout_accounts" ADD CONSTRAINT "seller_payout_accounts_seller_user_id_profiles_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_messages_session_id" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_created_at" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_guest_id" ON "chat_sessions" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_business_id" ON "chat_sessions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_payments_business_id" ON "payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_payments_product_id" ON "payments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_payments_seller_user_id" ON "payments" USING btree ("seller_user_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_culqi_charge_id" ON "payments" USING btree ("culqi_charge_id");--> statement-breakpoint
CREATE INDEX "idx_payments_created_at" ON "payments" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_product_likes_product_id" ON "product_likes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_seller_user_id" ON "seller_payout_accounts" USING btree ("seller_user_id");