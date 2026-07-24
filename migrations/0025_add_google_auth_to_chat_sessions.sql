-- =====================================================
-- MIGRATION 0025: Add Google Auth support to chat_sessions
-- =====================================================
-- Description: Adds columns for Google-authenticated chat
-- users. Deletes old anonymous chat data (the new flow
-- requires Google auth).
-- =====================================================

-- 1. Delete all existing chat sessions (they use the old anonymous system)
--    This cascades to messages automatically.
DELETE FROM chat_sessions;

-- 2. Add new columns for Google-authenticated users
ALTER TABLE chat_sessions
  ADD COLUMN auth_user_id uuid,
  ADD COLUMN guest_email text,
  ADD COLUMN guest_avatar_url text;

-- 3. Make guest_gender optional (no longer required for Google auth)
ALTER TABLE chat_sessions
  ALTER COLUMN guest_gender SET DEFAULT '';

-- 4. Create index on auth_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_auth_user_id
  ON chat_sessions (auth_user_id);
