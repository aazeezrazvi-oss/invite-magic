-- InviteMagic Login & User Profiles Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing login objects to allow clean reruns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
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
    role user_role DEFAULT 'user'::user_role NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free'::subscription_tier NOT NULL,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for Users (CRUD on their own items)
CREATE POLICY "Allow users select self profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users update self profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow system insert profile" ON public.users FOR INSERT WITH CHECK (true);

-- 3. Trigger to automatically create a public.users profile when a new user signs up in auth.users
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
