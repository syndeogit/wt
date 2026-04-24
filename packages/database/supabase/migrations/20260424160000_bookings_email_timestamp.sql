-- Slice G: track when a booking's confirmation email was last sent.
-- Used by the re-send endpoint as a simple rate-limit signal and by
-- /book/success to show "sent" / "not yet" hints.

ALTER TABLE public.bookings
    ADD COLUMN confirmation_email_sent_at timestamptz;

COMMENT ON COLUMN public.bookings.confirmation_email_sent_at IS
  'When the booking confirmation email was last sent (via Resend, Slice G). Null until first send. Used to rate-limit re-sends.';
