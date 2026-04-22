export default defineNuxtRouteMiddleware((to) => {
  const { user } = useCurrentUser()
  if (!user.value) {
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/login?redirect=${redirect}`)
  }
})
