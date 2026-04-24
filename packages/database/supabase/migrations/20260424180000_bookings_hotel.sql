-- Slice D: optional partner-hotel columns on bookings.
-- Hotel is optional — guest may sort their own accommodation.
-- hotel_id is the Directus wt_hotels.id (descriptive, no FK).
-- hotel_nightly_cents is the trusted per-night price captured server-side
-- from Directus at booking time. hotel_total_cents is the computed
-- per-booking cost (nightly * nights) stored denormalised so /book/success
-- and admin views don't need to recompute.

ALTER TABLE public.bookings
    ADD COLUMN hotel_id            text,
    ADD COLUMN hotel_nightly_cents integer CHECK (hotel_nightly_cents IS NULL OR hotel_nightly_cents >= 0),
    ADD COLUMN hotel_total_cents   integer CHECK (hotel_total_cents   IS NULL OR hotel_total_cents   >= 0),
    ADD CONSTRAINT bookings_hotel_fields_consistent CHECK (
        (hotel_id IS NULL AND hotel_nightly_cents IS NULL AND hotel_total_cents IS NULL)
        OR (hotel_id IS NOT NULL AND hotel_nightly_cents IS NOT NULL AND hotel_total_cents IS NOT NULL)
    );

COMMENT ON COLUMN public.bookings.hotel_id            IS 'Directus wt_hotels.id if the guest bundled accommodation; null if self-arranged.';
COMMENT ON COLUMN public.bookings.hotel_nightly_cents IS 'Hotel nightly rate captured server-side at booking time. Null when no hotel.';
COMMENT ON COLUMN public.bookings.hotel_total_cents   IS 'Denormalised hotel_nightly_cents * nights at booking time. Null when no hotel.';
