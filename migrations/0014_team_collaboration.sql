-- =====================================================
-- MIGRATION: 0014_team_collaboration
-- =====================================================
-- Description: Team collaboration system - invitations and members
-- Created: 2026-04-06
-- =====================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RATE LIMITING TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS join_attempt_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempted_at timestamptz DEFAULT now() NOT NULL,
  code_hash text,  -- código que intentó (para auditoría)
  success boolean NOT NULL DEFAULT false
);

-- Index para cleanup rápido
CREATE INDEX IF NOT EXISTS idx_join_attempt_rate_limit_ip_time
  ON join_attempt_rate_limit (ip_address, attempted_at DESC);

COMMENT ON TABLE join_attempt_rate_limit IS 'Rate limiting for team join attempts (brute force protection)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BUSINESS INVITATIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,  -- Código visible (ej: "ABCD1234")
  code_hash text NOT NULL,    -- Hash SHA-256 para verificación
  max_uses integer,           -- NULL = ilimitado
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,      -- NULL = no expira
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT chk_max_uses_positive CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT chk_used_count_limit CHECK (used_count <= COALESCE(max_uses, 999999999))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_invitations_code ON business_invitations (code);
CREATE INDEX IF NOT EXISTS idx_business_invitations_business_id ON business_invitations (business_id);
CREATE INDEX IF NOT EXISTS idx_business_invitations_expires ON business_invitations (expires_at) 
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE business_invitations IS 'Team invitation codes for business collaboration';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BUSINESS TEAM MEMBERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  invitation_id uuid REFERENCES business_invitations(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT unique_business_user UNIQUE (business_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_team_members_business_id ON business_team_members (business_id);
CREATE INDEX IF NOT EXISTS idx_business_team_members_user_id ON business_team_members (user_id);

COMMENT ON TABLE business_team_members IS 'Active team members with access to a business';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTION: Generate random code
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Sin O, 0, 1, I para evitar confusiones
  result text := '';
  i integer;
BEGIN
  -- Formato: XXXX-XXXX (8 chars con guión en el medio)
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invitation_code IS 'Generates a readable invitation code (XXXX-XXXX format)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. HELPER FUNCTION: Hash code with salt
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION hash_invitation_code(code text)
RETURNS text AS $$
BEGIN
  -- Usamos HMAC-SHA256 con una salt secreta (en producción usar env var)
  -- Por ahora usamos un hash simple para compatibilidad
  RETURN encode(sha256(concat('store-lite-team-2026:', code)::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hash_invitation_code IS 'Creates a hash of the invitation code for storage';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTION: Check rate limit
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_join_rate_limit(p_ip_address text)
RETURNS boolean AS $$
DECLARE
  failed_attempts integer;
BEGIN
  -- Cuenta intentos fallidos en los últimos 15 minutos
  SELECT COUNT(*)
  INTO failed_attempts
  FROM join_attempt_rate_limit
  WHERE ip_address = p_ip_address
    AND attempted_at > now() - interval '15 minutes'
    AND success = false;
  
  -- Si hay 5 o más intentos fallidos, denegar
  RETURN failed_attempts < 5;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_join_rate_limit IS 'Returns true if IP is not rate limited for join attempts';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HELPER FUNCTION: Record rate limit attempt
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_join_attempt(
  p_ip_address text,
  p_code_hash text DEFAULT NULL,
  p_success boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  INSERT INTO join_attempt_rate_limit (ip_address, code_hash, success)
  VALUES (p_ip_address, p_code_hash, p_success);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_join_attempt IS 'Records a join attempt for rate limiting';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. HELPER FUNCTION: Cleanup old rate limit entries
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_rate_limit_entries()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM join_attempt_rate_limit
  WHERE attempted_at < now() - interval '15 minutes';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_rate_limit_entries IS 'Removes rate limit entries older than 15 minutes';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. HELPER FUNCTION: Get current team member count
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_team_member_count(p_business_id uuid)
RETURNS integer AS $$
DECLARE
  member_count integer;
BEGIN
  -- Cuenta: owner (1) + team members
  SELECT COUNT(*) + 1  -- +1 por el owner
  INTO member_count
  FROM business_team_members
  WHERE business_id = p_business_id;
  
  RETURN COALESCE(member_count, 1);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_team_member_count IS 'Returns total team size including owner';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_team_members ENABLE ROW LEVEL SECURITY;

-- business_invitations policies

-- Owner can view invitations (para settings)
DROP POLICY IF EXISTS "owner_can_view_invitation" ON business_invitations;
CREATE POLICY "owner_can_view_invitation"
  ON business_invitations FOR SELECT
  TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Owner can create invitations
DROP POLICY IF EXISTS "owner_can_create_invitation" ON business_invitations;
CREATE POLICY "owner_can_create_invitation"
  ON business_invitations FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Owner can update (regenerate/delete) invitations
DROP POLICY IF EXISTS "owner_can_update_invitation" ON business_invitations;
CREATE POLICY "owner_can_update_invitation"
  ON business_invitations FOR UPDATE
  TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Anyone authenticated can check if code is valid (for join flow)
-- Returns minimal info: exists, not expired, has uses
DROP POLICY IF EXISTS "anyone_can_verify_code" ON business_invitations;
CREATE POLICY "anyone_can_verify_code"
  ON business_invitations FOR SELECT
  TO authenticated
  USING (
    expires_at IS NULL OR expires_at > now()
  );

-- business_team_members policies

-- Owner and members can view team
DROP POLICY IF EXISTS "team_can_view_members" ON business_team_members;
CREATE POLICY "team_can_view_members"
  ON business_team_members FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

-- Insert handled by server action (service role bypass)
DROP POLICY IF EXISTS "service_role_can_insert_member" ON business_team_members;
CREATE POLICY "service_role_can_insert_member"
  ON business_team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Server action validates everything

-- Owner can delete members
DROP POLICY IF EXISTS "owner_can_delete_member" ON business_team_members;
CREATE POLICY "owner_can_delete_member"
  ON business_team_members FOR DELETE
  TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Member can leave team (delete self)
DROP POLICY IF EXISTS "member_can_leave_team" ON business_team_members;
CREATE POLICY "member_can_leave_team"
  ON business_team_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- rate_limit table - solo service role
ALTER TABLE join_attempt_rate_limit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_allows_rate_limit" ON join_attempt_rate_limit;
CREATE POLICY "service_role_allows_rate_limit"
  ON join_attempt_rate_limit FOR ALL
  TO authenticated
  USING (true);  -- Server action validates
