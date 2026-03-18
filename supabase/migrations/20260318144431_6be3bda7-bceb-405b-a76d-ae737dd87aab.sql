
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  session_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  session_label TEXT,
  num_boards INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings (public booking form)
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anyone to read bookings (simple admin, no auth needed for now)
CREATE POLICY "Anyone can view bookings" ON public.bookings FOR SELECT TO anon, authenticated USING (true);

-- Allow updates (for status changes)
CREATE POLICY "Anyone can update bookings" ON public.bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
