-- Migration: Add slug column to public.vendors for SEO-friendly URLs and Google Brand search ranking
-- Safe & idempotent: Does not alter or drop any existing columns, guaranteeing zero data loss.

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors (LOWER(slug));

-- Populate slug for existing vendors based on their business_name
UPDATE public.vendors 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug IS NULL AND business_name IS NOT NULL;
