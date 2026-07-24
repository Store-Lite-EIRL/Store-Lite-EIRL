-- Create 'tickets' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public Read Access (Important for verification)
CREATE POLICY "Public Ticket Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tickets' );

-- Policy: Allow Public/Anon Upload (Needed for checkout flow)
CREATE POLICY "Public Ticket Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'tickets' );
