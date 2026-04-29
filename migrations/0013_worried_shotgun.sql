CREATE TYPE "public"."chat_sender" AS ENUM('seller', 'customer');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('pending', 'por_enviar', 'enviado');--> statement-breakpoint
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
ALTER TABLE "payments" ADD COLUMN "shipped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "seller_status" "seller_status";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "ticket_image_url" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejection_image" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tracking_token" text;--> statement-breakpoint
ALTER TABLE "payment_chats" ADD CONSTRAINT "payment_chats_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payment_chats_payment_id" ON "payment_chats" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_chats_token" ON "payment_chats" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_payment_chats_created_at" ON "payment_chats" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_shipped_at" ON "payments" USING btree ("shipped_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_completed_at" ON "payments" USING btree ("completed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payments_seller_status" ON "payments" USING btree ("seller_status");--> statement-breakpoint
CREATE INDEX "idx_payments_tracking_token" ON "payments" USING btree ("tracking_token");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tracking_token_unique" UNIQUE("tracking_token");