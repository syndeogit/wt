// apps/guest-site/server/api/lessons/[centre].get.ts
//
// Slice O: thin proxy for ION Karpathos's public Syndion lessons feed.
// Verbatim passthrough — no shaping. Future home for caching / Sentry beacons.

import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { isValidSport, syndionCodeForSlug } from '../../utils/syndion'
import type { SyndionResponse } from '../../utils/syndion'

const SYNDION_BASE = process.env.SYNDION_BASE_URL || 'https://ion-karpathos.vercel.app'

function clampDays(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 7
  if (!Number.isFinite(n)) return 7
  return Math.min(30, Math.max(1, n))
}

const handler = defineEventHandler(async (event): Promise<SyndionResponse> => {
  const centreSlug = getRouterParam(event, 'centre')
  if (!centreSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing centre slug' })
  }

  const code = syndionCodeForSlug(centreSlug)
  if (!code) {
    throw createError({ statusCode: 404, statusMessage: 'Lessons unavailable for this centre' })
  }

  const query = getQuery(event) as { days?: string; sport?: string }
  const days = clampDays(query.days)

  const upstreamQuery: Record<string, string | number> = { centre: code, days }
  if (query.sport) {
    if (!isValidSport(query.sport)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid sport' })
    }
    upstreamQuery.sport = query.sport
  }

  try {
    const response = await $fetch<SyndionResponse>(
      `${SYNDION_BASE}/api/public/v1/lessons`,
      { query: upstreamQuery },
    )
    return response
  }
  catch (err: unknown) {
    const e = err as { statusCode?: number; status?: number }
    const upstreamStatus = e.statusCode ?? e.status
    if (upstreamStatus && upstreamStatus >= 400 && upstreamStatus < 600) {
      throw createError({ statusCode: 502, statusMessage: 'Lessons feed returned an error' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Lessons feed temporarily unavailable' })
  }
})

// Cast needed so the export satisfies (event: unknown) => Promise<unknown> in test imports;
// h3's EventHandler callable signature uses H3Event<Request>, not unknown.
export default handler as unknown as (event: unknown) => Promise<SyndionResponse>
