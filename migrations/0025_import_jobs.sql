-- =====================================================
-- MIGRATION: 0025_import_jobs
-- =====================================================
-- Description: Adds external_code to products, creates
-- import_jobs and import_rows tables for async import.
-- =====================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ADD external_code TO PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS external_code text;

COMMENT ON COLUMN products.external_code IS 'Código externo del producto (proveedor, SKU, etc.)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE import_job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE import_row_status AS ENUM ('pending', 'processing', 'completed', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE import_jobs TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status        import_job_status NOT NULL DEFAULT 'pending',
  total_rows    integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  error_rows    integer NOT NULL DEFAULT 0,
  file_name     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_business_id ON import_jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE import_rows TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_rows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number    integer NOT NULL,
  status        import_row_status NOT NULL DEFAULT 'pending',
  raw_data      jsonb DEFAULT '{}',
  product_id    uuid REFERENCES products(id) ON DELETE SET NULL,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_import_rows_job_id ON import_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON import_rows(status);
CREATE INDEX IF NOT EXISTS idx_import_rows_job_status ON import_rows(job_id, status);

COMMENT ON TABLE import_jobs IS 'Trabajos de importación asincrónica de productos desde Excel';
COMMENT ON TABLE import_rows IS 'Filas individuales de un trabajo de importación';
