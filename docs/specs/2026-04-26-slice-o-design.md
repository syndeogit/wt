# Slice O — Live lessons widget on /karpathos (Syndion feed) — design

> Spec authored 2026-04-26. Closes WT-114 (Story under EPIC 7 / WT-7).

## Scope

Mount a journal-style "Lessons this week" widget on `/karpathos`. Reads the public Syndion feed via a thin server-side proxy. Read-only discovery aid — no booking deep-link.

| Story | Title | Status (start) | Status (target) |
|-------|-------|----------------|-----------------|
| WT-114 | Live lessons widget on /karpathos (Syndion feed) | Backlog | Done |

Out of scope:
- Multi-centre support (only Karpathos has the Syndion feed today)
- Booking directly from the widget (lesson IDs from Syndion don't map 1:1 to our `wt_products`)
- WindTribe-side caching beyond what `useFetch` already does
- Authoring the widget for partner sites to embed
- Real-time refresh (page reload only — discovery framing, not availability framing)

## Working mode

Single phase. ~90 min. One preview checkpoint at the end. Direct-to-`main` commits, solo developer.

## Decisions taken during brainstorm

1. **Purpose: discovery aid.** "What's the rhythm of this centre this week?" — not "live availability you can book". Drives no-urgency framing.
2. **Mount: /karpathos only**, slot between `<RiderProfileSoft />` and the Products section. Journal-card aesthetic (cream bg, rounded-2xl, primary-200 border, accent-orange uppercase section label, display-font h2).
3. **Fetch strategy: thin server proxy** at `/api/lessons/[centre]`. Component calls our proxy, not Syndion directly. Decouples us from CORS / origin / TLS issues and gives us a future home for caching.
4. **Density: full vertical list**, day headers (`Monday · 28 Apr`), one row per lesson (time, type name, location). No capacity counts (would mislead under discovery framing).
5. **Soft-profile filter behaviour: show all sports, highlight matches.** Always fetch all sports. When `useRiderProfile().profile.discipline` is set, lessons matching that sport get a subtle accent-orange ring + bolder name. No filter, no dim, no escape hatch.
6. **Sequencing: server first, then component.** Proxy + tests, then Vue component, then mount.

## Architecture

### Data flow

```
Syndion (ion-karpathos.vercel.app)
  ↓ GET /api/public/v1/lessons?centre=KAR&days=7
WindTribe Nitro proxy at /api/lessons/[centre]
  ↓ verbatim passthrough
LessonsThisWeek.vue (in /[slug]/index.vue, gated to slug=karpathos)
  ↓ useFetch(lazy: true) → groups by date inline → renders
```

### Files

**New**
- `apps/guest-site/server/utils/syndion.ts` — types + `syndionCodeForSlug` map
- `apps/guest-site/app/utils/syndion.ts` — re-export of `syndionCodeForSlug` for client/template gating
- `apps/guest-site/server/api/lessons/[centre].get.ts` — proxy handler
- `apps/guest-site/server/api/lessons/[centre].test.ts` — vitest unit test (mocked `$fetch`)
- `apps/guest-site/app/components/LessonsThisWeek.vue` — the widget

**Modified**
- `apps/guest-site/app/pages/[slug]/index.vue` — mount widget between `<RiderProfileSoft />` and the Products section, gated to centres with a Syndion code

### Types (single source of truth)

```ts
// apps/guest-site/server/utils/syndion.ts
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

const SYNDION_CENTRES: Record<string, string> = { karpathos: 'KAR' }
export function syndionCodeForSlug(slug: string): string | null {
  return SYNDION_CENTRES[slug] ?? null
}
```

`apps/guest-site/app/utils/syndion.ts` is a one-line re-export of `syndionCodeForSlug` so the page template can use it without pulling server code into the client bundle.

When a second Syndion-integrated centre lands → add a Directus field on `wt_centres` and read from there. Out of scope for this slice.

### Proxy contract

`GET /api/lessons/:centre`

| Param | Required | Default | Validation |
|-------|----------|---------|------------|
| `:centre` (path) | yes | — | Must resolve via `syndionCodeForSlug`, else 404 |
| `?days=` | no | `7` | Clamped to 1–30 |
| `?sport=` | no | (all) | Must be `wingfoil`/`windsurf`/`kitesurf`, else 400 |

| Response | Status | Body |
|----------|--------|------|
| Happy path | 200 | `SyndionResponse` (verbatim from upstream) |
| Unknown centre slug | 404 | `Lessons unavailable for this centre` |
| Invalid sport | 400 | `Invalid sport` |
| Syndion network error | 503 | `Lessons feed temporarily unavailable` |
| Syndion non-2xx | 502 | `Lessons feed returned an error` |

**Base URL config:** `process.env.SYNDION_BASE_URL` with default `https://ion-karpathos.vercel.app`. No auth required (public feed).

### Component contract

`<LessonsThisWeek :centre-slug="<string>" />`

- Self-fetches via `useFetch('/api/lessons/<slug>', { lazy: true })` — page hero never blocks on Syndion latency
- Reads `useRiderProfile().profile` for highlight logic (no filter on the API call — Q5=B)
- Groups lessons by date inline; sorts days asc, sorts lessons within a day by `start` asc
- Renders journal-card chrome with three states: loading, error, empty, content
- Highlight: `font-semibold` + `ring-2 ring-accent-300/60` on rows where `profile.discipline === lesson.type.sport`
- A11y: `aria-labelledby` ties day list to h2; `aria-live="polite"` on loading/error states; native `<ul>`/`<li>`
- `data-testid="lesson-<id>"` and `data-sport="<sport>"` on each row for future regression tests
- No props beyond `centreSlug` — entirely self-contained

### Mount

`apps/guest-site/app/pages/[slug]/index.vue`, between `<RiderProfileSoft />` and the Products `<section>`:

```vue
<RiderProfileSoft />

<section
  v-if="syndionCodeForSlug(slug as string)"
  class="max-w-6xl mx-auto px-6 py-20 [content-visibility:auto] [contain-intrinsic-size:0_800px]"
>
  <LessonsThisWeek :centre-slug="slug as string" />
</section>

<!-- Products -->
```

The `v-if` gates non-Karpathos destinations cleanly. `[content-visibility:auto]` matches the perf optimisation pattern used by neighbouring sections.

## Error handling

- **Syndion down or slow:** `useFetch` resolves to error → component renders the error state ("The schedule isn't reachable right now. Try again in a bit."). Page remains fully functional.
- **Syndion returns malformed JSON:** TypeScript types are not validated at runtime in this slice. If a field is missing, the component will render odd content (e.g. `undefined` for the type name) but won't crash. Acceptable for MVP — if it becomes a problem, add Zod parsing later.
- **No lessons in the next 7 days:** empty state copy (`No lessons scheduled in the next 7 days.`).
- **Soft profile not loaded yet on first render:** highlight just doesn't render until profile loads. No flash of incorrect content because the highlight is additive (not replacing other rendering).

## Testing strategy

| Layer | Coverage |
|-------|----------|
| Proxy unit (vitest) | mock `$fetch`, assert centre→code mapping, query passthrough, validation, error rethrow |
| Component unit | skipped — `useFetch` is hard to unit-test cleanly without a Nuxt test harness; covered by manual + axe e2e |
| axe e2e (existing) | `/karpathos` is already in the loop in `e2e/smoke.spec.ts` — re-run on both desktop + mobile-chrome to confirm widget doesn't introduce a a11y regression |
| Manual preview | open `/karpathos`, verify widget appears below soft profile widget; data renders; highlight activates when soft profile has discipline; error state renders if proxy is broken; page works on mobile viewport |

Non-regression test deliberately not added — Syndion uptime would make it flaky. If we add a proxy cache later (with sample fixtures) we can revisit.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Syndion API shape changes | Med | Proxy is a passthrough — first sign is component empty/error state, not a crash. TypeScript types in `syndion.ts` document what we expect; mismatch surfaces in code review of next change |
| Syndion downtime breaks `/karpathos` | Low | `useFetch` with `lazy: true` + error-state rendering. Page-level isolation. Hero TTFB never blocks on Syndion |
| `useFetch` SSR blocks page if `lazy` not set | Med | Spec specifies `lazy: true` — must not be dropped during implementation |
| Soft profile not yet loaded when widget mounts | Low | Highlight is additive; absence is invisible to the user |

## Stop conditions

Pause and call Andy if:
- Syndion's response shape differs materially from what we observed during brainstorm (extra required fields, breaking renames)
- CORS or auth requirements appear at proxy time (we currently assume open, server-side fetch — no preflight)
- The component reaches >250 lines (signal to extract row/day subcomponents)

## Estimate roll-up

- Proxy + types + unit test: 45 min
- Component + states: 35 min
- Mount + ship gate: 10 min
- **Total: ~90 min**

## Open follow-ups for after slice

- Add a Directus `syndion_code` field on `wt_centres` when a second integrated centre lands; replace the hardcoded map.
- Optional `?sport=` API filter is wired through the proxy but not used by the component (Q5=B locked "show all + highlight"). Kept in the proxy contract so a future use case can hit it.
- Soft cache layer in the proxy (using `cache_until` from upstream) — defer until volume justifies it.
- Booking deep-link from a lesson → a WT product. Requires either a mapping table or an operational integration (Slice L territory).
