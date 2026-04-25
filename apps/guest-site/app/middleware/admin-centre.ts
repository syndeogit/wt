// Gate admin routes: signed-in AND admin of at least one centre.
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useCurrentUser()
  if (!user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!user.value.adminCentres?.length) {
    return navigateTo('/account')
  }
})
