ALTER TABLE "business_slug_aliases" DROP CONSTRAINT "business_slug_aliases_slug_format_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "name_length_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "slug_format_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "description_length_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "whatsapp_format_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "payment_flow_length_check";--> statement-breakpoint
ALTER TABLE "form_messages" DROP CONSTRAINT "sender_name_check";--> statement-breakpoint
ALTER TABLE "form_messages" DROP CONSTRAINT "sender_email_check";--> statement-breakpoint
ALTER TABLE "form_messages" DROP CONSTRAINT "message_text_check";--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "category_name_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "title_length_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "description_length_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "price_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "stock_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "currency_check";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "age_check";--> statement-breakpoint
ALTER TABLE "saas_issuer_config" DROP CONSTRAINT "saas_issuer_singleton";