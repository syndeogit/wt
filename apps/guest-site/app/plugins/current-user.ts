// Prime the current-user useState on SSR by reading event.context.user directly
// (server middleware has already resolved it). Client hydration inherits via payload.
export default defineNuxtPlugin(() => {
  const { user } = useCurrentUser()
  if (user.value) return

  if (import.meta.server) {
    const event = useRequestEvent()
    const ctxUser = event?.context.user
    if (ctxUser) {
      user.value = {
        id: ctxUser.id,
        email: ctxUser.email ?? null,
        createdAt: ctxUser.created_at ?? null,
      }
    }
  }
})
