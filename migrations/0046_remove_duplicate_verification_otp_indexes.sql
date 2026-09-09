-- Remove legacy duplicate indexes left by the verification_otps schema migration.
-- The idx_* indexes are the canonical definitions used by the current schema.
DROP INDEX IF EXISTS public.verification_otps_identifier_idx;
DROP INDEX IF EXISTS public.verification_otps_expires_at_idx;