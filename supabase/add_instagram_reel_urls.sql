-- Migration: Add instagram_reel_urls column to vendors table
-- Run this in Supabase SQL Editor to add the new column

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS instagram_reel_urls TEXT[] DEFAULT '{}'::TEXT[];

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.vendors.instagram_reel_urls IS 'Array of Instagram Reel/Post URLs to embed on vendor profile page (max 6)';
