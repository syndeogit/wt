export {
  createSupabaseClient,
  createBrowserSupabaseClient,
  createServerSupabaseClient,
  type SupabaseClient,
  type SupabaseClientConfig,
  type ServerCookieAdapter,
  type CookieOptions,
} from './supabase'

export function add(a: number, b: number): number {
  return a + b
}
