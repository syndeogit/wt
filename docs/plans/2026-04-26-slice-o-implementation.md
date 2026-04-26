# Slice O — Live lessons widget on /karpathos (implementation plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mount a journal-style "Lessons this week" widget on `/karpathos` that reads ION's public Syndion lessons feed via a thin server-side proxy. Closes WT-114.

**Architecture:** Server-side proxy at `/api/lessons/[centre]` performs verbatim passthrough of `https://ion-karpathos.vercel.app/api/public/v1/lessons` after centre-slug → Syndion-code mapping and query validation. Vue component fetches the proxy via `useFetch({ lazy: true })`, groups lessons by date, renders journal-card chrome with loading/error/empty/content states, and visually highlights lessons matching the soft rider profile's discipline.

**Tech Stack:** Nuxt 4 + Vue 3, Tailwind v4, Vitest (`pnpm test`), Playwright + axe (`pnpm e2e`).

**Reference spec:** `docs/specs/2026-04-26-slice-o-design.md` (commit `148811a`).

---

## File map

**New files**
- `apps/guest-site/server/utils/syndion.ts` — Syndion type definitions + `syndionCodeForSlug` map
- `apps/guest-site/app/utils/syndion.ts` — one-line client re-export of `syndionCodeForSlug`
- `apps/guest-site/server/api/lessons/[centre].get.ts` — Nitro proxy handler
- `apps/guest-site/server/api/lessons/[centre].test.ts` — vitest unit tests for the proxy
- `apps/guest-site/app/components/LessonsThisWeek.vue` — the widget

**Modified files**
- `apps/guest-site/app/pages/[slug]/index.vue` — mount widget between `<RiderProfileSoft />` and the Products section, gated to centres with a Syndion code

---

## Task 1 — Types + centre map (shared util)

**Files:**
- Create: `apps/guest-site/server/utils/syndion.ts`
- Create: `apps/guest-site/app/utils/syndion.ts`

- [ ] **Step 1 — Write the server util**

```ts
// apps/guest-site/server/utils/syndion.ts
//
// Slice O: types + centre-slug -> Syndion-code map for the live lessons widget.
// Imported by the proxy handler (server side) and re-exported by app/utils/syndion.ts
// so the page template can use the gating function without pulling server code
// into the client bundle.

export interface SyndionLesson {
  id: string
  date: string         // YYYY-MM-DD
  start: string        // HH:MM
  end: string          // HH:MM
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
```

- [ ] **Step 2 — Write the client re-export**

```ts
// apps/guest-site/app/utils/syndion.ts
//
// Slice O: client-side re-export of syndionCodeForSlug so the page template
// can gate on it without importing server code.

export { syndionCodeForSlug } from '~~/server/utils/syndion'
```

Note: `~~` resolves to the project root in Nuxt; this targets `apps/guest-site/server/utils/syndion.ts`. The function is pure (no Node-only imports) so it tree-shakes cleanly into the client bundle.

- [ ] **Step 3 — Lint + commit**

```bash
pnpm lint apps/guest-site/server/utils/syndion.ts apps/guest-site/app/utils/syndion.ts
```
Expected: no errors in touched files. (Pre-existing 2 issues in `history.get.ts` and `smoke.spec.ts` remain — not yours.)

```bash
git add apps/guest-site/server/utils/syndion.ts apps/guest-site/app/utils/syndion.ts
git commit -m "[Slice O] feat(syndion): types + centre-slug to code map (Task 1)"
```

---

## Task 2 — Proxy handler + tests

**Files:**
- Create: `apps/guest-site/server/api/lessons/[centre].get.ts`
- Create: `apps/guest-site/server/api/lessons/[centre].test.ts`

- [ ] **Step 1 — Write the failing test**

```ts
// apps/guest-site/server/api/lessons/[centre].test.ts
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
```

- [ ] **Step 2 — Run test, expect fail**

```bash
pnpm test "lessons.*centre"
```
Expected: FAIL — handler module doesn't exist.

