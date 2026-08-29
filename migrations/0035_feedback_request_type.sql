-- =====================================================
-- FEEDBACK SYSTEM - Add request_type column
-- =====================================================
-- Adds support_type enum and request_type column to feedback_tickets.
-- Types: support (ayuda), feedback (bugs/sugerencias), complaint (queja)
-- =====================================================

-- ── New enum ──

CREATE TYPE "feedback_request_type" AS ENUM ('support', 'feedback', 'complaint');

-- ── Add column to feedback_tickets ──

ALTER TABLE "feedback_tickets" ADD COLUMN "request_type" "feedback_request_type" NOT NULL DEFAULT 'feedback';

-- ── Update existing tickets based on category ──

UPDATE "feedback_tickets" SET "request_type" = 'feedback' WHERE "category" IN ('bug', 'suggestion');
UPDATE "feedback_tickets" SET "request_type" = 'support' WHERE "category" = 'question';
UPDATE "feedback_tickets" SET "request_type" = 'complaint' WHERE "category" = 'other';

-- ── Index ──

CREATE INDEX "idx_ft_request_type" ON "feedback_tickets" ("request_type");
