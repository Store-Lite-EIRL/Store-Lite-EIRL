-- =====================================================
-- MIGRATION: 0011_reassert_profiles_rls
-- =====================================================
-- Description: Re-asserts and strengthens RLS for profiles table
-- Logic: 
-- 1. Ensure RLS is enabled
-- 2. Allow authenticated users to:
--    a) SELECT their own profile
--    b) INSERT their own profile (crucial for initial sync)
--    c) UPDATE their own profile
-- =====================================================

-- Step 1: Guarantee RLS is on
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Step 2: Clear any conflicting or half-broken policies
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Public can view profiles" ON "public"."profiles";

-- Step 3: Create robust policies for authenticated users

-- A) Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON "public"."profiles" FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- B) Allow users to create their own profile
-- (Needed for the Auth Callback syncUserProfile function)
CREATE POLICY "Users can insert own profile"
ON "public"."profiles" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- C) Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "public"."profiles" FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- D) Re-add Public Read access if needed for storefronts 
-- (optional - but keep limited for now as per user previous migration 0010)
-- CREATE POLICY "Public can view profiles" ON "public"."profiles" FOR SELECT TO public USING (true);