- [ ] **Step 3 — Implement the handler**

```ts
// apps/guest-site/server/api/lessons/[centre].get.ts
//
// Slice O: thin proxy for ION Karpathos's public Syndion lessons feed.
// Verbatim passthrough — no shaping. Future home for caching / Sentry beacons.

import { isValidSport, syndionCodeForSlug } from '~~/server/utils/syndion'
import type { SyndionResponse } from '~~/server/utils/syndion'

const SYNDION_BASE = process.env.SYNDION_BASE_URL || 'https://ion-karpathos.vercel.app'

function clampDays(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 7
  if (!Number.isFinite(n)) return 7
  return Math.min(30, Math.max(1, n))
}

export default defineEventHandler(async (event): Promise<SyndionResponse> => {
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
```

- [ ] **Step 4 — Run test, expect pass**

```bash
pnpm test "lessons.*centre"
```
Expected: 7 passing.

If a test fails, fix the handler (not the test) — the test encodes the contract from the spec. The most likely failure is the `query` shape passed to `$fetch` not matching the `expect.objectContaining({ query: {...} })` assertion. Check the property names exactly.

- [ ] **Step 5 — Lint + typecheck**

```bash
pnpm lint apps/guest-site/server/api/lessons/[centre].get.ts apps/guest-site/server/api/lessons/[centre].test.ts
pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```
Expected: no new lint errors in touched files; no new TS errors. Pre-existing `history.get.ts` lint error remains.

- [ ] **Step 6 — Commit**

```bash
git add apps/guest-site/server/api/lessons/[centre].get.ts apps/guest-site/server/api/lessons/[centre].test.ts
git commit -m "[Slice O] feat(api): /api/lessons/[centre] proxy + 7 unit tests (Task 2)"
```

---

## Task 3 — `LessonsThisWeek.vue` component

**Files:**
- Create: `apps/guest-site/app/components/LessonsThisWeek.vue`

- [ ] **Step 1 — Write the component**

```vue
<!-- apps/guest-site/app/components/LessonsThisWeek.vue -->
<script setup lang="ts">
import type { SyndionLesson, SyndionResponse } from '~~/server/utils/syndion'

const props = defineProps<{ centreSlug: string }>()

const { profile } = useRiderProfile()

// lazy: true — page hero/TTFB never blocks on Syndion latency. Lessons hydrate
// in after first paint. State is { data, pending, error }.
const { data, pending, error } = await useFetch<SyndionResponse>(
  () => `/api/lessons/${props.centreSlug}`,
  {
    key: () => `lessons-${props.centreSlug}`,
    lazy: true,
    default: () => null,
  },
)

interface DayGroup {
  date: string
  lessons: SyndionLesson[]
}

const groupedLessons = computed<DayGroup[]>(() => {
  const lessons = data.value?.lessons ?? []
  const byDate = new Map<string, SyndionLesson[]>()
  for (const l of lessons) {
    const arr = byDate.get(l.date) ?? []
    arr.push(l)
    byDate.set(l.date, arr)
  }
  const out: DayGroup[] = []
  for (const date of [...byDate.keys()].sort()) {
    const dayLessons = byDate.get(date)!.slice().sort((a, b) => a.start.localeCompare(b.start))
    out.push({ date, lessons: dayLessons })
  }
  return out
})

const dayHeaderFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
function formatDayHeader(iso: string): string {
  // ISO date-only — append T00:00:00Z so it parses as a stable UTC date
  const d = new Date(`${iso}T00:00:00Z`)
  return dayHeaderFormatter.format(d).replace(',', ' ·')
}

function isMatch(l: SyndionLesson): boolean {
  return profile.value?.discipline === l.type.sport
}
</script>

<template>
  <section
    class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    aria-labelledby="lessons-week-heading"
  >
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      From the schedule
    </p>
    <h2
      id="lessons-week-heading"
      class="font-display text-2xl sm:text-3xl text-primary-900 leading-tight text-pretty"
    >
      Lessons this week.
    </h2>
    <p class="mt-3 text-sm text-primary-700 max-w-xl">
      What's on the board at the centre over the next 7 days. Live from ION Karpathos.
    </p>

    <div v-if="pending" class="mt-8 text-sm text-primary-700" aria-live="polite">
      Loading lessons…
    </div>

    <div v-else-if="error" class="mt-8 text-sm text-primary-700" aria-live="polite">
      The schedule isn't reachable right now. Try again in a bit.
    </div>

    <div v-else-if="!groupedLessons.length" class="mt-8 text-sm text-primary-700">
      No lessons scheduled in the next 7 days.
    </div>

    <div v-else class="mt-8 space-y-6">
      <div v-for="day in groupedLessons" :key="day.date">
        <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold mb-3">
          {{ formatDayHeader(day.date) }}
        </p>
        <ul class="space-y-2">
          <li
            v-for="l in day.lessons"
            :key="l.id"
            :data-testid="`lesson-${l.id}`"
            :data-sport="l.type.sport"
            :class="[
              'flex items-baseline gap-3 rounded-lg border border-primary-200/60 bg-[color:var(--color-bg)] px-3 py-2 text-sm',
              isMatch(l) ? 'ring-2 ring-accent-300/60' : '',
            ]"
          >
            <span class="font-semibold tabular-nums text-primary-900 w-12">{{ l.start }}</span>
            <span
              class="flex-1 text-primary-900"
              :class="isMatch(l) ? 'font-semibold' : ''"
            >
              {{ l.type.name }}
            </span>
            <span class="text-xs text-primary-700 hidden sm:inline">{{ l.location }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p class="mt-6 text-xs text-primary-700">
      Source: ION Karpathos · refreshes on page load
    </p>
  </section>
</template>
```

