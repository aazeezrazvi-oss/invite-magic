-- ==============================================================================
-- Schema Migration: Manual UPI Payments & Screenshot Verification
-- ==============================================================================

-- 1. Add extra columns to existing public.payments table if they do not exist
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS utr_number TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi_manual',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.users(id);

-- 2. Create index on status and user_id for high-performance dashboard queries
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON public.payments(utr_number);

-- 3. Row Level Security Policies for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own payments
DROP POLICY IF EXISTS "Allow users select own payments" ON public.payments;
CREATE POLICY "Allow users select own payments" 
  ON public.payments FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their payment proofs
DROP POLICY IF EXISTS "Allow users insert own payments" ON public.payments;
CREATE POLICY "Allow users insert own payments" 
  ON public.payments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow admins full access to select and update payments
DROP POLICY IF EXISTS "Allow admins select all payments" ON public.payments;
CREATE POLICY "Allow admins select all payments" 
  ON public.payments FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.email IN ('abdulazeezrazvi125@gmail.com', 'abdulazeezrazvi97@gmail.com'))
    )
  );

DROP POLICY IF EXISTS "Allow admins update all payments" ON public.payments;
CREATE POLICY "Allow admins update all payments" 
  ON public.payments FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.email IN ('abdulazeezrazvi125@gmail.com', 'abdulazeezrazvi97@gmail.com'))
    )
  );
