DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE n.nspname = 'public' AND t.typname = 'notification_category'
	) THEN
		CREATE TYPE "public"."notification_category" AS ENUM('chat', 'almacen', 'plan', 'pedidos', 'sistema');
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE n.nspname = 'public' AND t.typname = 'notification_type'
	) THEN
		CREATE TYPE "public"."notification_type" AS ENUM('message_new', 'message_unread', 'stock_low', 'stock_out', 'plan_expiring', 'plan_expired', 'plan_upgraded', 'order_created', 'order_status_changed', 'order_shipped', 'system');
	END IF;
END
$$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"category" "notification_category" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "plan_payments" ALTER COLUMN "ticket_correlative" DROP DEFAULT;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'notifications_business_id_businesses_id_fk'
	) THEN
		ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END
$$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_business_id" ON "notifications" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_business_created" ON "notifications" USING btree ("business_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_unread" ON "notifications" USING btree ("business_id","is_read") WHERE "notifications"."is_read" = false AND "notifications"."is_dismissed" = false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_category" ON "notifications" USING btree ("business_id","category");--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'unique_business_subscription'
	) THEN
		ALTER TABLE "business_subscriptions" ADD CONSTRAINT "unique_business_subscription" UNIQUE("business_id");
	END IF;
END
$$;
