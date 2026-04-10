-- =====================================================
-- MIGRATION: Fix Storage RLS policies for products bucket
-- =====================================================

-- Step 1: Ensure the 'products' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Enable RLS on storage.objects (usually already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove existing restrictive policies if any (optional but safer)
-- NOTE: We target the 'products' bucket specifically
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname ILIKE '%products%' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Add comprehensive policies for 'products' bucket

-- A) Allow public access to view images (SELECT)
-- This ensures that anyone can see product images on the storefront
CREATE POLICY "Public Access for Products Bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- B) Allow authenticated users to upload images (INSERT)
-- We check if the user is authenticated and the bucket is 'products'
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- C) Allow authenticated users to update their own images (UPDATE)
CREATE POLICY "Authenticated users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND owner = auth.uid());

-- D) Allow authenticated users to delete their own images (DELETE)
CREATE POLICY "Authenticated users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND owner = auth.uid());
