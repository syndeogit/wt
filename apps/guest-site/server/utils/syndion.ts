// apps/guest-site/server/utils/syndion.ts
//
// Slice O: types + centre-slug -> Syndion-code map for the live lessons widget.
// Imported by the proxy handler (server side) and re-exported by app/utils/syndion.ts
// so the page template can use the gating function without pulling server code
// into the client bundle.

export interface SyndionLesson {
  id: string
  date: string // YYYY-MM-DD
  start: string // HH:MM
  end: string // HH:MM
  type: {
    code: string
    name: string
    sport: 'wingfoil' | 'windsurf' | 'kitesurf'
    level: 'beginner' | 'intermediate' | 'advanced'
    format: 'private' | 'group'
  }
  instructor: { colour: string }
  location: string
  capacity: number
  available_spots: number
  status: 'open' | 'confirmed' | 'full'
}

export interface SyndionResponse {
  centre: string
  generated_at: string
  cache_until: string
  lessons: SyndionLesson[]
}

export type SyndionSport = 'wingfoil' | 'windsurf' | 'kitesurf'

const SYNDION_CENTRES: Record<string, string> = {
  karpathos: 'KAR',
}

export function syndionCodeForSlug(slug: string): string | null {
  return SYNDION_CENTRES[slug] ?? null
}

const SPORTS: SyndionSport[] = ['wingfoil', 'windsurf', 'kitesurf']
export function isValidSport(s: string): s is SyndionSport {
  return SPORTS.includes(s as SyndionSport)
}

export function clampDays(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 7
  if (!Number.isFinite(n)) return 7
  return Math.min(30, Math.max(1, n))
}

export type LessonsQueryResult =
  | { ok: true; centreCode: string; upstreamQuery: Record<string, string | number> }
  | { ok: false; statusCode: number; statusMessage: string }

/**
 * Pure validator for the proxy: takes the raw centre slug + query map and
 * returns either the upstream query Syndion expects or an HTTP error to throw.
 * No I/O, no Nuxt/h3 dependencies — trivially unit-testable.
 */
export function parseLessonsRequest(
  centreSlug: string | undefined,
  query: { days?: string; sport?: string },
): LessonsQueryResult {
  if (!centreSlug) {
    return { ok: false, statusCode: 400, statusMessage: 'Missing centre slug' }
  }
  const code = syndionCodeForSlug(centreSlug)
  if (!code) {
    return { ok: false, statusCode: 404, statusMessage: 'Lessons unavailable for this centre' }
  }
  const upstreamQuery: Record<string, string | number> = {
    centre: code,
    days: clampDays(query.days),
  }
  if (query.sport) {
    if (!isValidSport(query.sport)) {
      return { ok: false, statusCode: 400, statusMessage: 'Invalid sport' }
    }
    upstreamQuery.sport = query.sport
  }
  return { ok: true, centreCode: code, upstreamQuery }
}
