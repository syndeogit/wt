export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) return { user: null }
  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
    },
  }
})