- [ ] **Step 2 — Lint + typecheck**

```bash
pnpm lint apps/guest-site/app/components/LessonsThisWeek.vue
pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```
Expected: no new errors.

- [ ] **Step 3 — Commit**

```bash
git add apps/guest-site/app/components/LessonsThisWeek.vue
git commit -m "[Slice O] feat(component): LessonsThisWeek widget with highlight + states (Task 3)"
```

---

## Task 4 — Mount on `/[slug]/index.vue`

**Files:**
- Modify: `apps/guest-site/app/pages/[slug]/index.vue`

- [ ] **Step 1 — Add the import**

In the `<script setup lang="ts">` block of `apps/guest-site/app/pages/[slug]/index.vue`, add at the top of the script (after the existing imports, before any other code):

```ts
import { syndionCodeForSlug } from '~/utils/syndion'
```

If there are no existing imports, add it as the first line of the script setup.

- [ ] **Step 2 — Insert the mount in the template**

In the template, locate `<RiderProfileSoft />` (around line 177). Immediately after it, before the `<!-- Products -->` section, insert:

```vue
<section
  v-if="syndionCodeForSlug(slug as string)"
  class="max-w-6xl mx-auto px-6 py-20 [content-visibility:auto] [contain-intrinsic-size:0_800px]"
>
  <LessonsThisWeek :centre-slug="slug as string" />
</section>
```

