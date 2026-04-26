// Slice O: unit tests for the lessons-proxy validation layer.
//
// We test the pure `parseLessonsRequest` helper rather than the h3 handler
// directly — h3 isn't a direct dep of this workspace (transitive through
// nitro/nuxt), and mocking it from vitest needs a fragile alias hack. Pure-
// function testing covers the contract the spec actually cares about
// (centre validation, days clamp, sport validation, upstream-query shape)
// without any Nitro coupling.

import { describe, expect, it } from 'vitest'
import { parseLessonsRequest } from '../../utils/syndion'

describe('parseLessonsRequest', () => {
  it('400s on missing centre slug', () => {
    expect(parseLessonsRequest(undefined, {})).toEqual({
      ok: false,
      statusCode: 400,
      statusMessage: 'Missing centre slug',
    })
  })

  it('404s on unknown centre slug', () => {
    expect(parseLessonsRequest('atlantis', {})).toEqual({
      ok: false,
      statusCode: 404,
      statusMessage: 'Lessons unavailable for this centre',
    })
  })

  it('maps karpathos -> KAR with default days=7', () => {
    expect(parseLessonsRequest('karpathos', {})).toEqual({
      ok: true,
      centreCode: 'KAR',
      upstreamQuery: { centre: 'KAR', days: 7 },
    })
  })

  it('clamps days to 1..30', () => {
    expect(parseLessonsRequest('karpathos', { days: '99' })).toMatchObject({
      ok: true,
      upstreamQuery: { centre: 'KAR', days: 30 },
    })
    expect(parseLessonsRequest('karpathos', { days: '0' })).toMatchObject({
      ok: true,
      upstreamQuery: { centre: 'KAR', days: 1 },
    })
    expect(parseLessonsRequest('karpathos', { days: 'banana' })).toMatchObject({
      ok: true,
      upstreamQuery: { centre: 'KAR', days: 7 },
    })
  })

  it('passes valid sport through', () => {
    expect(parseLessonsRequest('karpathos', { sport: 'wingfoil' })).toMatchObject({
      ok: true,
      upstreamQuery: { centre: 'KAR', days: 7, sport: 'wingfoil' },
    })
  })

  it('400s on invalid sport', () => {
    expect(parseLessonsRequest('karpathos', { sport: 'rowing' })).toEqual({
      ok: false,
      statusCode: 400,
      statusMessage: 'Invalid sport',
    })
  })
})
