-- Migration: Add 'validando' to payment_status enum
-- Description: Adds the new status 'validando' for ticket validation step

DO $$
BEGIN
  -- Check if the value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_status' AND e.enumlabel = 'validando'
  ) THEN
    ALTER TYPE payment_status ADD VALUE 'validando';
  END IF;
END
$$;
