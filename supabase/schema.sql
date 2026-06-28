-- InviteMagic Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing database objects to allow clean reruns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.gift_transactions CASCADE;
DROP TABLE IF EXISTS public.gift_collection_details CASCADE;
DROP TABLE IF EXISTS public.rsvp CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.styling_preferences CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS attending_status CASCADE;

-- 1. Create Roles & Tier Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'vip');
CREATE TYPE attending_status AS ENUM ('going', 'not_going', 'pending');

-- 2. Users Profile Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free'::subscription_tier NOT NULL,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g., 'royal-gold', 'muslim-nikah', 'floral-theme'
    is_premium BOOLEAN DEFAULT false NOT NULL,
    preview_img_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default templates
INSERT INTO public.templates (name, slug, is_premium) VALUES
('Royal Gold', 'royal-gold', false),
('Muslim Nikah', 'muslim-nikah', false),
('Floral Theme', 'floral-theme', false),
('Modern Luxury', 'modern-luxury', true),
('South Indian Traditional', 'south-indian-traditional', false),
('Minimal White', 'minimal-white', false),
('Dark Elegant', 'dark-elegant', true),
('Video Invitation Theme', 'video-invitation-theme', true),
('Urdu Theme', 'urdu-theme', false),
('Premium Animation Theme', 'premium-animation-theme', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g., 'abdul-sana'
    groom_name TEXT NOT NULL,
    groom_photo TEXT,
    groom_bio TEXT,
    bride_name TEXT NOT NULL,
    bride_photo TEXT,
    bride_bio TEXT,
    parents_names TEXT,
    invitation_message TEXT,
    template_id UUID REFERENCES public.templates(id),
    custom_domain TEXT UNIQUE,
    is_published BOOLEAN DEFAULT false NOT NULL,
    gallery_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Styling Preferences Table
CREATE TABLE IF NOT EXISTS public.styling_preferences (
    invitation_id UUID PRIMARY KEY REFERENCES public.invitations(id) ON DELETE CASCADE,
    primary_color TEXT DEFAULT '#d4af37' NOT NULL,
    secondary_color TEXT DEFAULT '#b8962e' NOT NULL,
    background_color TEXT DEFAULT '#0d0d11' NOT NULL,
    text_color TEXT DEFAULT '#f3f4f6' NOT NULL,
    font_heading TEXT DEFAULT 'cinzel' NOT NULL, -- cinzel, playfair, alex, etc.
    font_body TEXT DEFAULT 'inter' NOT NULL, -- inter, urdu, hindi, kannada
    music_url TEXT, -- uploaded MP3 or presets
    section_order TEXT[] DEFAULT ARRAY['hero', 'countdown', 'story', 'events', 'gallery', 'livestream', 'rsvp', 'gifts']::TEXT[] NOT NULL,
    animation_style TEXT DEFAULT 'fade' NOT NULL, -- fade, slide, zoom, parallax, confetti
    button_style TEXT DEFAULT 'gold-border' NOT NULL,
    countdown_style TEXT DEFAULT 'circles' NOT NULL,
    gallery_layout TEXT DEFAULT 'grid' NOT NULL, -- grid, carousel, masonry
    background_type TEXT DEFAULT 'gradient' NOT NULL, -- image, video, gradient
    background_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE NOT NULL,
    event_name TEXT NOT NULL, -- e.g. Haldi, Sangeet, Shaadi, Reception
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    google_maps_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. RSVP Table
CREATE TABLE IF NOT EXISTS public.rsvp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    attending_status attending_status DEFAULT 'pending'::attending_status NOT NULL,
    guest_count INTEGER DEFAULT 1 NOT NULL,
    wishes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Gift Collection Details Table
CREATE TABLE IF NOT EXISTS public.gift_collection_details (
    invitation_id UUID PRIMARY KEY REFERENCES public.invitations(id) ON DELETE CASCADE,
    upi_id TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    thank_you_message TEXT DEFAULT 'Thank you for your warm blessings and digital gifts!' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Gift Transactions Table
CREATE TABLE IF NOT EXISTS public.gift_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE NOT NULL,
    sender_name TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Payments (Razorpay) Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    payment_id TEXT UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT NOT NULL, -- created, captured, failed
    tier subscription_tier NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Analytics Table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- e.g., 'view', 'rsvp_submit', 'gift_click'
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styling_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_collection_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Policies for public access (Guests)
-- Allow anyone to read template listings and active invitations
CREATE POLICY "Allow public read templates" ON public.templates FOR SELECT USING (true);
CREATE POLICY "Allow public read invitations" ON public.invitations FOR SELECT USING (is_published = true);
CREATE POLICY "Allow public read styling" ON public.styling_preferences FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public insert rsvp" ON public.rsvp FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read gift details" ON public.gift_collection_details FOR SELECT USING (true);
CREATE POLICY "Allow public insert gift trans" ON public.gift_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- Policies for Users (CRUD on their own items)
CREATE POLICY "Allow users select self profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users update self profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users select own invitations" ON public.invitations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users insert own invitations" ON public.invitations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users update own invitations" ON public.invitations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users delete own invitations" ON public.invitations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Allow users full styling own invitations" ON public.styling_preferences 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.invitations WHERE invitations.id = styling_preferences.invitation_id AND invitations.user_id = auth.uid()));

CREATE POLICY "Allow users full events own invitations" ON public.events 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.invitations WHERE invitations.id = events.invitation_id AND invitations.user_id = auth.uid()));

CREATE POLICY "Allow users select rsvps own invitations" ON public.rsvp 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.invitations WHERE invitations.id = rsvp.invitation_id AND invitations.user_id = auth.uid()));

CREATE POLICY "Allow users full gift details own invitations" ON public.gift_collection_details 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.invitations WHERE invitations.id = gift_collection_details.invitation_id AND invitations.user_id = auth.uid()));

CREATE POLICY "Allow users select gift trans own invitations" ON public.gift_transactions 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.invitations WHERE invitations.id = gift_transactions.invitation_id AND invitations.user_id = auth.uid()));

-- 12. Trigger to automatically create a public.users profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, subscription_tier)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email = 'abdulazeezrazvi125@gmail.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    CASE 
      WHEN new.email IN ('abdulazeezrazvi125@gmail.com', 'abdulazeezrazvi97@gmail.com') THEN 'vip'::subscription_tier
      ELSE 'free'::subscription_tier
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

