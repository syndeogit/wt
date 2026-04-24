// GET /api/profile — returns the signed-in user's rider profile, or null.

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign-in required' })
  }
  const supabase = event.context.supabase
  const { data, error } = await supabase
    .from('rider_profiles')
    .select('first_name, last_name, phone, primary_discipline, level, notes')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return { profile: data }
})
