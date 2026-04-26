import type { CurrentUser } from './useCurrentUser'

export type Discipline = 'wingfoil' | 'windsurf' | 'kitesurf'
export type RiderLevel = 'beginner' | 'intermediate' | 'advanced'

export interface SoftRiderProfile {
  discipline: Discipline
  level: RiderLevel
  skipped?: boolean
  savedAt: string
}

interface StoredV1 {
  v: 1
  discipline?: Discipline
  level?: RiderLevel
  skipped?: boolean
  savedAt: string
}

const KEY = 'wt:rider-profile-soft'

export function useRiderProfileStorage() {
  function read(): SoftRiderProfile | null {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as StoredV1
      if (parsed?.v !== 1) return null
      if (parsed.skipped) {
        return { discipline: 'wingfoil', level: 'beginner', skipped: true, savedAt: parsed.savedAt }
      }
      if (!parsed.discipline || !parsed.level) return null
      return {
        discipline: parsed.discipline,
        level: parsed.level,
        savedAt: parsed.savedAt,
      }
    }
    catch {
      return null
    }
  }

  function write(input: { discipline: Discipline; level: RiderLevel }) {
    if (typeof localStorage === 'undefined') return
    const stored: StoredV1 = { v: 1, ...input, savedAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(stored))
  }

  function skip() {
    if (typeof localStorage === 'undefined') return
    const stored: StoredV1 = { v: 1, skipped: true, savedAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(stored))
  }

  function clear() {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(KEY)
  }

  return { read, write, skip, clear }
}

interface RiderProfileServerRow {
  primary_discipline: Discipline | null
  level: RiderLevel | null
}

export function useRiderProfile() {
  const storage = useRiderProfileStorage()
  const local = useState<SoftRiderProfile | null>('rider-profile-soft', () => null)

  function load() {
    local.value = storage.read()
  }

  function setProfile(input: { discipline: Discipline; level: RiderLevel }) {
    storage.write(input)
    load()
  }

  function skip() {
    storage.skip()
    load()
  }

  function clear() {
    storage.clear()
    load()
  }

  // Server-side hydrate: if a signed-in user has a rider_profiles row already,
  // prefer that over localStorage. Caller passes the row in.
  function hydrateFromServer(row: RiderProfileServerRow | null) {
    if (row?.primary_discipline && row.level) {
      local.value = {
        discipline: row.primary_discipline,
        level: row.level,
        savedAt: new Date().toISOString(),
      }
    }
  }

  // Sign-in moment: if DB is empty AND we have a soft profile, push it up.
  async function syncToServerIfNeeded(_user: CurrentUser | null) {
    if (!_user) return
    const soft = storage.read()
    if (!soft || soft.skipped) return
    try {
      const res = await $fetch<{ profile: RiderProfileServerRow | null }>('/api/profile')
      if (res?.profile?.primary_discipline) return // server already has one
      await $fetch('/api/profile', {
        method: 'PUT',
        body: {
          firstName: '',
          lastName: '',
          phone: '',
          primaryDiscipline: soft.discipline,
          level: soft.level,
          notes: '',
        },
      })
    }
    catch (err) {
      console.error('[useRiderProfile] syncToServerIfNeeded failed', err)
    }
  }

  const isSet = computed(
    () => local.value !== null && !local.value.skipped,
  )
  const isSkipped = computed(() => local.value?.skipped === true)

  return { profile: local, load, setProfile, skip, clear, hydrateFromServer, syncToServerIfNeeded, isSet, isSkipped }
}
