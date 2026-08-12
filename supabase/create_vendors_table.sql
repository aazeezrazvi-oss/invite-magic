-- Create public.vendors table for Service Providers Directory
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'mehendi', 'makeup', 'photography', 'decor', 'catering', 'dj_music', 'planner', 'venue'
    tagline TEXT,
    description TEXT,
    location TEXT,
    dp_url TEXT,
    portfolio_photos TEXT[] DEFAULT '{}'::TEXT[],
    whatsapp_number TEXT,
    phone_number TEXT,
    instagram_handle TEXT,
    starting_price TEXT,
    rating NUMERIC(3,2) DEFAULT 4.90,
    review_count INT DEFAULT 15,
    is_approved BOOLEAN DEFAULT FALSE, -- Default pending approval until admin verifies
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Allow anyone (guests & users) to view APPROVED vendors
CREATE POLICY "Public vendors view approved policy"
    ON public.vendors
    FOR SELECT
    USING (is_approved = TRUE);

-- 2. Vendor Owner Read Policy: Allow vendors to view their own profile even if pending
CREATE POLICY "Owner vendor read policy"
    ON public.vendors
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Vendor Owner Insert/Update Policy: Allow logged in users to insert or update their vendor profile
CREATE POLICY "Owner vendor insert policy"
    ON public.vendors
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Owner vendor update policy"
    ON public.vendors
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Service Role / Admin Full Control
CREATE POLICY "Admin vendor full policy"
    ON public.vendors
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Seed Data: Insert sample pre-approved vendors across major categories so directory is rich on launch
INSERT INTO public.vendors (
    business_name,
    category,
    tagline,
    description,
    location,
    dp_url,
    portfolio_photos,
    whatsapp_number,
    phone_number,
    instagram_handle,
    starting_price,
    rating,
    review_count,
    is_approved,
    is_verified,
    is_featured
) VALUES
(
    'Zara Bridal Mehendi & Henna Studio',
    'mehendi',
    'Exquisite organic bridal henna, Arabic, Rajasthani & customized portrait mehendi designs.',
    'Specialized in traditional figure mehendi, stain guarantee, organic natural henna cones, and bridal party packages across Bengaluru & South India.',
    'Bengaluru, Karnataka',
    'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?q=80&w=400&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop'
    ],
    '919876543210',
    '+91 98765 43210',
    'zaramehendi_official',
    '₹5,000',
    4.95,
    42,
    TRUE,
    TRUE,
    TRUE
),
(
    'Glamour Aura Makeup & Hair by Ananya',
    'makeup',
    'HD Airbrush & Glass-Skin Glamour Makeup for Brides & Families.',
    'Certified celebrity makeup artist with 8+ years experience specializing in HD Airbrush, Waterproof Nude Glam, Traditional South & North Indian Bridal Looks.',
    'Bengaluru, Karnataka',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop'
    ],
    '919876543211',
    '+91 98765 43211',
    'glamouraura_makeup',
    '₹15,000',
    4.90,
    38,
    TRUE,
    TRUE,
    TRUE
),
(
    'Royal Lens Wedding Photography & Films',
    'photography',
    'Cinematic wedding films, candid moments, and drone aerial coverage.',
    'Capturing love stories with timeless elegance. Our team offers candid photography, 4K cinematic teasers, pre-wedding couple shoots, and traditional video coverage.',
    'Mumbai & Bengaluru',
    'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=400&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop'
    ],
    '919876543212',
    '+91 98765 43212',
    'royallens_weddings',
    '₹45,000',
    4.98,
    56,
    TRUE,
    TRUE,
    FALSE
),
(
    'Bloom & Canopy Luxury Wedding Decorators',
    'decor',
    'Custom floral mandaps, fairy-light stage setups & royal banquet themes.',
    'Transforming venues into magical dreamlands. Expert floral artists, mandap design, entrance drapes, lighting installations, and theme decor styling.',
    'Bengaluru, Karnataka',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=400&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop'
    ],
    '919876543213',
    '+91 98765 43213',
    'bloomcanopy_events',
    '₹60,000',
    4.88,
    29,
    TRUE,
    TRUE,
    FALSE
);
