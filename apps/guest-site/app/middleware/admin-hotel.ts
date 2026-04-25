// Gate hotel-admin routes: signed-in AND admin of at least one hotel.
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useCurrentUser()
  if (!user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!user.value.adminHotels?.length) {
    return navigateTo('/account')
  }
})
