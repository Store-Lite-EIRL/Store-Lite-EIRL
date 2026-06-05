CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'expired', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'pago_efectivo';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'billetera_movil';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'cuotealo';--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"culqi_order_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text NOT NULL,
	"payment_code" text,
	"qr_url" text,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"expiration_date" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_culqi_order_id_unique" UNIQUE("culqi_order_id")
);
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payment_orders_culqi_order_id" ON "payment_orders" USING btree ("culqi_order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_business_id" ON "payment_orders" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_status" ON "payment_orders" USING btree ("status");