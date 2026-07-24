CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."import_row_status" AS ENUM('pending', 'processing', 'completed', 'error');--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'validando' BEFORE 'not_delivered';--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'en_reparto' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'esperando_confirmacion' BEFORE 'completed';--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"status" "import_job_status" DEFAULT 'pending' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"file_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"status" "import_row_status" DEFAULT 'pending' NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb,
	"product_id" uuid,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"triggered_by" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"code_hash" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "guest_gender" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "guest_gender" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_payments" ALTER COLUMN "ticket_correlative" SET DEFAULT nextval('seq_plan_payment_b001');--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "departamento" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "provincia" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "distrito" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "verification_status" text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "verification_data" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "payment_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "guest_email" text;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "guest_avatar_url" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "external_code" text;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_job_id_import_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_import_jobs_business_id" ON "import_jobs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_status" ON "import_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_import_rows_job_id" ON "import_rows" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_import_rows_status" ON "import_rows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_import_rows_job_status" ON "import_rows" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "idx_order_events_payment_id" ON "order_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_order_events_created_at" ON "order_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "verification_otps_identifier_idx" ON "verification_otps" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_otps_expires_at_idx" ON "verification_otps" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_payment_id" ON "chat_sessions" USING btree ("payment_id");