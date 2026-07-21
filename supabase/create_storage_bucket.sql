-- Create the 'photos' storage bucket for media assets
-- This bucket is used by the admin panel and editor sidebar
-- to upload background images, videos, and music files.
-- This script is idempotent — safe to run multiple times.

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read access on photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from photos bucket" ON storage.objects;

-- Allow public read access (so getPublicUrl works without auth)
CREATE POLICY "Public read access on photos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to photos bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update photos bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete from photos bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');
