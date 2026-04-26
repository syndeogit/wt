import { beforeEach, describe, expect, it } from 'vitest'
import { useRiderProfileStorage } from './useRiderProfile'

describe('useRiderProfileStorage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing is stored', () => {
    const s = useRiderProfileStorage()
    expect(s.read()).toBeNull()
  })

  it('round-trips a written profile', () => {
    const s = useRiderProfileStorage()
    s.write({ discipline: 'wingfoil', level: 'beginner' })
    const got = s.read()
    expect(got?.discipline).toBe('wingfoil')
    expect(got?.level).toBe('beginner')
    expect(got?.skipped).toBeFalsy()
    expect(got?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })

  it('skip() persists a skipped marker without discipline/level', () => {
    const s = useRiderProfileStorage()
    s.skip()
    const got = s.read()
    expect(got?.skipped).toBe(true)
  })

  it('clear() removes the entry', () => {
    const s = useRiderProfileStorage()
    s.write({ discipline: 'kitesurf', level: 'intermediate' })
    s.clear()
    expect(s.read()).toBeNull()
  })

  it('ignores entries with a different schema version', () => {
    localStorage.setItem('wt:rider-profile-soft', JSON.stringify({ v: 0, discipline: 'x' }))
    const s = useRiderProfileStorage()
    expect(s.read()).toBeNull()
  })
})
