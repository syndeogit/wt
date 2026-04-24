-- Slice E: rider_profiles table.
--
-- One profile per auth user (user_id is PK, which enforces the 1:1).
-- First + last name are required; discipline, level, notes, phone optional.
-- Profile is created/updated inline during the first booking flow and
-- editable later from /account.

CREATE TABLE public.rider_profiles (
    user_id              uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name           text         NOT NULL CHECK (length(first_name) > 0),
    last_name            text         NOT NULL CHECK (length(last_name)  > 0),
    phone                text,
    primary_discipline   text         CHECK (primary_discipline IN ('wingfoil','windsurf','kitesurf')),
    level                text         CHECK (level IN ('beginner','intermediate','advanced')),
    notes                text,
    created_at           timestamptz  NOT NULL DEFAULT now(),
    updated_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER rider_profiles_updated_at
    BEFORE UPDATE ON public.rider_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY rider_profiles_select_own ON public.rider_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY rider_profiles_insert_own ON public.rider_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY rider_profiles_update_own ON public.rider_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- No DELETE policy: rows are removed only when the auth user is deleted (FK cascade).

COMMENT ON TABLE public.rider_profiles IS 'One-to-one rider profile per auth user. Populated on first booking, editable from /account.';
