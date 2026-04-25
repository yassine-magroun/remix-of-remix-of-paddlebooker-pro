-- Extend bookings with activity, people_count, deposit_paid
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS activity TEXT NOT NULL DEFAULT 'paddle'
    CHECK (activity IN ('paddle','kayak','velo','famille','wakeboard')),
  ADD COLUMN IF NOT EXISTS people_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_activity_idx ON public.bookings (activity);
CREATE INDEX IF NOT EXISTS bookings_session_date_idx ON public.bookings (session_date);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON public.bookings (customer_id);

-- Equipment inventory (one row per equipment type)
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Anyone can update equipment" ON public.equipment;
CREATE POLICY "Anyone can view equipment" ON public.equipment FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update equipment" ON public.equipment FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.equipment (slug, label, total_quantity, available_quantity, deposit_amount, sort_order) VALUES
  ('paddle',    'Paddle Standard',    23, 23, 40, 1),
  ('kayak',     'Kayak Transparent',   2,  2, 36, 2),
  ('velo',      'Paddle Vélo',         1,  1, 50, 3),
  ('famille',   'Paddle Famille',      1,  1, 70, 4),
  ('wakeboard', 'Wakeboard',           3,  3, 60, 5)
ON CONFLICT (slug) DO NOTHING;
