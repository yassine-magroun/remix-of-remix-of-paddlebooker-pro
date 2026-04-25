 -- Customers: one row per unique human (deduped by phone, falling back to email + name).
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  first_session_date DATE,
  last_session_date DATE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'gmail_import',
  sources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  raw_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_key
  ON public.customers (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers (email);
CREATE INDEX IF NOT EXISTS customers_full_name_idx ON public.customers (full_name);

-- Reservations imported from Gmail. Keeps the full raw email for manual correction.
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  session_date DATE,
  time_slot TEXT,
  num_participants INTEGER,
  estimated_price NUMERIC(10,2),
  parsed_full_name TEXT,
  parsed_phone TEXT,
  parsed_email TEXT,
  parsing_confidence NUMERIC(3,2),
  gmail_message_id TEXT UNIQUE,
  gmail_thread_id TEXT,
  gmail_subject TEXT,
  gmail_from TEXT,
  gmail_received_at TIMESTAMPTZ,
  raw_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_customer_idx ON public.reservations (customer_id);
CREATE INDEX IF NOT EXISTS reservations_session_date_idx ON public.reservations (session_date);
CREATE INDEX IF NOT EXISTS reservations_received_idx ON public.reservations (gmail_received_at);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update customers" ON public.customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view reservations" ON public.reservations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert reservations" ON public.reservations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update reservations" ON public.reservations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Keep customers.updated_at fresh.
CREATE OR REPLACE FUNCTION public.touch_customer_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_touch_updated_at ON public.customers;
CREATE TRIGGER customers_touch_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.touch_customer_updated_at();
