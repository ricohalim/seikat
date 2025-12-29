-- Add verification_photo_url to profiles and temp_registrations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_photo_url TEXT;
ALTER TABLE temp_registrations ADD COLUMN IF NOT EXISTS verification_photo_url TEXT;

-- Create storage bucket for verification documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users (uploading during registration) to insert
-- Note: During registration, user might be authenticated via supabase.auth.signUp but let's allow public upload for simplicity if needed, 
-- OR strictly authenticated if the flow is: Sign Up -> User Created -> Upload.
-- In the code, we do signup first, so user is authenticated. 

-- Allow public read for admins (this might need refinement in production)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'verification-docs' );

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'verification-docs' AND auth.role() = 'authenticated' );
