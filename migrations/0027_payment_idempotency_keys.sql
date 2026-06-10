CREATE TABLE IF NOT EXISTS "payment_idempotency_keys" (
  "key" text PRIMARY KEY,
  "status" text NOT NULL DEFAULT 'processing',
  "response_status" integer,
  "response_body" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_payment_idempotency_keys_status"
  ON "payment_idempotency_keys" USING btree ("status");

CREATE INDEX IF NOT EXISTS "idx_payment_idempotency_keys_created_at"
  ON "payment_idempotency_keys" USING btree ("created_at" DESC NULLS LAST);
