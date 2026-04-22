import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'

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

export function createBrowserSupabaseClient(config: SupabaseClientConfig): SupabaseClient {
  if (!config.url) throw new Error('createBrowserSupabaseClient: url is required')
  if (!config.anonKey) throw new Error('createBrowserSupabaseClient: anonKey is required')
  return createBrowserClient(config.url, config.anonKey)
}

export interface ServerCookieAdapter {
  getAll: () => { name: string; value: string }[]
  setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => void
}

export function createServerSupabaseClient(
  config: SupabaseClientConfig,
  cookies: ServerCookieAdapter,
): SupabaseClient {
  if (!config.url) throw new Error('createServerSupabaseClient: url is required')
  if (!config.anonKey) throw new Error('createServerSupabaseClient: anonKey is required')
  return createServerClient(config.url, config.anonKey, { cookies })
}

export type { SupabaseClient, CookieOptions }
