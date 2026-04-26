-- Slice N: rental add-ons attached to a booking.
-- add_on_ids: Directus wt_products.id values where kind=rental. Free-text array
-- because Directus is a separate system (same reasoning as centre_slug,
-- product_id, hotel_id — no FK to wt_*).
-- add_on_total_cents: server-computed denormalised sum across all selected
-- add-ons (each priceCents * nights). Independent of amount_cents (programme)
-- and hotel_total_cents.

ALTER TABLE public.bookings
    ADD COLUMN add_on_ids         text[]  NOT NULL DEFAULT '{}',
    ADD COLUMN add_on_total_cents integer NOT NULL DEFAULT 0
                                          CHECK (add_on_total_cents >= 0);

COMMENT ON COLUMN public.bookings.add_on_ids
    IS 'Directus wt_products.id values for rental add-ons selected on the confirm page.';
COMMENT ON COLUMN public.bookings.add_on_total_cents
    IS 'Server-computed sum across all add-ons (priceCents * nights). Independent of amount_cents (programme) and hotel_total_cents.';