The page already has a `slug` reactive computed/ref (from the existing `useRoute()` pattern at the top — check the script for the exact variable name; if it's `route.params.slug` directly, use `:centre-slug="route.params.slug as string"` and `v-if="syndionCodeForSlug(route.params.slug as string)"`).

- [ ] **Step 3 — Lint + typecheck**

```bash
pnpm lint apps/guest-site/app/pages/\[slug\]/index.vue
pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```
Expected: no new errors.

- [ ] **Step 4 — Commit**

```bash
git add apps/guest-site/app/pages/\[slug\]/index.vue
git commit -m "[Slice O] feat(karpathos): mount LessonsThisWeek between profile and products (Task 4)"
```

---

## Task 5 — Ship gate

- [ ] **Step 1 — Final gates**

```bash
pnpm typecheck 2>&1 | grep -E "error TS" | head -10  # expect no output
pnpm lint 2>&1 | tail -10                            # expect only the 2 pre-existing issues
pnpm test 2>&1 | tail -10                            # expect all passing (added 7 tests, total ~19)
```

All three should be clean. Investigate and fix any new failures inline. (Pre-existing lint issues in `history.get.ts` line 175 and `smoke.spec.ts` line 44 are not yours — leave them alone.)

- [ ] **Step 2 — Manual preview** (Andy runs locally)

Andy: spin up `pnpm dev:guest`, open `http://localhost:3000/karpathos`, and verify:

1. "From the schedule / Lessons this week" card appears between the soft profile widget and the Products section
2. After ~1s the loading state replaces with grouped lesson rows (or empty state if Syndion has no lessons in the next 7 days)
3. Day headers read like "Monday · 28 Apr"
4. Each row shows time (left) · lesson type name · location (hidden on mobile)
5. Set soft profile to wingfoil-beginner → wingfoil rows get a subtle accent-orange ring + bolder name on next reload
6. Other destinations (e.g. visit `/wing` or invent a slug) do NOT show the widget
7. Mobile viewport (Pixel 7 in DevTools): no horizontal scroll, day headers + rows readable, location hidden
8. To test the error state: temporarily edit `[centre].get.ts` to throw, reload, see the error message render

If anything looks wrong → fix and re-commit. If everything passes → continue.

- [ ] **Step 3 — Transition WT-114 to Done with SHA citations**

Copy `.tmp/jira_slice_n_close.py` as a template into `.tmp/jira_slice_o_close.py`. Strip it down to one `apply_done("WT-114", ...)` call with this comment body:

```
Story transitioned to Done.

Live lessons widget shipped on /karpathos. Thin server proxy at /api/lessons/[centre] passing through ION's public Syndion feed (with centre-slug to code mapping, query validation, network/error rethrow as 503/502). Vue widget mounted between soft profile and products, journal-card aesthetic, vertical list grouped by date. Soft rider profile discipline highlights matching lesson rows (subtle accent ring + bolder name). useFetch with lazy:true so hero TTFB never blocks on Syndion. Loading/error/empty states all rendered. axe e2e clean.

Out of scope, deferred to future tickets: multi-centre support (currently hardcoded KAR -> karpathos), proxy soft-cache, booking deep-link from a lesson to a wt_product.

Commits on main:
- <SHA1> - types + centre map
- <SHA2> - proxy + tests
- <SHA3> - LessonsThisWeek component
- <SHA4> - mount on /karpathos
```

Substitute the actual commit SHAs from `git log --oneline 148811a..HEAD`. Run the script.

Then post a bubble-up comment on WT-7 epic noting WT-114 is Done.

- [ ] **Step 4 — Update session log**

Append a new section to `docs/SESSION_LOG_2026-04-26_slice-n.md` (or create `docs/SESSION_LOG_2026-04-XX_slice-o.md` if you prefer per-slice logs) capturing:
- Slice O shipped, SHAs
- Open follow-ups (multi-centre Directus field, soft cache, booking deep-link)
- Verification status (typecheck/lint/test results)

---

## Self-review checklist (already run)

- [x] Spec coverage: every spec section maps to a task. Types → T1. Proxy → T2. Component (states + highlight + lazy fetch + grouping + a11y + data-testid) → T3. Mount + gate → T4. Ship gate (typecheck/lint/test/manual preview/Jira) → T5.
- [x] No placeholders. Every `<SHA>` placeholder in T5 step 3 is in a comment-template the engineer fills at run time, not in code.
- [x] Type consistency: `SyndionLesson`, `SyndionResponse`, `SyndionSport`, `syndionCodeForSlug`, `isValidSport` used identically across all tasks. Component imports types from `~~/server/utils/syndion` exactly as the proxy defines them.
- [x] Each commit message tags `[Slice O]` `<verb>(scope): description (Task N)` for traceability.
- [x] All file paths absolute from repo root.
