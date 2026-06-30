-- HOTFIX: Fix RLS policies for admin write operations
-- Run this in your Supabase SQL Editor

-- 1. Update is_admin() to also check by email as fallback
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'admin' OR email = 'abdulazeezrazvi125@gmail.com')
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

-- 4. Ensure the admin user's role is actually 'admin'
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'abdulazeezrazvi125@gmail.com' AND role != 'admin';
