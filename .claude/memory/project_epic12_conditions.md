---
name: WT Epic 12 — Conditions & wind dashboard plan
description: Stories WT-95..WT-101 plan, decisions made, and resume-from-here playbook
type: project
originSessionId: cb4a2e46-322a-4e2c-9292-58a7c49c3ac6
---
**Epic** WT-94 — Conditions and wind dashboard. Created 2026-04-25 after Slice K landed a basic conditions card on /journal. This epic extends it into a dedicated destination-scoped page with multi-day forecast and year-over-year historical comparison, scalable to any centre.

**Why:** Wind sport guests check conditions repeatedly the week before a trip. Karpathos's prevailing Meltemi makes "is it usually windy mid-July?" a real question. A page that shows both the live forecast and the typical pattern from past years is a high-leverage marketing-and-utility page.

**How to apply:** When Andy says "continue Epic 12" or names any of these stories, follow the order below. Each story is sized to land in one or two clickable increments per the WT working mode rule. Bubble status to WT-94 + WT-7 (Epic 6 guest experience) on every change per the Jira hygiene rule.

## Decisions already made

- **Comparison window default = today + 7 days**, with optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` URL params to override. Lets the booking flow link guests to "the wind for your dates" via deep link, while the page is useful out-of-the-box for casual visitors.
- **Chart visual = single line + shaded band** (this year's forecast vs historical p25–p75 band + dotted mean). Cleaner narrative than four overlaid year lines. A "show individual years" toggle is a future polish item, not v1.
- **Coordinates live on Directus wt_centres**, not hardcoded. WT-95 does that work; everything downstream reads from there.
- **Page route** is `/[slug]/conditions` (nested under destination), so any future centre slug picks it up automatically.
- **No new chart library** — pure SVG. WT-99 builds the chart inline.
- **Open-Meteo only**, no Stormglass / paid providers. Both forecast and archive APIs are free and unauthenticated. Cache 10 minutes for forecast (SWR), 24 hours for historical (immutable).

## Story order and notes

1. **WT-95** — Add `latitude`, `longitude`, `timezone` to wt_centres in Directus. Update `packages/database/scripts/directus-setup.js` (idempotent). Backfill Karpathos with `35.61 / 27.10 / Europe/Athens`. Replace the `CENTRE_COORDS` const in `apps/guest-site/server/api/conditions/[slug].get.ts` with a Directus lookup via existing `fetchCentreBySlug` extended (or a new `fetchCentreCoords`). Returns 404 cleanly when a centre exists but coords are blank.
2. **WT-96** — `GET /api/conditions/[slug]/forecast?days=14`. Open-Meteo forecast API. Daily aggregates: `wind_speed_10m_max`, `wind_speed_10m_mean`, `wind_gusts_10m_max`, `wind_direction_10m_dominant`, `temperature_2m_min/max`, `weather_code`, `sunrise`, `sunset`. `defineCachedEventHandler` 10-min SWR.
3. **WT-97** — `GET /api/conditions/[slug]/history?from=...&to=...&years=4`. Open-Meteo archive API at `https://archive-api.open-meteo.com/v1/archive`. Returns one series per year for the same calendar window plus computed `p25` / `p75` / `mean` arrays so client does no statistical work. 24h cache.
4. **WT-98** — Page at `apps/guest-site/app/pages/[slug]/conditions.vue`. Sections: Right Now (lift from /journal), 14-day daily tiles, day-length, comparison chart placeholder. Reads centre via Directus same as `/[slug].vue`. URL params override comparison window.
5. **WT-99** — SVG-only chart. Single coral line for this year's forecast, shaded primary band for historical p25–p75, dotted primary mean. Hover/tap reveals exact numbers. Empty state when historical missing.
6. **WT-100** — Wind-now chip on `/[slug].vue` destination hero. Client-side fetch of `/api/conditions/[slug]`; hides on 404. Format `Wind now · 14kn E →`.
7. **WT-101** — Marine data (water temp + swell) via Open-Meteo Marine API. Deferred until partner demand or launch blocker.

## Resume instructions

1. Read this file to get context.
2. Confirm latest commit on `main` is at or after `e5c3403` (Slice K layout v2 — conditions in /journal centre, FB demoted to sidebar). If it is, the foundation is in place.
3. Check Jira: `WT-94` is the epic, stories `WT-95..WT-101`. Pick up the lowest-numbered open story.
4. Bubble status to WT-94 (epic) and WT-7 (Epic 6) when transitioning a story per the Jira hygiene rule.
5. Each story should ship as its own commit with the `[Epic 12]` tag prefix.

## Open ends not in any story

- Booking flow doesn't yet link to `/[slug]/conditions?from=arrival&to=departure`. After WT-98 lands, add a "see the wind for your dates" link on `/book/[slug]/confirm` and `/book/success`. Tiny follow-up.
- Marine API (WT-101) deferred. Don't start without explicit ask.
- Chart "show individual years" toggle: also deferred polish.
