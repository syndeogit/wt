// GET /api/admin/hotel/bookings/[ref] — detail for a hotel admin.
// RLS lets the admin read this booking only if they administer its hotel.

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
    confirmation_email_sent_at: string | null
    created_at: string
    updated_at: string
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, booking_ref, centre_slug, product_id, guest_email, user_id, arrival, departure, amount_cents, currency, hotel_id, hotel_nightly_cents, hotel_total_cents, status, confirmation_email_sent_at, created_at, updated_at',
    )
    .eq('booking_ref', ref)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  const booking = data as BookingRow

  // Confirm caller is admin of this booking's hotel.
  if (!booking.hotel_id) {
    throw createError({ statusCode: 403, statusMessage: 'No hotel on this booking' })
  }
  const { data: adminCheck } = await supabase
    .from('hotel_admins')
    .select('hotel_id')
    .eq('user_id', user.id)
    .eq('hotel_id', booking.hotel_id)
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
