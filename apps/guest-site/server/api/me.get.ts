export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) return { user: null }

  // Pull admin centre memberships so UI can show admin links without a second round-trip.
  const supabase = event.context.supabase
  const { data: adminRows } = await supabase
    .from('centre_admins')
    .select('centre_slug')
    .eq('user_id', user.id)

  const adminCentres: string[] = (adminRows ?? []).map(
    (r: { centre_slug: string }) => r.centre_slug,
  )

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
      adminCentres,
    },
  }
})
