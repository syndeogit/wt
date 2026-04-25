export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) return { user: null }

  // Pull admin memberships so UI can show admin links without a second round-trip.
  const supabase = event.context.supabase
  const [{ data: centreRows }, { data: hotelRows }] = await Promise.all([
    supabase.from('centre_admins').select('centre_slug').eq('user_id', user.id),
    supabase.from('hotel_admins').select('hotel_id').eq('user_id', user.id),
  ])

  const adminCentres: string[] = (centreRows ?? []).map(
    (r: { centre_slug: string }) => r.centre_slug,
  )
  const adminHotels: string[] = (hotelRows ?? []).map(
    (r: { hotel_id: string }) => r.hotel_id,
  )

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
      adminCentres,
      adminHotels,
    },
  }
})
