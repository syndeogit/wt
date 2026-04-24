-- Slice F scaffolding: bookings table.
--
-- A booking captures the guest's intent-to-pay at the end of the /book flow.
-- Status starts at 'pending_payment'; Slice F real-Stripe work will flip it
-- to 'paid' via a checkout.session.completed webhook. While Stripe is not
-- wired in, rows land and stay pending_payment and the guest is told by email
-- how to complete payment (mailto fallback on the confirm page).
--
-- centre_slug and product_id are free-text because the source of truth is
-- Directus (separate system). No FK to wt_* — just descriptive references.

CREATE TABLE public.bookings (
    id                        uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref               text         UNIQUE NOT NULL,
    user_id                   uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    centre_slug               text         NOT NULL,
    product_id                text         NOT NULL,
    arrival                   date         NOT NULL,
    departure                 date         NOT NULL,
    amount_cents              integer      NOT NULL CHECK (amount_cents >= 0),
    currency                  text         NOT NULL DEFAULT 'EUR',
    status                    text         NOT NULL DEFAULT 'pending_payment'
                                           CHECK (status IN ('pending_payment','paid','cancelled','refunded')),
    stripe_session_id         text,
    stripe_payment_intent_id  text,
    created_at                timestamptz  NOT NULL DEFAULT now(),
    updated_at                timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT bookings_dates_check CHECK (departure > arrival)
);

CREATE INDEX bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX bookings_status_idx  ON public.bookings(status);

-- Keep updated_at honest.
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row-level security: users see only their own rows; service role bypasses.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_select_own ON public.bookings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY bookings_insert_own ON public.bookings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies: non-admin clients cannot change or remove
-- rows. The Stripe webhook (Slice F) runs as service_role and bypasses RLS.

COMMENT ON TABLE  public.bookings             IS 'Guest booking requests. pending_payment -> paid via Stripe webhook.';
COMMENT ON COLUMN public.bookings.centre_slug IS 'Directus wt_centres.slug — descriptive, no FK (Directus is a separate system).';
COMMENT ON COLUMN public.bookings.product_id  IS 'Directus wt_products.id (uuid). Same reason: no FK.';
