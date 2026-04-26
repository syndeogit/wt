// Slice O: thin proxy for ION Karpathos's public Syndion lessons feed.
// Verbatim passthrough — no shaping. Future home for caching / Sentry beacons.
//
// Validation logic lives in `server/utils/syndion.parseLessonsRequest` so it
// can be unit-tested without mocking h3 / Nitro. This handler is a thin
// orchestrator: parse, fetch, map errors.

import { parseLessonsRequest } from '../../utils/syndion'
import type { SyndionResponse } from '../../utils/syndion'

const SYNDION_BASE = process.env.SYNDION_BASE_URL || 'https://ion-karpathos.vercel.app'

export default defineEventHandler(async (event): Promise<SyndionResponse> => {
  const parsed = parseLessonsRequest(
    getRouterParam(event, 'centre'),
    getQuery(event) as { days?: string; sport?: string },
  )
  if (!parsed.ok) {
    throw createError({ statusCode: parsed.statusCode, statusMessage: parsed.statusMessage })
  }

  try {
    return await $fetch<SyndionResponse>(`${SYNDION_BASE}/api/public/v1/lessons`, {
      query: parsed.upstreamQuery,
    })
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
