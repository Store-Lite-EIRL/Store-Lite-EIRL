-- =====================================================
-- MIGRATION: 0040_profiles_rls_own
-- =====================================================
-- Description: Guarantee profiles RLS is ENABLED and the three own-only
--              policies exist (SELECT / INSERT / UPDATE WHERE id = auth.uid()).
--
-- Context (A1 security audit — Store_Lite):
--   In production `profiles` has ROW LEVEL SECURITY ON but ZERO policies and
--   no privs funneled to client roles, so supabase-js reads/inserts/updates of a
--   user's own profile are silently DENIED (deny-by-default → 0 rows, no error).
--   This leaves `src/features/auth/index.tsx` (fetchProfile) and
--   `app/auth/callback/route.ts` (syncUserProfile) always seeing profile=undefined.
--
--   Migrations 0007_fix_profiles_rls.sql and 0011_reassert_profiles_rls.sql define
--   the exact correct policies but live as MANUAL operator files (outside the
--   Drizzle journal) and were never applied to the production DB, so the table
--   still has RLS on with zero policies.
--
--   This migration is idempotent: it (re)asserts RLS and recreates the own-only
--   policies. Safe to re-run. Do NOT add a broad "public can read" policy — the
--   storefront reads seller data via postgres.js (bypass) and profiles contains PII
--   (email, phone, address). Own-only is the A6-consistent hardening.
--
-- Apply via operator: psql -f migrations/0040_profiles_rls_own.sql (or Supabase SQL)
-- =====================================================

-- Step 1: Guarantee RLS is on
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Step 2: Drop any conflicting / half-broken policies so the three below are the
--         single source of truth (idempotent re-apply).
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Public can view profiles" ON "public"."profiles";
--> statement-breakpoint

-- Step 3: Own-only access — each authenticated user can see/create/update ONLY
--         their own row (id = auth.uid()). No public read: profiles holds PII.
CREATE POLICY "Users can view own profile"
ON "public"."profiles" FOR SELECT
TO authenticated
USING (auth.uid() = id);
--> statement-breakpoint

CREATE POLICY "Users can insert own profile"
ON "public"."profiles" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
--> statement-breakpoint

CREATE POLICY "Users can update own profile"
ON "public"."profiles" FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
--> statement-breakpoint
