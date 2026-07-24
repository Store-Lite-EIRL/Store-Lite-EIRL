-- ============================================================================
-- RLS POLICIES — Store Lite
-- ============================================================================
-- Ejecutar en Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. CREAR FUNCIONES HELPER (antes del DO block, sin anidar $$)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_business_owner(business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = business_id AND owner_id = auth.uid()
  );
$func$;

CREATE OR REPLACE FUNCTION public.is_business_member(business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = business_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.business_team_members
    WHERE business_id = business_id AND user_id = auth.uid()
  );
$func$;

-- ============================================================================
-- 2. HABILITAR RLS Y CREAR POLÍTICAS
-- ============================================================================

DO $do$
DECLARE
  policy_count integer := 0;
  tbl text;
BEGIN

  -- Habilitar RLS en todas las tablas existentes
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations', 'schema_migrations', 'spatial_ref_sys')
      AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    RAISE NOTICE '✅ RLS enabled: %', tbl;
  END LOOP;

  -- profiles
  CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
  CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
  CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
  CREATE POLICY IF NOT EXISTS "profiles_delete_own" ON public.profiles FOR DELETE USING (id = auth.uid());
  policy_count := policy_count + 4;

  -- businesses
  CREATE POLICY IF NOT EXISTS "businesses_select_public" ON public.businesses FOR SELECT USING (is_active = true);
  CREATE POLICY IF NOT EXISTS "businesses_select_owner" ON public.businesses FOR SELECT USING (owner_id = auth.uid());
  CREATE POLICY IF NOT EXISTS "businesses_select_member" ON public.businesses FOR SELECT USING (public.is_business_member(id));
  CREATE POLICY IF NOT EXISTS "businesses_insert" ON public.businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
  CREATE POLICY IF NOT EXISTS "businesses_update" ON public.businesses FOR UPDATE USING (owner_id = auth.uid());
  CREATE POLICY IF NOT EXISTS "businesses_delete" ON public.businesses FOR DELETE USING (owner_id = auth.uid());
  policy_count := policy_count + 6;

  -- business_slug_aliases
  CREATE POLICY IF NOT EXISTS "slug_aliases_select" ON public.business_slug_aliases FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "slug_aliases_insert" ON public.business_slug_aliases FOR INSERT WITH CHECK (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "slug_aliases_update" ON public.business_slug_aliases FOR UPDATE USING (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "slug_aliases_delete" ON public.business_slug_aliases FOR DELETE USING (public.is_business_owner(business_id));
  policy_count := policy_count + 4;

  -- form_messages
  CREATE POLICY IF NOT EXISTS "form_messages_select" ON public.form_messages FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "form_messages_insert" ON public.form_messages FOR INSERT WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "form_messages_update" ON public.form_messages FOR UPDATE USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "form_messages_delete" ON public.form_messages FOR DELETE USING (public.is_business_member(business_id));
  policy_count := policy_count + 4;

  -- business_subscriptions
  CREATE POLICY IF NOT EXISTS "subscriptions_select" ON public.business_subscriptions FOR SELECT USING (public.is_business_member(business_id));
  policy_count := policy_count + 1;

  -- business_settings
  CREATE POLICY IF NOT EXISTS "settings_select" ON public.business_settings FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "settings_insert" ON public.business_settings FOR INSERT WITH CHECK (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "settings_update" ON public.business_settings FOR UPDATE USING (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "settings_delete" ON public.business_settings FOR DELETE USING (public.is_business_owner(business_id));
  policy_count := policy_count + 4;

  -- product_categories
  CREATE POLICY IF NOT EXISTS "categories_select" ON public.product_categories FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "categories_insert" ON public.product_categories FOR INSERT WITH CHECK (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "categories_update" ON public.product_categories FOR UPDATE USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "categories_delete" ON public.product_categories FOR DELETE USING (public.is_business_member(business_id));
  policy_count := policy_count + 4;

  -- products
  CREATE POLICY IF NOT EXISTS "products_select_public" ON public.products FOR SELECT USING (is_available = true);
  CREATE POLICY IF NOT EXISTS "products_select_admin" ON public.products FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "products_insert" ON public.products FOR INSERT WITH CHECK (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "products_update" ON public.products FOR UPDATE USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "products_delete" ON public.products FOR DELETE USING (public.is_business_member(business_id));
  policy_count := policy_count + 5;

  -- product_media
  CREATE POLICY IF NOT EXISTS "product_media_select" ON public.product_media FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "product_media_insert" ON public.product_media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND public.is_business_member(business_id))
  );
  CREATE POLICY IF NOT EXISTS "product_media_update" ON public.product_media FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND public.is_business_member(business_id))
  );
  CREATE POLICY IF NOT EXISTS "product_media_delete" ON public.product_media FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND public.is_business_member(business_id))
  );
  policy_count := policy_count + 4;

  -- product_likes
  CREATE POLICY IF NOT EXISTS "product_likes_select" ON public.product_likes FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "product_likes_insert" ON public.product_likes FOR INSERT WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "product_likes_delete" ON public.product_likes FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND public.is_business_member(business_id))
  );
  policy_count := policy_count + 3;

  -- chat_sessions
  CREATE POLICY IF NOT EXISTS "chat_sessions_select_member" ON public.chat_sessions FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "chat_sessions_insert" ON public.chat_sessions FOR INSERT WITH CHECK (true);
  policy_count := policy_count + 2;

  -- messages
  CREATE POLICY IF NOT EXISTS "messages_select_member" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = session_id AND public.is_business_member(business_id))
  );
  CREATE POLICY IF NOT EXISTS "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
  policy_count := policy_count + 2;

  -- payments
  CREATE POLICY IF NOT EXISTS "payments_select_member" ON public.payments FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "payments_select_buyer" ON public.payments FOR SELECT USING (true);
  policy_count := policy_count + 2;

  -- order_events
  CREATE POLICY IF NOT EXISTS "order_events_select_member" ON public.order_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.payments WHERE id = payment_id AND public.is_business_member(business_id))
  );
  policy_count := policy_count + 1;

  -- payment_orders
  CREATE POLICY IF NOT EXISTS "payment_orders_select" ON public.payment_orders FOR SELECT USING (public.is_business_member(business_id));
  policy_count := policy_count + 1;

  -- payment_idempotency_keys
  CREATE POLICY IF NOT EXISTS "idempotency_keys_select" ON public.payment_idempotency_keys FOR SELECT USING (true);
  policy_count := policy_count + 1;

  -- notifications
  CREATE POLICY IF NOT EXISTS "notifications_select" ON public.notifications FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "notifications_update" ON public.notifications FOR UPDATE USING (public.is_business_member(business_id));
  policy_count := policy_count + 2;

  -- seller_payout_accounts
  CREATE POLICY IF NOT EXISTS "payout_accounts_select" ON public.seller_payout_accounts FOR SELECT USING (seller_user_id = auth.uid());
  CREATE POLICY IF NOT EXISTS "payout_accounts_insert" ON public.seller_payout_accounts FOR INSERT WITH CHECK (seller_user_id = auth.uid());
  CREATE POLICY IF NOT EXISTS "payout_accounts_update" ON public.seller_payout_accounts FOR UPDATE USING (seller_user_id = auth.uid());
  policy_count := policy_count + 3;

  -- business_invitations
  CREATE POLICY IF NOT EXISTS "invitations_select" ON public.business_invitations FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "invitations_insert" ON public.business_invitations FOR INSERT WITH CHECK (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "invitations_update" ON public.business_invitations FOR UPDATE USING (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "invitations_delete" ON public.business_invitations FOR DELETE USING (public.is_business_owner(business_id));
  policy_count := policy_count + 4;

  -- business_team_members
  CREATE POLICY IF NOT EXISTS "team_members_select" ON public.business_team_members FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "team_members_insert" ON public.business_team_members FOR INSERT WITH CHECK (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "team_members_update" ON public.business_team_members FOR UPDATE USING (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "team_members_delete" ON public.business_team_members FOR DELETE USING (public.is_business_owner(business_id));
  policy_count := policy_count + 4;

  -- business_team_roles
  CREATE POLICY IF NOT EXISTS "team_roles_select" ON public.business_team_roles FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "team_roles_insert" ON public.business_team_roles FOR INSERT WITH CHECK (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "team_roles_update" ON public.business_team_roles FOR UPDATE USING (public.is_business_owner(business_id));
  CREATE POLICY IF NOT EXISTS "team_roles_delete" ON public.business_team_roles FOR DELETE USING (public.is_business_owner(business_id));
  policy_count := policy_count + 4;

  -- plan_payments
  CREATE POLICY IF NOT EXISTS "plan_payments_select" ON public.plan_payments FOR SELECT USING (public.is_business_member(business_id));
  policy_count := policy_count + 1;

  -- verification_otps
  CREATE POLICY IF NOT EXISTS "verification_otps_insert" ON public.verification_otps FOR INSERT WITH CHECK (true);
  policy_count := policy_count + 1;

  -- import_jobs
  CREATE POLICY IF NOT EXISTS "import_jobs_select" ON public.import_jobs FOR SELECT USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "import_jobs_insert" ON public.import_jobs FOR INSERT WITH CHECK (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "import_jobs_update" ON public.import_jobs FOR UPDATE USING (public.is_business_member(business_id));
  CREATE POLICY IF NOT EXISTS "import_jobs_delete" ON public.import_jobs FOR DELETE USING (public.is_business_member(business_id));
  policy_count := policy_count + 4;

  -- import_rows
  CREATE POLICY IF NOT EXISTS "import_rows_select" ON public.import_rows FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.import_jobs WHERE id = job_id AND public.is_business_member(business_id))
  );
  CREATE POLICY IF NOT EXISTS "import_rows_insert" ON public.import_rows FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.import_jobs WHERE id = job_id AND public.is_business_member(business_id))
  );
  CREATE POLICY IF NOT EXISTS "import_rows_update" ON public.import_rows FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.import_jobs WHERE id = job_id AND public.is_business_member(business_id))
  );
  CREATE POLICY IF NOT EXISTS "import_rows_delete" ON public.import_rows FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.import_jobs WHERE id = job_id AND public.is_business_member(business_id))
  );
  policy_count := policy_count + 4;

  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ RLS complete — % policies created', policy_count;
  RAISE NOTICE '═══════════════════════════════════════';
END;
$do$;
