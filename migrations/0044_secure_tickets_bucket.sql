-- Drop the insecure public anonymous upload policy on 'tickets' bucket
-- Tickets must only be generated and uploaded server-side via service_role key
DROP POLICY IF EXISTS "Public Ticket Upload" ON storage.objects;
