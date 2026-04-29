CREATE TYPE "public"."chat_sender" AS ENUM('vendedor', 'cliente');--> statement-breakpoint
CREATE TYPE "public"."contrast_level" AS ENUM('standard', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('chat', 'almacen', 'plan', 'pedidos', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('message_new', 'message_unread', 'stock_low', 'stock_out', 'plan_expiring', 'plan_expired', 'plan_upgraded', 'order_created', 'order_status_changed', 'order_shipped', 'order_finalization_requested', 'order_finalization_confirmed', 'order_finalization_rejected', 'order_auto_finalized', 'system');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'yape', 'plin');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'not_delivered', 'delivered', 'completed', 'failed', 'disputed', 'refund_requested', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."plan_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('pendiente', 'por_enviar', 'enviado');--> statement-breakpoint
CREATE TYPE "public"."shipping_type" AS ENUM('agencia', 'domicilio', 'recojo');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('basico', 'emprendedor', 'business_pro', 'enterprise_ai');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'past_due', 'canceled', 'expired', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TABLE "business_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" text NOT NULL,
	"code_hash" text NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "business_invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"theme_mode" text DEFAULT 'light' NOT NULL,
	"contrast_level" text DEFAULT 'standard' NOT NULL,
	"custom_colors" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"culqi_public_key" text,
	"culqi_secret_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_business_settings" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "business_slug_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_slug_aliases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
	CONSTRAINT "business_subscriptions_gateway_subscription_id_unique" UNIQUE("gateway_subscription_id"),
	CONSTRAINT "unique_business_subscription" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "business_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"custom_permissions" jsonb,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invitation_id" uuid,
	CONSTRAINT "unique_business_user" UNIQUE("business_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "business_team_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_business_role" UNIQUE("business_id","role")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"cover_image_url" text,
	"logo_url" text,
	"address" text,
	"store_type" text,
	"description" text,
	"whatsapp_number" text,
	"tax_id" text,
	"person_type" text,
	"country" text,
	"city" text,
	"email" text,
	"legal_rep_name" text,
	"legal_rep_role" text,
	"legal_rep_phone" text,
	"legal_rep_email" text,
	"payment_flow" text[],
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"geo_region" text,
	"geo_placename" text,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
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
CREATE TABLE "form_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_phone" text,
	"message_text" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_from_store" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"category" "notification_category" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"token" text NOT NULL,
	"sender" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"buyer_dni" text,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"delivery_code_hash" text,
	"delivery_code_expires_at" timestamp with time zone,
	"order_number" text,
	"shipping_type" "shipping_type",
	"shipping_department" text,
	"shipping_province" text,
	"shipping_district" text,
	"shipping_address" text,
	"shipping_agency" text,
	"shipping_reference" text,
	"shipping_phone" text,
	"shipping_cost" numeric(10, 2),
	"ticket_url" text,
	"shipped_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"finalization_requested_at" timestamp with time zone,
	"finalization_confirmed_at" timestamp with time zone,
	"finalization_deadline" timestamp with time zone,
	"seller_status" "seller_status",
	"ticket_image_url" text,
	"rejection_reason" text,
	"rejection_image" text,
	"tracking_token" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_culqi_charge_id_unique" UNIQUE("culqi_charge_id"),
	CONSTRAINT "payments_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "plan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"plan_type" "subscription_plan" NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"amount_subtotal" numeric(10, 2) NOT NULL,
	"amount_igv" numeric(10, 2) NOT NULL,
	"amount_total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"culqi_charge_id" text,
	"culqi_reference_code" text,
	"status" "plan_payment_status" DEFAULT 'pending' NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_full_name" text,
	"buyer_document_type" text,
	"buyer_document_number" text,
	"buyer_address" text,
	"ticket_series" text DEFAULT 'B001' NOT NULL,
	"ticket_correlative" integer NOT NULL,
	"ticket_url" text,
	"ticket_issued_at" timestamp with time zone,
	"plan_start_date" timestamp with time zone,
	"plan_end_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_payments_culqi_charge_id_unique" UNIQUE("culqi_charge_id"),
	CONSTRAINT "unique_plan_payment_correlative" UNIQUE("ticket_series","ticket_correlative")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_business_category" UNIQUE("business_id","slug")
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
	"business_id" uuid NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"second_price" numeric(10, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"tags" text[],
	"stars" integer DEFAULT 0,
	"sale_status" text DEFAULT 'NORMAL' NOT NULL,
	"brand" text,
	"slug" text,
	"seo_title" text,
	"seo_description" text,
	"shipping_info" text,
	"display_order" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_business_product_slug" UNIQUE("business_id","slug")
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
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "saas_issuer_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"ruc" text NOT NULL,
	"razon_social" text NOT NULL,
	"direccion" text NOT NULL,
	"distrito" text NOT NULL,
	"provincia" text NOT NULL,
	"departamento" text NOT NULL,
	"ubigeo" text,
	"logo_url" text,
	"igv_rate" numeric(5, 4) DEFAULT '0.18' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_slug_aliases" ADD CONSTRAINT "business_slug_aliases_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_members" ADD CONSTRAINT "business_team_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_members" ADD CONSTRAINT "business_team_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_members" ADD CONSTRAINT "business_team_members_invitation_id_business_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."business_invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_roles" ADD CONSTRAINT "business_team_roles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_messages" ADD CONSTRAINT "form_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_chats" ADD CONSTRAINT "payment_chats_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_seller_user_id_profiles_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_payments" ADD CONSTRAINT "plan_payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payout_accounts" ADD CONSTRAINT "seller_payout_accounts_seller_user_id_profiles_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_business_invitations_code" ON "business_invitations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_business_invitations_business_id" ON "business_invitations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_invitations_expires" ON "business_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_business_settings_business_id" ON "business_settings" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_slug_aliases_business_id" ON "business_slug_aliases" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_slug_aliases_slug" ON "business_slug_aliases" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_business_slug_aliases_created_at" ON "business_slug_aliases" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_business_subscriptions_business_id" ON "business_subscriptions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_subscriptions_gateway_sub_id" ON "business_subscriptions" USING btree ("gateway_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_business_subscriptions_created_at" ON "business_subscriptions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_business_team_members_business_id" ON "business_team_members" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_team_members_user_id" ON "business_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_business_team_roles_business_id" ON "business_team_roles" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_owner_id" ON "businesses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_slug" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_businesses_is_active" ON "businesses" USING btree ("is_active") WHERE "businesses"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_businesses_created_at" ON "businesses" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_guest_id" ON "chat_sessions" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_business_id" ON "chat_sessions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_form_messages_business_id" ON "form_messages" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_form_messages_is_read" ON "form_messages" USING btree ("business_id","is_read") WHERE "form_messages"."is_read" = false;--> statement-breakpoint
CREATE INDEX "idx_form_messages_created_at" ON "form_messages" USING btree ("business_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_session_id" ON "messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_business_id" ON "notifications" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_business_created" ON "notifications" USING btree ("business_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("business_id","is_read") WHERE "notifications"."is_read" = false AND "notifications"."is_dismissed" = false;--> statement-breakpoint
CREATE INDEX "idx_notifications_category" ON "notifications" USING btree ("business_id","category");--> statement-breakpoint
CREATE INDEX "idx_payment_chats_payment_id" ON "payment_chats" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_chats_token" ON "payment_chats" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_payment_chats_created_at" ON "payment_chats" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_business_id" ON "payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_payments_product_id" ON "payments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_payments_seller_user_id" ON "payments" USING btree ("seller_user_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_culqi_charge_id" ON "payments" USING btree ("culqi_charge_id");--> statement-breakpoint
CREATE INDEX "idx_payments_created_at" ON "payments" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_shipped_at" ON "payments" USING btree ("shipped_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_completed_at" ON "payments" USING btree ("completed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_seller_status" ON "payments" USING btree ("seller_status");--> statement-breakpoint
CREATE INDEX "idx_payments_tracking_token" ON "payments" USING btree ("tracking_token");--> statement-breakpoint
CREATE INDEX "idx_payments_finalization_requested_at" ON "payments" USING btree ("finalization_requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_finalization_deadline" ON "payments" USING btree ("finalization_deadline");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_business_id" ON "plan_payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_status" ON "plan_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_culqi_charge" ON "plan_payments" USING btree ("culqi_charge_id");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_ticket_issued" ON "plan_payments" USING btree ("ticket_issued_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_plan_payments_created_at" ON "plan_payments" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_categories_business_id" ON "product_categories" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "product_categories" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "idx_categories_display_order" ON "product_categories" USING btree ("business_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_product_likes_product_id" ON "product_likes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_media_product_id" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_media_display_order" ON "product_media" USING btree ("product_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_products_business_id" ON "products" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_is_available" ON "products" USING btree ("is_available") WHERE "products"."is_available" = true;--> statement-breakpoint
CREATE INDEX "idx_products_display_order" ON "products" USING btree ("business_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_products_created_at" ON "products" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_products_title_search" ON "products" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_products_slug" ON "products" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_profiles_full_name" ON "profiles" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_seller_user_id" ON "seller_payout_accounts" USING btree ("seller_user_id");