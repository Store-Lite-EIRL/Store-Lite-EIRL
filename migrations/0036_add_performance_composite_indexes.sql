-- E3: Performance composite indexes (DB debt group E)
-- Prefix 0036 chosen because the manual operator-style migration chain on disk
-- reaches 0035 (0035_feedback_request_type.sql). The Drizzle journal chain
-- ends at 0023 and does not track manual operator SQL. Using 0036 continues
-- the highest existing manual prefix by +1, keeping the two naming families
-- undisturbed.
--
-- These indexes are ADDITIVE only and safe to apply on production via
-- Supabase SQL editor or a future runner. CONCURRENTLY avoids table locks.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_business_updated
  ON products (business_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_session_created
  ON messages (session_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_business_status_created
  ON chat_sessions (business_id, status, created_at DESC);
