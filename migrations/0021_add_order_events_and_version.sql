-- Migration 0021: Add order_events table and version column to payments
-- Run this directly in Supabase SQL Editor

-- 1. Add version column to payments for optimistic locking
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- 2. Create order_events table for audit trail
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  triggered_by TEXT,  -- 'customer', 'seller', 'system'
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_events_payment_id ON order_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_events(created_at DESC);

-- 4. Backfill version column for existing records (set all to 0)
UPDATE payments SET version = 0 WHERE version IS NULL;
