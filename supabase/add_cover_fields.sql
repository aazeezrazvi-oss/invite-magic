-- Migration: Add cover page customization fields + fix media_assets duplicates
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Add cover page fields to styling_preferences
-- ============================================================
ALTER TABLE public.styling_preferences
  ADD COLUMN IF NOT EXISTS cover_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_subtitle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_custom_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS wax_seal_text TEXT DEFAULT '';

-- ============================================================
-- 2. Fix duplicate media assets
-- ============================================================

-- First, delete duplicate rows keeping only the oldest entry per URL
DELETE FROM public.media_assets
WHERE id NOT IN (
  SELECT DISTINCT ON (url) id
  FROM public.media_assets
  ORDER BY url, created_at ASC
);

-- Then add a unique constraint so duplicates can never be inserted again
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_url_unique UNIQUE (url);
