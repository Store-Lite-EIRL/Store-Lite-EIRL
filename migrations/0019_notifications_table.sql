-- =====================================================
-- MIGRATION: notifications_table
-- Created: 2026-04-22
-- =====================================================

-- Create notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'message_new',
    'message_unread',
    'stock_low',
    'stock_out',
    'plan_expiring',
    'plan_expired',
    'plan_upgraded',
    'order_created',
    'order_status_changed',
    'order_shipped',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification category enum
DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM (
    'chat',
    'almacen',
    'plan',
    'pedidos',
    'sistema'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  category notification_category NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false NOT NULL,
  is_dismissed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_created ON notifications(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(business_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(business_id, is_read) WHERE is_read = false AND is_dismissed = false;

-- Add RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: business members can view their business notifications
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (business_id IN (
    SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
  ));

-- RLS Policy: business members can insert their business notifications
CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (business_id IN (
    SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
  ));

-- RLS Policy: business members can update their business notifications
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (business_id IN (
    SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
  ));

-- RLS Policy: business members can delete their business notifications
CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (business_id IN (
    SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
  ));