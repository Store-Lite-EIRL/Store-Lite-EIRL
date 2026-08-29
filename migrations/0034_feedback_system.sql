-- =====================================================
-- FEEDBACK SYSTEM - Tables: feedback_tickets, feedback_responses
-- =====================================================
-- Seller feedback system for Store Lite support.
-- Priority based on plan: enterprise_pro = high, others = normal.
-- =====================================================

-- ── Enums ──

CREATE TYPE "feedback_category" AS ENUM ('bug', 'suggestion', 'question', 'other');
CREATE TYPE "feedback_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "feedback_priority" AS ENUM ('low', 'normal', 'high');
CREATE TYPE "feedback_sender_type" AS ENUM ('user', 'admin');

-- ── Table: feedback_tickets ──

CREATE TABLE "feedback_tickets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "ticket_number" text NOT NULL UNIQUE,
    "category" "feedback_category" NOT NULL,
    "subject" text NOT NULL,
    "message" text NOT NULL,
    "status" "feedback_status" NOT NULL DEFAULT 'open',
    "priority" "feedback_priority" NOT NULL DEFAULT 'normal',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for feedback_tickets
CREATE INDEX "idx_ft_business_id" ON "feedback_tickets" ("business_id");
CREATE INDEX "idx_ft_user_id" ON "feedback_tickets" ("user_id");
CREATE INDEX "idx_ft_status" ON "feedback_tickets" ("status");
CREATE INDEX "idx_ft_ticket_number" ON "feedback_tickets" ("ticket_number");
CREATE INDEX "idx_ft_created_at" ON "feedback_tickets" ("created_at" DESC);

-- ── Table: feedback_responses ──

CREATE TABLE "feedback_responses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticket_id" uuid NOT NULL REFERENCES "feedback_tickets"("id") ON DELETE CASCADE,
    "sender_type" "feedback_sender_type" NOT NULL,
    "message" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for feedback_responses
CREATE INDEX "idx_fr_ticket_id" ON "feedback_responses" ("ticket_id");
CREATE INDEX "idx_fr_created_at" ON "feedback_responses" ("created_at");

-- ── RLS Policies ──

ALTER TABLE "feedback_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback_responses" ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets
CREATE POLICY "feedback_tickets_select_own"
    ON "feedback_tickets"
    FOR SELECT
    TO authenticated
    USING (auth.uid() = "user_id");

-- Users can insert tickets for their businesses
CREATE POLICY "feedback_tickets_insert_own"
    ON "feedback_tickets"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = "user_id");

-- Users can read responses to their tickets
CREATE POLICY "feedback_responses_select_own"
    ON "feedback_responses"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "feedback_tickets"
            WHERE "feedback_tickets"."id" = "feedback_responses"."ticket_id"
            AND "feedback_tickets"."user_id" = auth.uid()
        )
    );

-- Admin (service role) can do everything - bypass RLS
-- The server actions use service_role key to bypass RLS
