CREATE TABLE "form_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_phone" text,
	"message_text" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sender_name_check" CHECK (char_length("form_messages"."sender_name") >= 2),
	CONSTRAINT "sender_email_check" CHECK ("form_messages"."sender_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
	CONSTRAINT "message_text_check" CHECK (char_length("form_messages"."message_text") >= 10 AND char_length("form_messages"."message_text") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "unique_business_category";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "sender_name_check";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "sender_email_check";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "message_text_check";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_business_id_businesses_id_fk";
--> statement-breakpoint
DROP INDEX "idx_messages_business_id";--> statement-breakpoint
DROP INDEX "idx_messages_is_read";--> statement-breakpoint
DROP INDEX "idx_categories_business_id_name";--> statement-breakpoint
DROP INDEX "idx_messages_created_at";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "is_read" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_from_store" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "form_messages" ADD CONSTRAINT "form_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_form_messages_business_id" ON "form_messages" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_form_messages_is_read" ON "form_messages" USING btree ("business_id","is_read") WHERE "form_messages"."is_read" = false;--> statement-breakpoint
CREATE INDEX "idx_form_messages_created_at" ON "form_messages" USING btree ("business_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_session_id" ON "messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "product_categories" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "sender_name";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "sender_email";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "sender_phone";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "message_text";--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "unique_business_category" UNIQUE("business_id","slug");