-- InviteMagic Login & User Profiles Schema
-- This script is safe to run multiple times (idempotent).

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing login objects to allow clean reruns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop policies before dropping the table
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow users select self profile" ON public.users;
  DROP POLICY IF EXISTS "Allow users update self profile" ON public.users;
  DROP POLICY IF EXISTS "Allow system insert profile" ON public.users;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;

-- 1. Create Roles & Tier Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'vip');

-- 2. Users Profile Table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for Users
CREATE POLICY "Allow users select self profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users update self profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow system insert profile" ON public.users FOR INSERT WITH CHECK (true);

-- 3. Exception-safe trigger: creates profile row on signup.
--    If it fails for ANY reason, signup still succeeds (won't rollback).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'abdulazeezrazvi125@gmail.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    CASE
      WHEN NEW.email IN ('abdulazeezrazvi125@gmail.com', 'abdulazeezrazvi97@gmail.com') THEN 'vip'::subscription_tier
      ELSE 'free'::subscription_tier
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but do NOT fail the signup
    RAISE WARNING 'handle_new_user trigger warning: % %', SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill: create profile rows for any auth.users that already exist
--    but don't have a public.users row yet (from previously failed signups).
INSERT INTO public.users (id, email, role, subscription_tier)
SELECT
  au.id,
  au.email,
  CASE
    WHEN au.email = 'abdulazeezrazvi125@gmail.com' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  CASE
    WHEN au.email IN ('abdulazeezrazvi125@gmail.com', 'abdulazeezrazvi97@gmail.com') THEN 'vip'::subscription_tier
    ELSE 'free'::subscription_tier
  END
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;
