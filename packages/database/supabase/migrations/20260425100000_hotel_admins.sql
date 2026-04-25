-- Slice J: hotel admin access.
--
-- A hotel admin is an auth.user mapped to one or more Directus wt_hotels.id
-- values. They see bookings that bundled their hotel, plus those guests'
-- rider profiles. They do NOT see no-hotel bookings or bookings that picked
-- a different hotel at the same centre.

CREATE TABLE public.hotel_admins (
    user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hotel_id    text         NOT NULL,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, hotel_id)
);

COMMENT ON TABLE public.hotel_admins IS 'Maps auth users to Directus wt_hotels.id values they administer. Memberships provisioned via service role.';

ALTER TABLE public.hotel_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY hotel_admins_select_own ON public.hotel_admins
    FOR SELECT USING (auth.uid() = user_id);

-- Helper: is the current user an admin of this specific hotel?
CREATE OR REPLACE FUNCTION public.is_hotel_admin_of(target_hotel text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.hotel_admins
        WHERE user_id = auth.uid()
          AND hotel_id = target_hotel
    );
$$;

-- Helper: is the current user a hotel admin of any hotel that's on a
-- booking belonging to target_user?
CREATE OR REPLACE FUNCTION public.is_hotel_admin_of_booking_user(target_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.bookings b
        INNER JOIN public.hotel_admins ha ON ha.hotel_id = b.hotel_id
        WHERE ha.user_id = auth.uid()
          AND b.user_id = target_user
    );
$$;

-- Bookings: hotel admins SELECT only bookings that bundled THEIR hotel.
-- Bookings without a hotel, or with another hotel at the same centre, are
-- invisible.
CREATE POLICY bookings_select_hotel_admin ON public.bookings
    FOR SELECT USING (
        hotel_id IS NOT NULL AND public.is_hotel_admin_of(hotel_id)
    );

-- Rider profiles: hotel admins see profiles of guests with bookings at
-- their hotel(s).
CREATE POLICY rider_profiles_select_by_hotel_admin ON public.rider_profiles
    FOR SELECT USING (public.is_hotel_admin_of_booking_user(user_id));
