-- ─────────────────────────────────────────────────────────────────────────────
-- V1 HOTFIX: Drop ALL triggers on bookings and recreate only the safe one.
--
-- Root cause: a manually-deployed trigger (Telegram/payment integration attempt)
-- was referencing a `payments` table / relationship that never existed, causing
-- every booking INSERT to raise "Could not find a relationship between 'bookings'
-- and 'payments'" and roll back the transaction.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop every known (and possible) trigger on bookings to start clean.
DROP TRIGGER IF EXISTS on_booking_insert              ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_payment_insert      ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_telegram_notify     ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_notify              ON public.bookings;
DROP TRIGGER IF EXISTS booking_after_insert           ON public.bookings;
DROP TRIGGER IF EXISTS handle_new_booking             ON public.bookings;
DROP TRIGGER IF EXISTS send_telegram_on_booking       ON public.bookings;
DROP TRIGGER IF EXISTS create_payment_on_booking      ON public.bookings;
DROP TRIGGER IF EXISTS booking_created                ON public.bookings;

-- 2. Drop stale trigger functions that may reference the missing payments table.
DROP FUNCTION IF EXISTS public.notify_deposit_received()        CASCADE;
DROP FUNCTION IF EXISTS public.send_telegram_notification()     CASCADE;
DROP FUNCTION IF EXISTS public.create_payment_record()          CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_booking()             CASCADE;

-- 3. Recreate the availability-decrement function — non-blocking version.
--    If no matching session row exists (session wasn't pre-generated) the booking
--    is still accepted; the manual availability count in the wizard prevents
--    overbooking via a direct bookings query anyway.
CREATE OR REPLACE FUNCTION public.decrement_spots_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.sessions
  SET    remaining_spots = remaining_spots - NEW.num_boards
  WHERE  session_date = NEW.session_date
    AND  time_slot    = NEW.time_slot
    AND  remaining_spots >= NEW.num_boards;
  -- Intentionally no RAISE EXCEPTION when session row is missing;
  -- the wizard enforces capacity via a direct bookings head-count.
  RETURN NEW;
END;
$$;

-- 4. Re-attach the single safe trigger.
CREATE TRIGGER on_booking_insert
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.decrement_spots_on_booking();
