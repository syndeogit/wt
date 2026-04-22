import { createBrowserSupabaseClient, type SupabaseClient } from '@windtribe/shared'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const client = createBrowserSupabaseClient({
    url: config.public.supabaseUrl,
    anonKey: config.public.supabaseAnonKey,
  })

  return {
    provide: {
      supabase: client,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $supabase: SupabaseClient
  }
}
