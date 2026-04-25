// Prime the current-user useState on SSR by reading event.context.user directly
// (server middleware has already resolved it). Client hydration inherits via payload.
// adminCentres requires a DB round-trip so we fetch /api/me once on the server.
export default defineNuxtPlugin(async () => {
  const { user } = useCurrentUser()
  if (user.value) return

  if (import.meta.server) {
    const event = useRequestEvent()
    const ctxUser = event?.context.user
    if (!ctxUser) return
    // Resolve adminCentres via /api/me (same process; passes request context).
    const res = await $fetch<{ user: CurrentUser | null }>('/api/me', {
      headers: event?.headers as HeadersInit,
    }).catch(() => ({ user: null }))
    user.value = res.user
  }
})
