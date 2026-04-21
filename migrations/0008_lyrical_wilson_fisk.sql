CREATE SEQUENCE IF NOT EXISTS seq_plan_payment_b001 START 1 INCREMENT 1 NO MAXVALUE;--> statement-breakpoint
CREATE TYPE "public"."plan_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'disputed');--> statement-breakpoint
ALTER TYPE "public"."shipping_type" ADD VALUE 'recojo';--> statement-breakpoint
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
	"ticket_correlative" integer DEFAULT nextval('seq_plan_payment_b001') NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saas_issuer_singleton" CHECK ("saas_issuer_config"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "ticket_url" text;--> statement-breakpoint
ALTER TABLE "plan_payments" ADD CONSTRAINT "plan_payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_plan_payments_business_id" ON "plan_payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_status" ON "plan_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_culqi_charge" ON "plan_payments" USING btree ("culqi_charge_id");--> statement-breakpoint
CREATE INDEX "idx_plan_payments_ticket_issued" ON "plan_payments" USING btree ("ticket_issued_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_plan_payments_created_at" ON "plan_payments" USING btree ("created_at" DESC NULLS LAST);