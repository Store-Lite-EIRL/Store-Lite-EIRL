CREATE TABLE "complaint_book_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"ticket_number" text NOT NULL,
	"consumer_last_name" text NOT NULL,
	"consumer_first_name" text NOT NULL,
	"consumer_doc_type" text NOT NULL,
	"consumer_doc_id" text NOT NULL,
	"consumer_address" text NOT NULL,
	"consumer_phone" text NOT NULL,
	"consumer_email" text NOT NULL,
	"minor_age" boolean DEFAULT false NOT NULL,
	"guardian_name" text,
	"claim_type" text DEFAULT 'reclamo' NOT NULL,
	"contract_description" text NOT NULL,
	"claimed_amount" numeric(10, 2),
	"claim_description" text NOT NULL,
	"consumer_request" text NOT NULL,
	"sla_deadline" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_response" text,
	"admin_responded_at" timestamp with time zone,
	"email_sent_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "complaint_book_records_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "hero_images" text[];--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "payment_id" uuid;--> statement-breakpoint
ALTER TABLE "complaint_book_records" ADD CONSTRAINT "complaint_book_records_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cbr_business_id" ON "complaint_book_records" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_cbr_ticket_number" ON "complaint_book_records" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "idx_cbr_status" ON "complaint_book_records" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "idx_cbr_created_at" ON "complaint_book_records" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_cbr_active" ON "complaint_book_records" USING btree ("business_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_payment_id" ON "messages" USING btree ("payment_id");