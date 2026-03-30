ALTER TABLE "products" DROP CONSTRAINT "unique_product_slug";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "unique_business_product_slug" UNIQUE("business_id","slug");