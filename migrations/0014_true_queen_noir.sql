-- Add new columns to payments table for order tracking workflow
-- Generated from schema changes: ticketImageUrl, finalizationDeadline, etc.

ALTER TABLE "payments" ADD COLUMN "ticket_image_url" text;
ALTER TABLE "payments" ADD COLUMN "finalization_deadline" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN "finalization_requested_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN "finalization_confirmed_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN "completed_at" timestamp with time zone;
