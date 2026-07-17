-- ─────────────────────────────────────────────────────────────────────────────
-- Review acquisition system (QR shirt + staff-triggered magic link).
--
-- review_requests: one row per personalized link a staff member generates for
-- a booking (via the admin "Demander un avis" button). Tracks the funnel
-- (created → opened → completed) so the admin "Avis" tab can show response
-- rates, not just raw review counts.
--
-- reviews: the actual rating/feedback a customer submits, from either a
-- personalized link (review_request_id set) or an anonymous QR-shirt scan
-- (review_request_id NULL). Soft-gate logic lives in the frontend: ≤3★ stays
-- private (status/feedback_text), ≥4★ is routed to Google/TripAdvisor and
-- recorded via routed_to for analytics.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days'
);

CREATE INDEX review_requests_booking_idx ON public.review_requests (booking_id);

CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_request_id UUID REFERENCES public.review_requests(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  source TEXT NOT NULL DEFAULT 'qr_shirt' CHECK (source IN ('qr_shirt', 'booking_link')),
  routed_to TEXT CHECK (routed_to IN ('google', 'tripadvisor', 'internal')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reviews_booking_idx ON public.reviews (booking_id);
CREATE INDEX reviews_rating_idx ON public.reviews (rating);
CREATE INDEX reviews_status_idx ON public.reviews (status);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Staff only (this project has no roles table — every table here trusts that
-- the only Supabase Auth sessions that exist belong to admins, gated client
-- side against a hardcoded email whitelist in AdminPage.tsx). Anon customers
-- never touch review_requests directly; they go through the SECURITY DEFINER
-- RPCs below, which expose only what the review page needs to render.
CREATE POLICY "Staff can view review requests" ON public.review_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create review requests" ON public.review_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Curated testimonials (admin flips is_featured) are the only reviews the
-- public site itself is ever allowed to read — everything else (raw ratings,
-- private feedback, phone numbers) stays staff-only.
CREATE POLICY "Anyone can view featured reviews" ON public.reviews
  FOR SELECT TO anon USING (is_featured = true);
-- Deliberately no anon INSERT policy: all customer-facing writes go through
-- submit_review() below, so review_request_id/booking_id are resolved from
-- the token server-side and can never be spoofed via the REST API.

-- ── Public RPCs used by /avis and /avis/:token ──────────────────────────────

-- Never returns phone/email — a leaked or guessed token can prefill a
-- greeting but can't be used to scrape customer contact info.
CREATE OR REPLACE FUNCTION public.get_review_request_public(p_token TEXT)
RETURNS TABLE (
  booking_id UUID,
  customer_first_name TEXT,
  activity TEXT,
  session_date DATE,
  is_expired BOOLEAN
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    rr.booking_id,
    split_part(b.customer_name, ' ', 1),
    b.activity,
    b.session_date,
    rr.expires_at < now()
  FROM public.review_requests rr
  JOIN public.bookings b ON b.id = rr.booking_id
  WHERE rr.token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_request_public(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_review_request_opened(p_token TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.review_requests SET opened_at = COALESCE(opened_at, now()) WHERE token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.mark_review_request_opened(TEXT) TO anon, authenticated;

-- The only way a review row is ever created. Resolves review_request_id and
-- booking_id from the token itself (never trusts client-supplied foreign
-- keys) and marks the request completed in the same transaction.
CREATE OR REPLACE FUNCTION public.submit_review(
  p_rating SMALLINT,
  p_routed_to TEXT,
  p_token TEXT DEFAULT NULL,
  p_feedback_text TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_request_id UUID;
  v_booking_id UUID;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;

  IF p_token IS NOT NULL THEN
    SELECT id, booking_id INTO v_request_id, v_booking_id
    FROM public.review_requests WHERE token = p_token;

    IF v_request_id IS NOT NULL THEN
      UPDATE public.review_requests SET completed_at = now() WHERE id = v_request_id;
    END IF;
  END IF;

  INSERT INTO public.reviews (
    review_request_id, booking_id, rating, feedback_text,
    contact_name, contact_phone, source, routed_to
  ) VALUES (
    v_request_id, v_booking_id, p_rating, p_feedback_text,
    p_contact_name, p_contact_phone,
    CASE WHEN v_request_id IS NOT NULL THEN 'booking_link' ELSE 'qr_shirt' END,
    p_routed_to
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review(SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
