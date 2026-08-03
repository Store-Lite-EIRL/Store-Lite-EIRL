-- ============================================================
-- MIGRATION: 0032_platform_business
-- Created: 2026-08-03
-- Description: Seeds the fixed platform business row (Devkittop)
--   used as the storage target for the platform-level Libro de
--   Reclamaciones (`complaint_book_records.business_id` NOT NULL).
--   Owner resolved by email from public.profiles so the FK
--   (owner_id) always points to a real profile.
--   Idempotent: ON CONFLICT (slug) DO NOTHING.
--   is_active = false → excluded from public storefronts &
--   sitemap (businesses_select_public policy, is_active = true).
-- ============================================================

INSERT INTO businesses (owner_id, name, slug, is_active)
SELECT
  p.id,
  'Devkittop',
  'devkittop',
  false
FROM public.profiles p
WHERE p.email = 'devkittopsac@gmail.com'
ON CONFLICT (slug) DO NOTHING;