-- =====================================================
-- MIGRATION: 0015_team_roles_permissions
-- =====================================================
-- Description: Team roles and permissions system
-- Created: 2026-04-06
-- =====================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BUSINESS TEAM ROLES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  permissions jsonb DEFAULT '[]',  -- Array de permisos, vacio = usar default
  is_default boolean DEFAULT false,  -- Si es el rol default para nuevos miembros
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT unique_business_role UNIQUE (business_id, role)
);

-- Index para buscar por negocio
CREATE INDEX IF NOT EXISTS idx_business_team_roles_business_id 
  ON business_team_roles (business_id);

COMMENT ON TABLE business_team_roles IS 'Definición de roles y permisos para miembros del equipo';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ADD ROLE COLUMN TO BUSINESS TEAM MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Agregar columna role si no existe (ya fue creada en 0014, solo verificamos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_team_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE business_team_members ADD COLUMN role text NOT NULL DEFAULT 'member';
  END IF;
  
  -- Agregar columna custom_permissions para overrides individuales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_team_members' AND column_name = 'custom_permissions'
  ) THEN
    ALTER TABLE business_team_members ADD COLUMN custom_permissions jsonb;
  END IF;
END $$;

COMMENT ON COLUMN business_team_members.role IS 'Rol del miembro: owner, admin, member';
COMMENT ON COLUMN business_team_members.custom_permissions IS 'Permisos personalizados que override al rol';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INSERT DEFAULT ROLES FOR EXISTING BUSINESSES
-- ─────────────────────────────────────────────────────────────────────────────

-- Para negocios existentes, crear roles por defecto
INSERT INTO business_team_roles (business_id, role, permissions, is_default)
SELECT 
  id,
  'member',
  -- Permisos por defecto para miembro
  '[
    "products.view",
    "products.create",
    "products.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "storefront.edit",
    "seo.edit",
    "chat.view",
    "chat.respond",
    "dashboard.view",
    "storage.upload",
    "home.edit"
  ]'::jsonb,
  true
FROM businesses
WHERE NOT EXISTS (
  SELECT 1 FROM business_team_roles 
  WHERE business_team_roles.business_id = businesses.id 
  AND business_team_roles.role = 'member'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTION: Get default permissions for role
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_default_role_permissions(p_role text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  CASE p_role
    WHEN 'owner' THEN
      result := '[
        "products.view", "products.create", "products.edit", "products.delete",
        "categories.view", "categories.create", "categories.edit", "categories.delete",
        "storefront.edit", "seo.edit",
        "chat.view", "chat.respond",
        "dashboard.view",
        "storage.upload", "storage.delete",
        "home.edit",
        "business.edit", "business.delete",
        "team.manage", "team.invite",
        "plan.view", "plan.change",
        "contact.edit", "legal.edit"
      ]'::jsonb;
    
    WHEN 'admin' THEN
      result := '[
        "products.view", "products.create", "products.edit", "products.delete",
        "categories.view", "categories.create", "categories.edit", "categories.delete",
        "storefront.edit", "seo.edit",
        "chat.view", "chat.respond",
        "dashboard.view",
        "storage.upload", "storage.delete",
        "home.edit",
        "team.manage", "team.invite"
      ]'::jsonb;
    
    WHEN 'member' THEN
      result := '[
        "products.view", "products.create", "products.edit",
        "categories.view", "categories.create", "categories.edit",
        "storefront.edit", "seo.edit",
        "chat.view", "chat.respond",
        "dashboard.view",
        "storage.upload",
        "home.edit"
      ]'::jsonb;
    
    ELSE
      result := '[]'::jsonb;
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_default_role_permissions IS 'Retorna los permisos por defecto para cada rol';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. HELPER FUNCTION: Get effective permissions for a member
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_member_permissions(
  p_business_id uuid,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_role text;
  v_custom jsonb;
  v_role_permissions jsonb;
  v_business_role_permissions jsonb;
  result jsonb;
BEGIN
  -- Verificar si es owner
  IF EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id AND owner_id = p_user_id
  ) THEN
    RETURN get_default_role_permissions('owner');
  END IF;
  
  -- Obtener rol y permisos custom del miembro
  SELECT tm.role, tm.custom_permissions
  INTO v_role, v_custom
  FROM business_team_members tm
  WHERE tm.business_id = p_business_id AND tm.user_id = p_user_id;
  
  IF v_role IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Si tiene permisos custom, usarlos (merge con defaults)
  IF v_custom IS NOT NULL AND jsonb_array_length(v_custom) > 0 THEN
    v_role_permissions := get_default_role_permissions(v_role);
    result := (
      SELECT jsonb_agg(value) 
      FROM jsonb_array_elements_text(v_role_permissions) AS perm
      WHERE perm IN (SELECT value FROM jsonb_array_elements_text(v_custom))
    );
    RETURN COALESCE(result, '[]'::jsonb);
  END IF;
  
  -- Verificar si hay permisos custom definidos en business_team_roles
  SELECT permissions INTO v_business_role_permissions
  FROM business_team_roles
  WHERE business_id = p_business_id AND role = v_role;
  
  IF v_business_role_permissions IS NOT NULL AND jsonb_array_length(v_business_role_permissions) > 0 THEN
    RETURN v_business_role_permissions;
  END IF;
  
  -- Usar permisos por defecto del rol
  RETURN get_default_role_permissions(v_role);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_member_permissions IS 'Retorna los permisos efectivos de un miembro';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTION: Check if user has specific permission
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_member_permission(
  p_business_id uuid,
  p_user_id uuid,
  p_permission text
)
RETURNS boolean AS $$
DECLARE
  v_permissions jsonb;
BEGIN
  v_permissions := get_member_permissions(p_business_id, p_user_id);
  RETURN p_permission = ANY (SELECT jsonb_array_elements_text(v_permissions));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_member_permission IS 'Verifica si un miembro tiene un permiso específico';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TRIGGER: Update updated_at on business_team_roles
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_business_team_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_team_roles_updated_at 
ON business_team_roles;

CREATE TRIGGER update_business_team_roles_updated_at
  BEFORE UPDATE ON business_team_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_team_roles_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS POLICIES FOR NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on business_team_roles
ALTER TABLE business_team_roles ENABLE ROW LEVEL SECURITY;

-- Owner can view and manage roles
DROP POLICY IF EXISTS "owner_can_manage_roles" ON business_team_roles;
CREATE POLICY "owner_can_manage_roles"
  ON business_team_roles FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Members can view roles (for permission checks)
DROP POLICY IF EXISTS "members_can_view_roles" ON business_team_roles;
CREATE POLICY "members_can_view_roles"
  ON business_team_roles FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

-- RLS updates for business_team_members (role column)
-- Members can view their own role
DROP POLICY IF EXISTS "member_can_view_own_role" ON business_team_members;
CREATE POLICY "member_can_view_own_role"
  ON business_team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR business_id IN (
      SELECT business_id FROM business_team_members WHERE user_id = auth.uid()
    )
  );

-- Owner can update member roles
DROP POLICY IF EXISTS "owner_can_update_member_roles" ON business_team_members;
CREATE POLICY "owner_can_update_member_roles"
  ON business_team_members FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
