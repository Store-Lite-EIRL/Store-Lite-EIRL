CREATE TABLE "penalties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"penalty_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"percentage" numeric(5, 2),
	"product_value" numeric(10, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"payment_method" text,
	"payment_id" text,
	"order_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_order_id_payments_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_penalties_business_id" ON "penalties" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_penalties_order_id" ON "penalties" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_penalties_status" ON "penalties" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "idx_penalties_created_at" ON "penalties" USING btree ("created_at" DESC NULLS LAST);