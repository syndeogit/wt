import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the global $fetch BEFORE importing the handler so the import sees the mock
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock h3 helpers used by the handler so we can call defineEventHandler directly
vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    getRouterParam: (event: unknown, name: string) =>
      (event as { context: { params: Record<string, string> } }).context.params[name],
    getQuery: (event: unknown) => (event as { context: { query: Record<string, string> } }).context.query,
    createError: (opts: { statusCode: number; statusMessage?: string }) => {
      const err = new Error(opts.statusMessage ?? '') as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  }
})

const sampleResponse = {
  centre: 'KAR',
  generated_at: '2026-04-26T12:00:00Z',
  cache_until: '2026-04-26T12:01:00Z',
  lessons: [],
}

function makeEvent(centre: string, query: Record<string, string> = {}) {
  return { context: { params: { centre }, query } }
}

let handler: (event: unknown) => Promise<unknown>
beforeEach(async () => {
  mockFetch.mockReset()
  // Re-import the handler under each test so the mock is fresh
  vi.resetModules()
  handler = (await import('./[centre].get')).default
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/lessons/[centre]', () => {
  it('404s on unknown centre slug', async () => {
    await expect(handler(makeEvent('atlantis'))).rejects.toMatchObject({ statusCode: 404 })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('passes mapped centre code to Syndion with default days=7', async () => {
    mockFetch.mockResolvedValue(sampleResponse)
    await handler(makeEvent('karpathos'))
    expect(mockFetch).toHaveBeenCalledWith(
      'https://ion-karpathos.vercel.app/api/public/v1/lessons',
      expect.objectContaining({ query: { centre: 'KAR', days: 7 } }),
    )
  })

  it('clamps days to 1..30', async () => {
    mockFetch.mockResolvedValue(sampleResponse)
    await handler(makeEvent('karpathos', { days: '99' }))
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ query: { centre: 'KAR', days: 30 } }))

    mockFetch.mockClear()
    await handler(makeEvent('karpathos', { days: '0' }))
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ query: { centre: 'KAR', days: 1 } }))
  })

  it('passes valid sport through', async () => {
    mockFetch.mockResolvedValue(sampleResponse)
    await handler(makeEvent('karpathos', { sport: 'wingfoil' }))
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ query: { centre: 'KAR', days: 7, sport: 'wingfoil' } }),
    )
  })

  it('400s on invalid sport', async () => {
    await expect(handler(makeEvent('karpathos', { sport: 'rowing' }))).rejects.toMatchObject({ statusCode: 400 })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rethrows network failures as 503', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(handler(makeEvent('karpathos'))).rejects.toMatchObject({ statusCode: 503 })
  })

  it('returns successful response verbatim', async () => {
    mockFetch.mockResolvedValue(sampleResponse)
    const result = await handler(makeEvent('karpathos'))
    expect(result).toEqual(sampleResponse)
  })
})
