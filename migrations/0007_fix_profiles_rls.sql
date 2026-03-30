-- =====================================================
-- MIGRATION: Fix Profiles RLS policies
-- =====================================================

-- Step 1: Enable RLS on profiles table
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Step 2: Add policies

-- A) Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON "public"."profiles" FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- B) Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "public"."profiles" FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- C) Allow public access to read profiles (needed for storefront to see seller info)
-- This depends on what sensitive data is in profiles. If limited to name/store info, it's fine.
CREATE POLICY "Public can view profiles"
ON "public"."profiles" FOR SELECT
TO public
USING (true);
