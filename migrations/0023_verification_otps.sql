-- =====================================================
-- MIGRATION: 0023_verification_otps
-- =====================================================
-- Description: Creates verification_otps table for OTP code storage
-- Used by: KYB phone verification flow (Twilio WhatsApp OTP)
-- NOTA: code_hash almacena HMAC-SHA256 del código OTP
--       NUNCA se almacena el código en texto plano.
-- =====================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VERIFICATION OTPS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verification_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,          -- phone number or email
  code_hash text NOT NULL,           -- HMAC-SHA256 hash of the OTP code
  type text NOT NULL CHECK (type IN ('phone', 'email')),
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for looking up OTPs by identifier (phone number)
CREATE INDEX IF NOT EXISTS idx_verification_otps_identifier
  ON verification_otps (identifier);

-- Index for cleaning up expired OTPs
CREATE INDEX IF NOT EXISTS idx_verification_otps_expires_at
  ON verification_otps (expires_at);

COMMENT ON TABLE verification_otps IS 'Almacena códigos OTP hasheados para verificación telefónica vía WhatsApp';
COMMENT ON COLUMN verification_otps.code_hash IS 'OTP hasheado con HMAC-SHA256 — nunca se almacena en texto plano';
COMMENT ON COLUMN verification_otps.identifier IS 'Número de teléfono (sin prefijo) o email';
