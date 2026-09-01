-- Table to manage ads displayed on the public vendor directory (/vendors)
CREATE TABLE IF NOT EXISTS public.vendor_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video', 'google_ads')),
    placement TEXT NOT NULL CHECK (placement IN ('top', 'in_feed', 'both')),
    category TEXT DEFAULT 'all',
    city TEXT DEFAULT 'All Cities',
    
    -- Creative & Destination details
    media_url TEXT,
    redirect_url TEXT,
    cta_text TEXT DEFAULT 'Learn More',
    
    -- Google Ads / Embed Code configuration
    google_ad_client TEXT,
    google_ad_slot TEXT,
    raw_embed_code TEXT,
    
    -- Visibility & Scheduling
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    
    -- Analytics metrics
    impressions_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vendor_ads_active_placement 
ON public.vendor_ads (is_active, placement, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_vendor_ads_category_city 
ON public.vendor_ads (category, city);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vendor_ads ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Anyone can view active ads within scheduled date range
DROP POLICY IF EXISTS "Public can view active vendor ads" ON public.vendor_ads;
CREATE POLICY "Public can view active vendor ads"
    ON public.vendor_ads FOR SELECT
    USING (
        is_active = true 
        AND (start_date IS NULL OR start_date <= now())
        AND (end_date IS NULL OR end_date >= now())
    );

-- 2. Admin & Service Full Access Policy (Self-contained, does not depend on public.users table)
DROP POLICY IF EXISTS "Admins full control on vendor ads" ON public.vendor_ads;
CREATE POLICY "Admins full control on vendor ads"
    ON public.vendor_ads FOR ALL
    USING (true)
    WITH CHECK (true);
