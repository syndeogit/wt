import { createServerSupabaseClient } from '@windtribe/shared'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabase = createServerSupabaseClient(
    {
      url: config.public.supabaseUrl,
      anonKey: config.public.supabaseAnonKey,
    },
    {
      getAll() {
        return Object.entries(parseCookies(event)).map(([name, value]) => ({ name, value }))
      },
      setAll(cookies) {
        for (const c of cookies) {
          setCookie(event, c.name, c.value, c.options)
        }
      },
    },
  )
  event.context.supabase = supabase

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  event.context.user = error ? null : user
})
