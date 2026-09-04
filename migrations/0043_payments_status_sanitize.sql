-- =====================================================
-- MIGRATION: 0043_payments_status_sanitize
-- =====================================================
-- Description: Sanitize invalid values in payments.status (the column is
--              plain text, not an enum). Audit (2026-09, dev DB) found 3
--              values outside the legacy + V2 unions, written by an
--              un-gated path (free-text status writes):
--                'aceptado'    -> 'paid'      (3 rows, dev)
--                'analizando'  -> 'validando' (2 rows, dev)
--                'pendiente'   -> 'pending'   (1 row,  dev)
--
--   These are Spanish synonyms for the legitimate statuses. No schema change
--   here: A5's enum conversion of payments.status is BLOCKED until the
--   payment pipeline (charge/route.ts + culqi webhooks) is normalized to V2
--   uppercase — that is a separate A5b code+migration task.
--
--   This migration is a pure DATA sanitization (UPDATE), safe, idempotent
--   (no-op when no matching rows). Apply to BOTH dev and prod (prod has 0
--   rows today, so it is a silent no-op there).
--
--   Apply via operator to both environments:
--     node scripts/apply-migration.mjs migrations/0043_...sql
--     or paste into Supabase SQL editor (dev then prod).
-- =====================================================

-- Step 1: Map invalid Spanish-synonym statuses to their canonical values.
UPDATE "public"."payments"
SET    "status" = 'paid'
WHERE  "status" = 'aceptado';
--> statement-breakpoint

UPDATE "public"."payments"
SET    "status" = 'validando'
WHERE  "status" = 'analizando';
--> statement-breakpoint

UPDATE "public"."payments"
SET    "status" = 'pending'
WHERE  "status" = 'pendiente';
--> statement-breakpoint
