-- E4: One active chat session per (business, guest) — DB cleanup group E
-- Prefix 0039 continues the manual operator-style migration chain (highest applied
-- is 0038_messages_not_null.sql). The Drizzle journal chain does not track manual
-- operator SQL; using 0039 keeps the two naming families undisturbed.
--
-- ADDITIVE partial unique index — safe to apply on production via the Supabase
-- SQL editor or a future runner.
--
-- A read-only audit against the live production DB found ONE violating pair:
--   - SHALOM (2825d7fb) guest dni-74139985 had 3 active sessions.
-- The 2 duplicate empty shells (only the auto-welcome message) were closed in a
-- transaction on 2026-09-03, leaving exactly 1 active. All other (business, guest)
-- active pairs had 0 duplicates.
--
-- This matches the invariant the chat startSession logic (src/features/chat/
-- actions/chatActions.ts) already assumes and enforces: it reuses an existing
-- active session for (business, guest) instead of creating a new one.
--
-- Wrapped in DO blocks (PostgreSQL unique index has no IF NOT EXISTS) so re-runs
-- are idempotent.
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_sessions_active_per_guest
    ON chat_sessions (business_id, guest_id)
    WHERE status = 'active';
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;