-- =====================================================
-- MIGRATION: 0024_add_business_location_fields
-- =====================================================
-- Description: Adds departamento, provincia, distrito columns
-- to the businesses table for structured location data.
-- These fields are sourced from SUNAT/Factiliza during
-- business creation and used for Google Maps embeds.
-- =====================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ADD LOCATION COLUMNS TO BUSINESSES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS provincia text,
  ADD COLUMN IF NOT EXISTS distrito text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BACKFILL: Parse existing address field into structured columns
--    where address follows the pattern "Departamento, Provincia, Distrito"
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE businesses
SET
  departamento = SPLIT_PART(address, ', ', 1),
  provincia    = SPLIT_PART(address, ', ', 2),
  distrito     = SPLIT_PART(address, ', ', 3)
WHERE
  departamento IS NULL
  AND address IS NOT NULL
  AND address LIKE '%, %, %';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COMMENTS
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN businesses.departamento IS 'Departamento (from SUNAT/Factiliza RUC verification)';
COMMENT ON COLUMN businesses.provincia IS 'Provincia (from SUNAT/Factiliza RUC verification)';
COMMENT ON COLUMN businesses.distrito IS 'Distrito (from SUNAT/Factiliza RUC verification)';
