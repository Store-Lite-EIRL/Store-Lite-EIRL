-- E5: Enforce NOT NULL on messages.is_from_store, messages.is_read (DB debt group E)
-- Production pre-validated: 0 NULL rows in both columns.
-- Sets DEFAULT false + NOT NULL so ORM semantics match exactly.
-- Idempotent via duplicate_object guard (Postgres lacks IF NOT EXISTS on ALTER COLUMN).

DO $$
BEGIN
  ALTER TABLE messages ALTER COLUMN is_from_store SET DEFAULT false;
  ALTER TABLE messages ALTER COLUMN is_from_store SET NOT NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE messages ALTER COLUMN is_read SET DEFAULT false;
  ALTER TABLE messages ALTER COLUMN is_read SET NOT NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
