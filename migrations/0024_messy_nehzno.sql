CREATE TYPE "public"."appeal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."complaint_score_tier" AS ENUM('verified', 'under_review', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."deactivation_reason" AS ENUM('verified_complaints', 'incomplete_orders');--> statement-breakpoint
CREATE TYPE "public"."feedback_category" AS ENUM('bug', 'suggestion', 'question', 'other');--> statement-breakpoint
CREATE TYPE "public"."feedback_priority" AS ENUM('low', 'normal', 'high');--> statement-breakpoint
CREATE TYPE "public"."feedback_request_type" AS ENUM('support', 'feedback', 'complaint');--> statement-breakpoint
CREATE TYPE "public"."feedback_sender_type" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE SEQUENCE "public"."seq_plan_payment_b001" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"deactivation_notice_id" uuid NOT NULL,
	"seller_statement" text NOT NULL,
	"seller_evidence" jsonb DEFAULT '{}',
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "appeal_status" DEFAULT 'pending' NOT NULL,
	"admin_reviewer_id" uuid,
	"admin_notes" text,
	"reviewed_at" timestamp with time zone,
	"sla_deadline" timestamp with time zone NOT NULL,
	"sla_breached" boolean DEFAULT false NOT NULL,
	"resolution" text,
	"reactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deactivation_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"reason" "deactivation_reason" NOT NULL,
	"complaint_count" integer DEFAULT 0,
	"incomplete_order_rate" integer,
	"evidence" jsonb DEFAULT '{}',
	"notification_sent_at" timestamp with time zone,
	"notification_method" text,
	"notification_reference" text,
	"grace_period_ends_at" timestamp with time zone NOT NULL,
	"appeal_deadline" timestamp with time zone NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_type" "feedback_sender_type" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ticket_number" text NOT NULL,
	"request_type" "feedback_request_type" DEFAULT 'feedback' NOT NULL,
	"category" "feedback_category" NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" "feedback_status" DEFAULT 'open' NOT NULL,
	"priority" "feedback_priority" DEFAULT 'normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "business_subscriptions" ALTER COLUMN "plan_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "business_subscriptions" ALTER COLUMN "plan_type" SET DEFAULT 'lite'::text;--> statement-breakpoint
ALTER TABLE "plan_payments" ALTER COLUMN "plan_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_plan";--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('lite', 'lite_pago', 'lite_plus');--> statement-breakpoint
ALTER TABLE "business_subscriptions" ALTER COLUMN "plan_type" SET DEFAULT 'lite'::"public"."subscription_plan";--> statement-breakpoint
ALTER TABLE "business_subscriptions" ALTER COLUMN "plan_type" SET DATA TYPE "public"."subscription_plan" USING "plan_type"::"public"."subscription_plan";--> statement-breakpoint
ALTER TABLE "plan_payments" ALTER COLUMN "plan_type" SET DATA TYPE "public"."subscription_plan" USING "plan_type"::"public"."subscription_plan";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "is_from_store" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "is_read" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "social_links" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "deactivation_reason" "deactivation_reason";--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "deactivation_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "appeal_status" "appeal_status";--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "grace_period_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD COLUMN "score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD COLUMN "score_tier" "complaint_score_tier" DEFAULT 'rejected';--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD COLUMN "score_breakdown" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD COLUMN "linked_order_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_ubigeo" text;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_deactivation_notice_id_deactivation_notices_id_fk" FOREIGN KEY ("deactivation_notice_id") REFERENCES "public"."deactivation_notices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_admin_reviewer_id_profiles_id_fk" FOREIGN KEY ("admin_reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deactivation_notices" ADD CONSTRAINT "deactivation_notices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_ticket_id_feedback_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."feedback_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tickets" ADD CONSTRAINT "feedback_tickets_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tickets" ADD CONSTRAINT "feedback_tickets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_appeals_business_id" ON "appeals" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_appeals_deactivation_notice_id" ON "appeals" USING btree ("deactivation_notice_id");--> statement-breakpoint
CREATE INDEX "idx_appeals_status" ON "appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_appeals_sla_deadline" ON "appeals" USING btree ("sla_deadline");--> statement-breakpoint
CREATE INDEX "idx_appeals_submitted_at" ON "appeals" USING btree ("submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_deactivation_notices_business_id" ON "deactivation_notices" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_deactivation_notices_reason" ON "deactivation_notices" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "idx_deactivation_notices_grace_ends_at" ON "deactivation_notices" USING btree ("grace_period_ends_at");--> statement-breakpoint
CREATE INDEX "idx_deactivation_notices_appeal_deadline" ON "deactivation_notices" USING btree ("appeal_deadline");--> statement-breakpoint
CREATE INDEX "idx_deactivation_notices_is_resolved" ON "deactivation_notices" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "idx_deactivation_notices_created_at" ON "deactivation_notices" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_fr_ticket_id" ON "feedback_responses" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_fr_created_at" ON "feedback_responses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ft_business_id" ON "feedback_tickets" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_ft_user_id" ON "feedback_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ft_status" ON "feedback_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ft_ticket_number" ON "feedback_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "idx_ft_created_at" ON "feedback_tickets" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD CONSTRAINT "complaint_book_records_linked_order_id_payments_id_fk" FOREIGN KEY ("linked_order_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_businesses_deactivation_reason" ON "businesses" USING btree ("deactivation_reason");--> statement-breakpoint
CREATE INDEX "idx_businesses_appeal_status" ON "businesses" USING btree ("appeal_status");--> statement-breakpoint
CREATE INDEX "idx_businesses_grace_period_ends_at" ON "businesses" USING btree ("grace_period_ends_at");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_business_status_created" ON "chat_sessions" USING btree ("business_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_chat_sessions_active_per_guest" ON "chat_sessions" USING btree ("business_id","guest_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_messages_session_created" ON "messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_cbr_score_tier" ON "complaint_book_records" USING btree ("business_id","score_tier");--> statement-breakpoint
CREATE INDEX "idx_cbr_is_verified" ON "complaint_book_records" USING btree ("business_id","is_verified") WHERE "complaint_book_records"."is_verified" = true;--> statement-breakpoint
CREATE INDEX "idx_cbr_linked_order_id" ON "complaint_book_records" USING btree ("linked_order_id");--> statement-breakpoint
CREATE INDEX "idx_cbr_verified_at" ON "complaint_book_records" USING btree ("verified_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_products_business_updated" ON "products" USING btree ("business_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "unique_product_media_display_order" UNIQUE("product_id","display_order");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stars_non_negative" CHECK ("products"."stars" >= 0);