CREATE TYPE "public"."order_attachment_type" AS ENUM('tracking', 'cip', 'invoice', 'photo', 'video', 'document', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status_v2" AS ENUM('CREATED', 'PAID', 'PREPARING_ORDER', 'WAITING_CUSTOMER_CONFIRMATION', 'READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'ISSUE_REPORTED', 'DISPUTE', 'SELLER_TIMEOUT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."order_timeline_event_type" AS ENUM('ORDER_CREATED', 'ORDER_PAID', 'ORDER_PREPARING', 'ATTACHMENT_UPLOADED', 'CUSTOMER_CONFIRMED', 'CUSTOMER_REPORTED_ISSUE', 'DISPUTE_CREATED', 'SHIPPING_PAYMENT_PENDING', 'SHIPPING_PAYMENT_CONFIRMED', 'PICKUP_CODE_GENERATED', 'ORDER_READY_TO_SHIP', 'ORDER_IN_TRANSIT', 'ORDER_DELIVERED', 'ORDER_COMPLETED', 'SELLER_TIMEOUT', 'AUTO_APPROVED');--> statement-breakpoint
CREATE TABLE "order_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"attachment_type" "order_attachment_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"event_type" "order_timeline_event_type" NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "courier_name" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "pickup_code" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "seller_note" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_order_id_payments_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_timeline_events" ADD CONSTRAINT "order_timeline_events_order_id_payments_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_timeline_events" ADD CONSTRAINT "order_timeline_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_attachments_order_id" ON "order_attachments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_timeline_events_order_id" ON "order_timeline_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_timeline_events_created_at" ON "order_timeline_events" USING btree ("created_at" DESC NULLS LAST);