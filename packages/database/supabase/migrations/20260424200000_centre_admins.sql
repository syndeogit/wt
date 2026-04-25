-- Slice I: centre admin access.
--
-- A centre admin is an auth.user mapped to one or more centre slugs.
-- They can read bookings + rider profiles for their centre(s). They do not
-- insert or edit bookings (for now); status transitions will be a future
-- chunk with dedicated endpoints.
--
-- guest_email is a snapshot of the booking owner's auth email captured at
-- booking-creation time — saves the admin portal from needing to cross the
-- auth schema boundary.

CREATE TABLE public.centre_admins (
    user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    centre_slug text         NOT NULL,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, centre_slug)
);

COMMENT ON TABLE public.centre_admins IS 'Maps auth users to centres they administer. Many-to-many. Memberships provisioned via service role.';

ALTER TABLE public.centre_admins ENABLE ROW LEVEL SECURITY;

-- A user can see their own admin memberships (so the client can render the
-- "you administer centre X" UI). No insert/update/delete — service role only.
CREATE POLICY centre_admins_select_own ON public.centre_admins
    FOR SELECT USING (auth.uid() = user_id);

-- Helper: is the current user an admin of the given centre?
CREATE OR REPLACE FUNCTION public.is_centre_admin_of(slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.centre_admins
        WHERE user_id = auth.uid()
          AND centre_slug = slug
    );
$$;

-- Helper: is the current user an admin of the centre that owns this booking?
CREATE OR REPLACE FUNCTION public.is_centre_admin_of_booking_user(target_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.bookings b
        INNER JOIN public.centre_admins ca ON ca.centre_slug = b.centre_slug
        WHERE ca.user_id = auth.uid()
          AND b.user_id = target_user
    );
$$;

-- Bookings: centre admins can SELECT rows for centres they administer.
CREATE POLICY bookings_select_centre_admin ON public.bookings
    FOR SELECT USING (public.is_centre_admin_of(centre_slug));

-- Rider profiles: centre admins can SELECT the profile of a guest who has
-- a booking at a centre they administer.
CREATE POLICY rider_profiles_select_by_centre_admin ON public.rider_profiles
    FOR SELECT USING (public.is_centre_admin_of_booking_user(user_id));

-- Snapshot of booking owner's email at booking time.
ALTER TABLE public.bookings
    ADD COLUMN guest_email text;

COMMENT ON COLUMN public.bookings.guest_email IS
  'Snapshot of auth.users.email at booking time so the admin portal never needs to cross into the auth schema.';
