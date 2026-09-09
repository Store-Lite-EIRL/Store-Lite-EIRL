-- Remove legacy duplicate indexes left by the verification_otps schema migration.
-- Ensure the canonical indexes exist before removing legacy names. Some environments
-- had only the legacy indexes, so dropping them first would leave OTP lookups unindexed.
CREATE INDEX IF NOT EXISTS idx_verification_otps_identifier
	ON public.verification_otps (identifier);

CREATE INDEX IF NOT EXISTS idx_verification_otps_expires_at
	ON public.verification_otps (expires_at);

DROP INDEX IF EXISTS public.verification_otps_identifier_idx;
DROP INDEX IF EXISTS public.verification_otps_expires_at_idx;