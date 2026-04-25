export interface CurrentUser {
  id: string
  email: string | null
  createdAt: string | null
  adminCentres: string[]
  adminHotels: string[]
}

export function useCurrentUser() {
  const user = useState<CurrentUser | null>('current-user', () => null)

  async function refresh() {
    const res = await $fetch<{ user: CurrentUser | null }>('/api/me')
    user.value = res.user
    return user.value
  }

  return { user, refresh }
}
