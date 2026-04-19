import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseClientConfig {
  url: string
  anonKey: string
}

export function createSupabaseClient(config: SupabaseClientConfig): SupabaseClient {
  if (!config.url) throw new Error('createSupabaseClient: url is required')
  if (!config.anonKey) throw new Error('createSupabaseClient: anonKey is required')

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export type { SupabaseClient }
