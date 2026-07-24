CREATE TYPE "public"."shipping_type" AS ENUM('agencia', 'domicilio');--> statement-breakpoint
CREATE TABLE "business_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" text NOT NULL,
	"code_hash" text NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "business_invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "business_slug_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_slug_aliases_slug_unique" UNIQUE("slug"),
	CONSTRAINT "business_slug_aliases_slug_format_check" CHECK (char_length("business_slug_aliases"."slug") >= 3 AND char_length("business_slug_aliases"."slug") <= 50 AND "business_slug_aliases"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "business_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"custom_permissions" jsonb,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invitation_id" uuid,
	CONSTRAINT "unique_business_user" UNIQUE("business_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "business_team_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_business_role" UNIQUE("business_id","role")
);
--> statement-breakpoint
ALTER TABLE "business_settings" ADD COLUMN "culqi_public_key" text;--> statement-breakpoint
ALTER TABLE "business_settings" ADD COLUMN "culqi_secret_key" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "order_number" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_type" "shipping_type";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_department" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_province" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_district" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_address" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_agency" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_reference" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_phone" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shipping_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_slug_aliases" ADD CONSTRAINT "business_slug_aliases_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_members" ADD CONSTRAINT "business_team_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_members" ADD CONSTRAINT "business_team_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_members" ADD CONSTRAINT "business_team_members_invitation_id_business_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."business_invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_team_roles" ADD CONSTRAINT "business_team_roles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_business_invitations_code" ON "business_invitations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_business_invitations_business_id" ON "business_invitations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_invitations_expires" ON "business_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_business_slug_aliases_business_id" ON "business_slug_aliases" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_slug_aliases_slug" ON "business_slug_aliases" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_business_slug_aliases_created_at" ON "business_slug_aliases" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_business_team_members_business_id" ON "business_team_members" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_team_members_user_id" ON "business_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_business_team_roles_business_id" ON "business_team_roles" USING btree ("business_id");