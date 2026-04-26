// POST /api/bookings/create — guest-initiated booking creation.
//
// Must run as the signed-in user (RLS enforces user_id = auth.uid() on insert).
// Price is read server-side from Directus so a client cannot manipulate it.

function generateBookingRef(centreSlug: string, now: Date): string {
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '')
  const initials = centreSlug.slice(0, 2).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `WT-${initials}-${yyyymmdd}-${rand}`
}

const dateOnly = /^\d{4}-\d{2}-\d{2}$/

function nightsBetween(arrivalISO: string, departureISO: string): number {
  const ms = new Date(departureISO).getTime() - new Date(arrivalISO).getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign-in required' })
  }

  const body = await readBody<{
    centreSlug?: string
    productId?: string
    arrival?: string
    departure?: string
    hotelId?: string | null
    addOnIds?: string[]
  }>(event)

  if (!body?.centreSlug || !body.productId || !body.arrival || !body.departure) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }
  if (!dateOnly.test(body.arrival) || !dateOnly.test(body.departure)) {
    throw createError({ statusCode: 400, statusMessage: 'Dates must be YYYY-MM-DD' })
  }
  if (body.departure <= body.arrival) {
    throw createError({ statusCode: 400, statusMessage: 'Departure must be after arrival' })
  }

  const centre = await fetchCentreBySlug(event, body.centreSlug)
  if (!centre) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown centre' })
  }
  const products = await fetchProductsByCentreId(event, centre.id)
  const product = products.find((p) => p.id === body.productId)
  if (!product) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown product for this centre' })
  }

  const nights = nightsBetween(body.arrival, body.departure)

  // Optional partner hotel
  let hotelId: string | null = null
  let hotelNightlyCents: number | null = null
  let hotelTotalCents: number | null = null
  if (body.hotelId) {
    const hotels = await fetchHotelsByCentreId(event, centre.id)
    const hotel = hotels.find((h) => h.id === body.hotelId)
    if (!hotel) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown hotel for this centre' })
    }
    hotelId = hotel.id
    hotelNightlyCents = hotel.nightlyFromCents
    hotelTotalCents = hotelNightlyCents * nights
  }

  // Optional rental add-ons. Each must be a kind=rental product at this centre.
  const resolvedAddOnIds: string[] = []
  let addOnTotalCents = 0
  if (Array.isArray(body.addOnIds) && body.addOnIds.length) {
    for (const id of body.addOnIds) {
      const addOn = products.find((p) => p.id === id && p.kind === 'rental')
      if (!addOn) {
        throw createError({
          statusCode: 400,
          statusMessage: `Add-on ${id} is not a rental at this centre`,
        })
      }
      resolvedAddOnIds.push(addOn.id)
      addOnTotalCents += addOn.priceCents * nights
    }
  }

  const supabase = event.context.supabase
  const bookingRef = generateBookingRef(body.centreSlug, new Date())

  const { data: inserted, error: insertError } = await supabase
    .from('bookings')
    .insert({
      booking_ref: bookingRef,
      user_id: user.id,
      guest_email: user.email ?? null,
      centre_slug: body.centreSlug,
      product_id: body.productId,
      arrival: body.arrival,
      departure: body.departure,
      amount_cents: product.priceCents,
      currency: product.currency,
      hotel_id: hotelId,
      hotel_nightly_cents: hotelNightlyCents,
      hotel_total_cents: hotelTotalCents,
      add_on_ids: resolvedAddOnIds,
      add_on_total_cents: addOnTotalCents,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    throw createError({
      statusCode: 500,
      statusMessage: `Booking insert failed: ${insertError?.message ?? 'unknown'}`,
    })
  }

  const origin = getRequestURL(event).origin
  const successUrl = `${origin}/book/success?ref=${encodeURIComponent(bookingRef)}`
  const cancelUrl = `${origin}/book/${encodeURIComponent(body.centreSlug)}/confirm?products=${encodeURIComponent(body.productId)}&from=${body.arrival}&to=${body.departure}`

  const checkout = await createCheckoutSession({
    bookingRef,
    amountCents: product.priceCents,
    currency: product.currency,
    productName: product.name,
    successUrl,
    cancelUrl,
  })

  if (checkout.sessionId) {
    await supabase
      .from('bookings')
      .update({ stripe_session_id: checkout.sessionId })
      .eq('id', inserted.id)
  }

  // Best-effort booking confirmation email. Never fails the booking.
  try {
    const { data: profileRow } = await supabase
      .from('rider_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const hotelName = hotelId
      ? (await fetchHotelsByCentreId(event, centre.id)).find((h) => h.id === hotelId)?.name ?? null
      : null

    const emailResult = await sendBookingConfirmation({
      to: user.email ?? '',
      bookingRef,
      centreName: centre.name,
      centreRegion: centre.region || null,
      centreCountry: centre.country || null,
      productName: product.name,
      productDurationLabel: product.durationLabel || null,
      arrival: body.arrival,
      departure: body.departure,
      amountCents: product.priceCents,
      currency: product.currency,
      firstName: profileRow?.first_name ?? null,
      lastName: profileRow?.last_name ?? null,
      hotelName,
      hotelNightlyCents,
      hotelTotalCents,
    })
    if (emailResult.sent) {
      await supabase
        .from('bookings')
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', inserted.id)
    }
  } catch (err) {
    console.error('[bookings/create] email send threw', err)
  }

  return { url: checkout.url, bookingRef }
})
