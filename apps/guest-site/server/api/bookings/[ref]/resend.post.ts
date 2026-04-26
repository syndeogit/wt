// POST /api/bookings/[ref]/resend — re-send the booking confirmation email.
// RLS-bound: only the booking's owner can trigger it. Rate-limited to one
// send per minute per booking via confirmation_email_sent_at.

const RATE_LIMIT_SECONDS = 60

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
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(
      'id, booking_ref, centre_slug, product_id, arrival, departure, amount_cents, currency, confirmation_email_sent_at, hotel_id, hotel_nightly_cents, hotel_total_cents, add_on_ids',
    )
    .eq('booking_ref', ref)
    .maybeSingle()
  if (fetchError) {
    throw createError({ statusCode: 500, statusMessage: fetchError.message })
  }
  if (!booking) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  // Rate limit
  if (booking.confirmation_email_sent_at) {
    const lastMs = new Date(booking.confirmation_email_sent_at).getTime()
    const deltaMs = Date.now() - lastMs
    if (deltaMs < RATE_LIMIT_SECONDS * 1000) {
      throw createError({
        statusCode: 429,
        statusMessage: `Please wait ${Math.ceil((RATE_LIMIT_SECONDS * 1000 - deltaMs) / 1000)}s before re-sending.`,
      })
    }
  }

  const centre = await fetchCentreBySlug(event, booking.centre_slug)
  if (!centre) {
    throw createError({ statusCode: 500, statusMessage: 'Centre no longer available' })
  }
  const products = await fetchProductsByCentreId(event, centre.id)
  const product = products.find((p) => p.id === booking.product_id)
  if (!product) {
    throw createError({ statusCode: 500, statusMessage: 'Product no longer available' })
  }

  const { data: profileRow } = await supabase
    .from('rider_profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .maybeSingle()

  let hotelName: string | null = null
  if (booking.hotel_id) {
    const hotels = await fetchHotelsByCentreId(event, centre.id)
    hotelName = hotels.find((h) => h.id === booking.hotel_id)?.name ?? null
  }

  const nights = Math.max(
    0,
    Math.round(
      (new Date(booking.departure).getTime() - new Date(booking.arrival).getTime())
        / (1000 * 60 * 60 * 24),
    ),
  )
  const addOnIds: string[] = booking.add_on_ids ?? []
  const addOnsForEmail = addOnIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p) => ({
      name: p.name,
      perDayCents: p.priceCents,
      nights,
      totalCents: p.priceCents * nights,
    }))

  const result = await sendBookingConfirmation({
    to: user.email ?? '',
    bookingRef: booking.booking_ref,
    centreName: centre.name,
    centreRegion: centre.region || null,
    centreCountry: centre.country || null,
    productName: product.name,
    productDurationLabel: product.durationLabel || null,
    arrival: booking.arrival,
    departure: booking.departure,
    amountCents: booking.amount_cents,
    currency: booking.currency,
    firstName: profileRow?.first_name ?? null,
    lastName: profileRow?.last_name ?? null,
    hotelName,
    hotelNightlyCents: booking.hotel_nightly_cents,
    hotelTotalCents: booking.hotel_total_cents,
    addOns: addOnsForEmail,
  })

  // Only stamp confirmation_email_sent_at on real sends — in stub mode no email
  // actually went out, so we don't want the UI to claim we sent one, and we
  // don't want the rate-limit to fire on calls that did nothing.
  if (result.sent) {
    await supabase
      .from('bookings')
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq('id', booking.id)
  }

  return {
    sent: result.sent,
    reason: result.reason ?? null,
  }
})
