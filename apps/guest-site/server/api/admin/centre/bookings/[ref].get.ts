// GET /api/admin/centre/bookings/[ref] — full detail for an admin.
// RLS lets the admin read bookings for centres they administer and
// rider_profiles of users with bookings at those centres.

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign-in required' })
  }
  const ref = getRouterParam(event, 'ref')
  if (!ref) {
    throw createError({ statusCode: 400, statusMessage: 'Missing booking reference' })
  }

  const supabase = event.context.supabase

  interface BookingRow {
    id: string
    booking_ref: string
    centre_slug: string
    product_id: string
    guest_email: string | null
    user_id: string
    arrival: string
    departure: string
    amount_cents: number
    currency: string
    hotel_id: string | null
    hotel_nightly_cents: number | null
    hotel_total_cents: number | null
    status: string
    stripe_session_id: string | null
    confirmation_email_sent_at: string | null
    created_at: string
    updated_at: string
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, booking_ref, centre_slug, product_id, guest_email, user_id, arrival, departure, amount_cents, currency, hotel_id, hotel_nightly_cents, hotel_total_cents, status, stripe_session_id, confirmation_email_sent_at, created_at, updated_at',
    )
    .eq('booking_ref', ref)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  const booking = data as BookingRow

  // Confirm the signed-in user is an admin of this booking's centre
  // (RLS already enforces SELECT access; this just gives a cleaner 403).
  const { data: adminCheck } = await supabase
    .from('centre_admins')
    .select('centre_slug')
    .eq('user_id', user.id)
    .eq('centre_slug', booking.centre_slug)
    .maybeSingle()
  if (!adminCheck) {
    throw createError({ statusCode: 403, statusMessage: 'Not an admin of this booking' })
  }

  interface ProfileRow {
    first_name: string
    last_name: string
    phone: string | null
    primary_discipline: string | null
    level: string | null
    notes: string | null
  }

  const { data: profileData } = await supabase
    .from('rider_profiles')
    .select('first_name, last_name, phone, primary_discipline, level, notes')
    .eq('user_id', booking.user_id)
    .maybeSingle()
  const profile = (profileData ?? null) as ProfileRow | null

  return {
    booking: {
      bookingRef: booking.booking_ref,
      centreSlug: booking.centre_slug,
      productId: booking.product_id,
      guestEmail: booking.guest_email,
      arrival: booking.arrival,
      departure: booking.departure,
      amountCents: booking.amount_cents,
      currency: booking.currency,
      hotelId: booking.hotel_id,
      hotelNightlyCents: booking.hotel_nightly_cents,
      hotelTotalCents: booking.hotel_total_cents,
      status: booking.status,
      stripeSessionId: booking.stripe_session_id,
      confirmationEmailSentAt: booking.confirmation_email_sent_at,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    },
    profile: profile
      ? {
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          primaryDiscipline: profile.primary_discipline,
          level: profile.level,
          notes: profile.notes,
        }
      : null,
  }
})
