// GET /api/admin/centre/bookings?centre=<slug> — list bookings for admins.
// RLS enforces that the signed-in user is an admin of the requested centre;
// a non-admin just gets an empty list. We still check explicitly to return a
// clear 403 if the URL is wrong.

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign-in required' })
  }
  const q = getQuery(event)
  const centre = typeof q.centre === 'string' ? q.centre : null
  if (!centre) {
    throw createError({ statusCode: 400, statusMessage: 'Missing centre' })
  }

  const supabase = event.context.supabase

  const { data: adminRow } = await supabase
    .from('centre_admins')
    .select('centre_slug')
    .eq('user_id', user.id)
    .eq('centre_slug', centre)
    .maybeSingle()
  if (!adminRow) {
    throw createError({ statusCode: 403, statusMessage: 'Not an admin of this centre' })
  }

  interface BookingRow {
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
    hotel_total_cents: number | null
    status: string
    confirmation_email_sent_at: string | null
    created_at: string
  }
  interface ProfileRow {
    user_id: string
    first_name: string
    last_name: string
  }

  const { data: bookings, error: bookingsErr } = await supabase
    .from('bookings')
    .select(
      'booking_ref, centre_slug, product_id, guest_email, user_id, arrival, departure, amount_cents, currency, hotel_id, hotel_total_cents, status, confirmation_email_sent_at, created_at',
    )
    .eq('centre_slug', centre)
    .order('created_at', { ascending: false })
    .limit(100)

  if (bookingsErr) {
    throw createError({ statusCode: 500, statusMessage: bookingsErr.message })
  }
  const rows: BookingRow[] = (bookings ?? []) as BookingRow[]

  // Second round-trip: pull rider_profiles for the user_ids on these bookings.
  const userIds = [...new Set(rows.map((r) => r.user_id))]
  let profiles: Record<string, { first_name: string; last_name: string }> = {}
  if (userIds.length) {
    const { data: profileRows } = await supabase
      .from('rider_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds)
    profiles = Object.fromEntries(
      ((profileRows ?? []) as ProfileRow[]).map((p) => [
        p.user_id,
        { first_name: p.first_name, last_name: p.last_name },
      ]),
    )
  }

  return {
    bookings: rows.map((r) => ({
      bookingRef: r.booking_ref,
      centreSlug: r.centre_slug,
      productId: r.product_id,
      guestEmail: r.guest_email,
      guestFirstName: profiles[r.user_id]?.first_name ?? null,
      guestLastName: profiles[r.user_id]?.last_name ?? null,
      arrival: r.arrival,
      departure: r.departure,
      amountCents: r.amount_cents,
      currency: r.currency,
      hotelId: r.hotel_id,
      hotelTotalCents: r.hotel_total_cents,
      status: r.status,
      confirmationEmailSentAt: r.confirmation_email_sent_at,
      createdAt: r.created_at,
    })),
  }
})
