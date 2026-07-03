-- 1. Recreate is_admin() function with robust admin emails and role checks
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

-- 2. Trigger function to prevent privilege escalation (modifying role/tier columns)
CREATE OR REPLACE FUNCTION public.check_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If executing as service_role, postgres superuser, or another admin, allow everything
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Block normal users from elevating role, subscription tier, or expiry date
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Unauthorized: You cannot modify your own role.';
  END IF;

  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Unauthorized: You cannot modify your own subscription tier.';
  END IF;

  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'Unauthorized: You cannot modify your own subscription expiration date.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS before_user_update ON public.users;
CREATE TRIGGER before_user_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_update();

-- 3. Drop data-exposing policies
-- This policy allows anyone to read other users' email and role if they own an invitation. Drop it!
DROP POLICY IF EXISTS "Allow public select users owning invitations" ON public.users;

-- 4. Tighten UPDATE policies to ensure WITH CHECK clauses exist
-- Update policy on users table
DROP POLICY IF EXISTS "Allow users update self profile" ON public.users;
CREATE POLICY "Allow users update self profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update policy on invitations table (prevents changing user_id)
DROP POLICY IF EXISTS "Allow users update own invitations" ON public.invitations;
CREATE POLICY "Allow users update own invitations" ON public.invitations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure admins have SELECT policies on users, payments, and invitations
DROP POLICY IF EXISTS "Allow admins select all users" ON public.users;
CREATE POLICY "Allow admins select all users" ON public.users 
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins select all invitations" ON public.invitations;
CREATE POLICY "Allow admins select all invitations" ON public.invitations 
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins select all payments" ON public.payments;
CREATE POLICY "Allow admins select all payments" ON public.payments 
  FOR SELECT USING (public.is_admin());
