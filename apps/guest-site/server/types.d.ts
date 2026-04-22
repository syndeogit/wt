import type { SupabaseClient } from '@windtribe/shared'
import type { User } from '@supabase/supabase-js'

declare module 'h3' {
  interface H3EventContext {
    supabase: SupabaseClient
    user: User | null
  }
}

export {}
