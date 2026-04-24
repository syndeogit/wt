// GET /api/bookings/[ref] — returns the booking row for the signed-in user.
// RLS enforces that only the row-owner can read; a stranger's ref returns 404.

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
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, booking_ref, centre_slug, product_id, arrival, departure, amount_cents, currency, status, created_at, confirmation_email_sent_at, hotel_id, hotel_nightly_cents, hotel_total_cents',
    )
    .eq('booking_ref', ref)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }
  return { booking: data }
})
