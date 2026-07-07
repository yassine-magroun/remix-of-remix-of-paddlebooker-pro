-- ─────────────────────────────────────────────────────────────────────────────
-- Retire the `sessions` table entirely.
--
-- It was a 6-capacity/range-slot model ("7:00 – 9:00", capacity 6) that never
-- matched the real booking flow's point-in-time slots ('05:00', '06:15', ...,
-- INVENTORY_MAX_UNITS = 23 / equipment.available_quantity). Live availability
-- is computed directly from `bookings`. The only two things that still touched
-- `sessions` were the admin "Disponibilité" tab (removed) and the legacy
-- `/book` page (retired) — both gone from the frontend, so this is safe.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_booking_insert ON public.bookings;
DROP FUNCTION IF EXISTS public.decrement_spots_on_booking() CASCADE;
DROP FUNCTION IF EXISTS public.generate_sessions_for_date(date) CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
