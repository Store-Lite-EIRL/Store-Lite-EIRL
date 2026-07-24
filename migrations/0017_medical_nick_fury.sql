CREATE TABLE "payment_idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_payment_idempotency_keys_status" ON "payment_idempotency_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_idempotency_keys_created_at" ON "payment_idempotency_keys" USING btree ("created_at" DESC NULLS LAST);