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
