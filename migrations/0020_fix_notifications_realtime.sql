-- =====================================================
-- MIGRATION: fix_notifications_realtime
-- Created: 2026-04-23
-- Purpose:
--   1) Ensure business owners can read notification rows via RLS
--   2) Version Realtime publication membership for notifications/chat tables
-- =====================================================

-- Rebuild notifications RLS policies so owners and team members are covered.
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
DROP POLICY IF EXISTS notifications_delete ON notifications;

CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

-- Ensure Postgres Changes can see these tables through supabase_realtime publication.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'chat_sessions'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions';
    END IF;
  ELSE
    RAISE NOTICE 'Publication supabase_realtime does not exist. Configure Realtime before applying postgres_changes subscriptions.';
  END IF;
END $$;
