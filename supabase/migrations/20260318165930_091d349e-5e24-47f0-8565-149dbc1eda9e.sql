
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  session_label TEXT,
  capacity INTEGER NOT NULL DEFAULT 6,
  remaining_spots INTEGER NOT NULL DEFAULT 6,
  price_per_board NUMERIC(10,2) NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_date, time_slot)
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON public.sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Function to auto-generate sessions for a date
CREATE OR REPLACE FUNCTION public.generate_sessions_for_date(target_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.sessions (session_date, time_slot, session_label, capacity, remaining_spots, price_per_board)
  VALUES
    (target_date, '7:00 – 9:00', 'Dawn Glide', 6, 6, 15),
    (target_date, '10:00 – 12:00', 'Morning Calm', 6, 6, 15),
    (target_date, '13:00 – 15:00', 'Midday Sun', 6, 6, 15),
    (target_date, '16:00 – 18:00', 'Golden Hour', 6, 6, 15),
    (target_date, '18:30 – 20:00', 'Sunset Session', 6, 6, 15)
  ON CONFLICT (session_date, time_slot) DO NOTHING;
END;
$$;

-- Generate sessions for the next 14 days
DO $$
DECLARE d DATE;
BEGIN
  FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '13 days', '1 day')::DATE
  LOOP
    PERFORM public.generate_sessions_for_date(d);
  END LOOP;
END;
$$;

-- Trigger to decrement remaining_spots on booking insert
CREATE OR REPLACE FUNCTION public.decrement_spots_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.sessions
  SET remaining_spots = remaining_spots - NEW.num_boards
  WHERE session_date = NEW.session_date AND time_slot = NEW.time_slot
    AND remaining_spots >= NEW.num_boards;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough spots available';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_insert
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.decrement_spots_on_booking();
