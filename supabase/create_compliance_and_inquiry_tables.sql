-- Migration: Create Compliance (Audit Logs) and Inquiry (Bespoke Requests) Tables

-- 1. Create audit_logs table for Indian IT Act / CERT-In compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT define any public SELECT/UPDATE/DELETE policies on audit_logs.
-- This ensures that only server-side actions running via the 'service_role' key (which bypasses RLS) 
-- can insert logs, and no user or attacker can read, modify, or clear their audit logs, satisfying cyber-compliance log integrity.


-- 2. Create bespoke_requests table for custom luxury card requests
CREATE TABLE IF NOT EXISTS public.bespoke_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    wedding_date DATE,
    estimated_budget TEXT,
    details TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on bespoke_requests
ALTER TABLE public.bespoke_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous site visitors) to submit custom requests
DROP POLICY IF EXISTS "Allow public insert bespoke requests" ON public.bespoke_requests;
CREATE POLICY "Allow public insert bespoke requests" 
  ON public.bespoke_requests FOR INSERT 
  WITH CHECK (true);

-- Allow only administrators to select/read bespoke requests
DROP POLICY IF EXISTS "Allow admins select bespoke requests" ON public.bespoke_requests;
CREATE POLICY "Allow admins select bespoke requests" 
  ON public.bespoke_requests FOR SELECT 
  USING (public.is_admin());

-- Allow only administrators to update/manage bespoke requests
DROP POLICY IF EXISTS "Allow admins update bespoke requests" ON public.bespoke_requests;
CREATE POLICY "Allow admins update bespoke requests" 
  ON public.bespoke_requests FOR UPDATE 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());


-- 3. Enhance payments table RLS policies
-- Let users view their own transaction history logs
DROP POLICY IF EXISTS "Allow users select own payments" ON public.payments;
CREATE POLICY "Allow users select own payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() = user_id);
