-- 1. Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
 
-- 2. Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Modify public.users to add applied_referral_code
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS applied_referral_code TEXT REFERENCES public.referral_codes(code) ON DELETE SET NULL;

-- 4. Create media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'music')),
    filename TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Modify public.invitations to add is_suspended
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false NOT NULL;

-- 6. Enable RLS on new tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS Policies for new tables & admin permissions
DROP POLICY IF EXISTS "Allow public select referral codes" ON public.referral_codes;
CREATE POLICY "Allow public select referral codes" ON public.referral_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins full access referral codes" ON public.referral_codes;
CREATE POLICY "Allow admins full access referral codes" ON public.referral_codes FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public select media assets" ON public.media_assets;
CREATE POLICY "Allow public select media assets" ON public.media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins full access media assets" ON public.media_assets;
CREATE POLICY "Allow admins full access media assets" ON public.media_assets FOR ALL USING (public.is_admin());

-- Additional Admin Policies for existing tables (in case not already defined)
DROP POLICY IF EXISTS "Allow admins select all users" ON public.users;
CREATE POLICY "Allow admins select all users" ON public.users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins update all users" ON public.users;
CREATE POLICY "Allow admins update all users" ON public.users FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins select all invitations" ON public.invitations;
CREATE POLICY "Allow admins select all invitations" ON public.invitations FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins update all invitations" ON public.invitations;
CREATE POLICY "Allow admins update all invitations" ON public.invitations FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins select all payments" ON public.payments;
CREATE POLICY "Allow admins select all payments" ON public.payments FOR SELECT USING (public.is_admin());

-- 8. Seed default referral codes
INSERT INTO public.referral_codes (code, discount_percent) VALUES
('SAVE20', 20),
('WED50', 50),
('FREEVIP', 100)
ON CONFLICT (code) DO NOTHING;

-- 9. Seed default media assets (including background music, images, and videos)
INSERT INTO public.media_assets (url, media_type, filename) VALUES
-- Music Tracks
('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'music', 'SoundHelix Instrumental 1'),
('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'music', 'SoundHelix Instrumental 2'),
('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'music', 'SoundHelix Instrumental 3'),
('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'music', 'SoundHelix Instrumental 4'),
-- Videos
('https://assets.mixkit.co/videos/preview/mixkit-background-of-a-golden-particle-rain-31627-large.mp4', 'video', 'Golden Particle Rain'),
('https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-gold-glitter-particles-on-black-background-41221-large.mp4', 'video', 'Glittering Gold Bokeh'),
('https://assets.mixkit.co/videos/preview/mixkit-bokeh-lights-background-with-soft-gold-glimmers-41269-large.mp4', 'video', 'Soft Golden Glimmers'),
-- Images
('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', 'image', 'White Wedding Floral Arrangement'),
('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80', 'image', 'Warm Romantic Glow'),
('https://images.unsplash.com/photo-1507504038482-76210f5c0f5a?auto=format&fit=crop&w=1200&q=80', 'image', 'Shimmering Golden Dust')
ON CONFLICT DO NOTHING;
