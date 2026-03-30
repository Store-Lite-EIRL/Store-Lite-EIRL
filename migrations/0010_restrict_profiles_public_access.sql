-- Tighten profiles RLS: remove broad public read access
DROP POLICY IF EXISTS "Public can view profiles" ON "public"."profiles";
