-- Run this in your Supabase project: SQL Editor → New query → paste and Run.
-- This creates/updates tables so profile, settings, and batches save correctly.
--
-- Profile: Saved via Supabase Auth (updateUser) — no extra table needed.
-- Settings: Stored in public.settings, scoped by user_id.
-- Batches: Stored in public.batches and public.batch_rows, scoped by user_id.
--
-- If you already have "settings" or "customers" tables, the script adds user_id
-- where missing so each user only sees their own data.

-- 1) Settings: ensure user_id exists and RLS allows access
-- If you already have a "settings" table without user_id, add the column:
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- If you don't have a settings table yet, create it:
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_rate_pct real DEFAULT 2.5,
  contingency_pct real DEFAULT 25,
  contingency_fee_pct real DEFAULT 25,
  flat_fee real DEFAULT 150,
  review_min_tax_saved real DEFAULT 700,
  min_savings_threshold real DEFAULT 700,
  charge_flat_if_no_win boolean DEFAULT false,
  days_due int DEFAULT 30,
  qb_item_name text DEFAULT 'Property Tax Protest',
  qb_desc_prefix text DEFAULT 'Tax savings',
  next_invoice_no int DEFAULT 1001,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: users can only read/insert/update their own settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own settings" ON public.settings;
CREATE POLICY "Users can read own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- 2) Batches
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_filename text NOT NULL,
  created_at timestamptz DEFAULT now(),
  tax_rate_pct real DEFAULT 2.5,
  contingency_pct real DEFAULT 25,
  flat_fee real DEFAULT 0,
  review_min_tax_saved real DEFAULT 700,
  charge_flat_if_no_win boolean DEFAULT false,
  invoice_date date NOT NULL,
  days_due int DEFAULT 30,
  qb_item_name text DEFAULT 'Property Tax Protest',
  qb_desc_prefix text DEFAULT 'Tax savings',
  notes text,
  row_count int DEFAULT 0,
  billable_count int DEFAULT 0,
  total_invoice real DEFAULT 0,
  next_invoice_no int DEFAULT 1001
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own batches" ON public.batches;
CREATE POLICY "Users can read own batches" ON public.batches FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own batches" ON public.batches;
CREATE POLICY "Users can insert own batches" ON public.batches FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own batches" ON public.batches;
CREATE POLICY "Users can update own batches" ON public.batches FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own batches" ON public.batches;
CREATE POLICY "Users can delete own batches" ON public.batches FOR DELETE USING (auth.uid() = user_id);

-- 3) Batch rows
CREATE TABLE IF NOT EXISTS public.batch_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  row_index int NOT NULL,
  raw_client_name text NOT NULL,
  property_id text DEFAULT '',
  notice_value real DEFAULT 0,
  final_value real DEFAULT 0,
  reduction real DEFAULT 0,
  tax_saved real DEFAULT 0,
  base_fee real DEFAULT 0,
  manual_discount real DEFAULT 0,
  final_invoice real DEFAULT 0,
  status text DEFAULT 'STANDARD',
  matched_customer_id uuid,
  matched_customer_name text
);

ALTER TABLE public.batch_rows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read batch_rows of own batches" ON public.batch_rows;
CREATE POLICY "Users can read batch_rows of own batches" ON public.batch_rows FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND b.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert batch_rows into own batches" ON public.batch_rows;
CREATE POLICY "Users can insert batch_rows into own batches" ON public.batch_rows FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND b.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update batch_rows of own batches" ON public.batch_rows;
CREATE POLICY "Users can update batch_rows of own batches" ON public.batch_rows FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND b.user_id = auth.uid()));

-- 4) Subscriptions: plan per user (updated by your backend when Stripe webhooks fire)
-- plan must be one of: 'starter' | 'professional' | 'enterprise'
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Insert/update from backend only (e.g. Stripe webhook); no INSERT/UPDATE policy for auth.uid() so app users can't change their own plan

-- 5) Customers: one row per client (from saved uploads or added manually). Synced from batch rows when you save an upload.
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  property_id text DEFAULT '',
  email text,
  phone text,
  address1 text,
  city text,
  state text,
  zip text,
  qb_customer_ref text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, property_id)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own customers" ON public.customers;
CREATE POLICY "Users can read own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- If you already have a customers table without user_id, run: ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
