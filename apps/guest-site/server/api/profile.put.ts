// PUT /api/profile — upsert the signed-in user's rider profile.
// first_name + last_name are required; other fields are optional.

const disciplines = ['wingfoil', 'windsurf', 'kitesurf'] as const
const levels = ['beginner', 'intermediate', 'advanced'] as const

interface ProfileInput {
  firstName?: string
  lastName?: string
  phone?: string | null
  primaryDiscipline?: string | null
  level?: string | null
  notes?: string | null
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length ? t : null
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign-in required' })
  }

  const body = await readBody<ProfileInput>(event)
  const first = trimOrNull(body?.firstName)
  const last = trimOrNull(body?.lastName)
  if (!first || !last) {
    throw createError({ statusCode: 400, statusMessage: 'First and last name are required' })
  }

  const phone = trimOrNull(body?.phone)
  const notes = trimOrNull(body?.notes)

  const disciplineRaw = trimOrNull(body?.primaryDiscipline)
  const discipline =
    disciplineRaw && (disciplines as readonly string[]).includes(disciplineRaw)
      ? disciplineRaw
      : null

  const levelRaw = trimOrNull(body?.level)
  const level =
    levelRaw && (levels as readonly string[]).includes(levelRaw) ? levelRaw : null

  const supabase = event.context.supabase
  const { data, error } = await supabase
    .from('rider_profiles')
    .upsert(
      {
        user_id: user.id,
        first_name: first,
        last_name: last,
        phone,
        primary_discipline: discipline,
        level,
        notes,
      },
      { onConflict: 'user_id' },
    )
    .select('first_name, last_name, phone, primary_discipline, level, notes')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return { profile: data }
})
