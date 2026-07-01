-- HOTFIX: Fix RLS policies for admin write operations
-- Run this in your Supabase SQL Editor

-- 1. Update is_admin() to check auth.jwt() email claim as fallback for ultimate RLS safety
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email' = 'abdulazeezrazvi125@gmail.com')
    OR (auth.jwt() ->> 'email' = 'abdulazeezrazvi97@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (role = 'admin' OR email = 'abdulazeezrazvi125@gmail.com' OR email = 'abdulazeezrazvi97@gmail.com')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and recreate referral_codes policies with proper WITH CHECK
DROP POLICY IF EXISTS "Allow admins full access referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow admins insert referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow admins delete referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow admins update referral codes" ON public.referral_codes;

-- SELECT already exists and allows public
-- INSERT policy
CREATE POLICY "Allow admins insert referral codes" 
  ON public.referral_codes FOR INSERT 
  WITH CHECK (public.is_admin());

-- DELETE policy
CREATE POLICY "Allow admins delete referral codes" 
  ON public.referral_codes FOR DELETE 
  USING (public.is_admin());

-- UPDATE policy
CREATE POLICY "Allow admins update referral codes" 
  ON public.referral_codes FOR UPDATE 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- 3. Drop and recreate media_assets policies with proper WITH CHECK
DROP POLICY IF EXISTS "Allow admins full access media assets" ON public.media_assets;
DROP POLICY IF EXISTS "Allow admins insert media assets" ON public.media_assets;
DROP POLICY IF EXISTS "Allow admins delete media assets" ON public.media_assets;
DROP POLICY IF EXISTS "Allow admins update media assets" ON public.media_assets;

-- SELECT already exists and allows public
-- INSERT policy
CREATE POLICY "Allow admins insert media assets" 
  ON public.media_assets FOR INSERT 
  WITH CHECK (public.is_admin());

-- DELETE policy
CREATE POLICY "Allow admins delete media assets" 
  ON public.media_assets FOR DELETE 
  USING (public.is_admin());

-- UPDATE policy
CREATE POLICY "Allow admins update media assets" 
  ON public.media_assets FOR UPDATE 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- 4. Ensure the admin users have profile rows in public.users and have role 'admin' & 'vip' tier
INSERT INTO public.users (id, email, role, subscription_tier)
SELECT id, email, 'admin', 'vip'
FROM auth.users
WHERE email IN ('abdulazeezrazvi125@gmail.com', 'abdulazeezrazvi97@gmail.com')
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', subscription_tier = 'vip', updated_at = now();

-- 5. Allow public SELECT on users table if they own an invitation (to read subscription_tier)
DROP POLICY IF EXISTS "Allow public select users owning invitations" ON public.users;
CREATE POLICY "Allow public select users owning invitations" ON public.users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invitations
    WHERE invitations.user_id = users.id
  ));
