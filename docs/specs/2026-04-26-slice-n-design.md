# Slice N — Guest-flow polish + add-ons (design)

> Spec authored 2026-04-26. Closes WT-47, WT-51, WT-52, WT-53. Final guest-side hardening before Stripe (Slice F live, parked on WT-102) goes live.

## Scope

| Story | Title | Status (start) | Status (target) |
|-------|-------|----------------|-----------------|
| WT-47 | Booking flow gear and add-ons | Backlog | Done |
| WT-51 | Booking confirmation and post-booking | In Progress | Done |
| WT-52 | Accessibility and mobile | In Progress | Done |
| WT-53 | Non-regression verification | In Progress | Done |

Out of scope (deferred):
- Live Stripe (WT-50 + EPIC 9) — waiting on WT-102 (Bara to set up Stripe account)
- Live lessons widget against the Syndion feed at `ion-karpathos.vercel.app/api/public/v1/lessons` — moved to Slice O (new ticket WT-103, EPIC 7)
- Custom email `from` domain — DNS work, separate Bara ticket if/when needed
- Lighthouse-mobile-in-CI perf budgets — own slice during launch prep

## Working mode

Five preview checkpoints. Each phase ends with a clickable preview Andy can judge in 30–60 min. Direct-to-`main` after self-test (no PRs — solo contributor). Jira hygiene per repo rule: transition + SHA-cited comment per phase, bubble to parent story + epic.

## Decisions taken during brainstorm

1. **Add-ons source:** existing `kind === 'rental'` products from Directus. No new collection. Future `add_ons` collection lands additively as a second data source feeding the same component.
2. **Gear-card behaviour:** soft guidance only — badges, never disabled, never warning modals. Avoids the "hidden selection patterns" anti-pattern called out in the ION audit.
3. **Soft rider profile:** captured via inline widget on `/[slug]` (destination page). localStorage for anon, syncs to `rider_profiles` on sign-in.
4. **Page order on `/confirm`:** review summary → gear/add-ons → hotel picker → rider profile → place-booking CTA.
5. **Add-on pricing:** per-day × nights, single quantity (no stepper). Matches existing hotel-bundle math; multi-quantity defers until usage proves the need.
6. **WT-51 scope cut:** gear lines in email + Programme/Programme label bug fix + preheader. No observability or template hardening — those earn keep at real volume, not pre-launch.
7. **WT-52 depth:** Playwright mobile project (axe re-run on mobile viewport) + manual checklist sweep. No Lighthouse-in-CI yet.
8. **WT-53 scope:** every behavioural anti-pattern from `mvp-plan.md:114-123` + the new gear/add-ons rules.
9. **Sequencing (approach 2):** feature-first — soft profile → gear/add-ons → email → regression → mobile.

## Phase 1 — Soft rider profile

**Goal:** capture `discipline + level` early so it can drive gear-card guidance (this slice) and conditions/destination personalisation (later slices).

**Storage**
- localStorage key `wt:rider-profile-soft`
- Shape: `{ v: 1, discipline: 'wingfoil'|'windsurf'|'kitesurf', level: 'beginner'|'intermediate'|'advanced', skipped?: boolean, savedAt: ISODate }`
- Schema-versioned so future migrations are safe

**Composable** — `apps/guest-site/app/composables/useRiderProfile.ts`
- Returns `{ profile, setProfile, skip, isSet, isSkipped }`
- Lookup precedence: signed-in `rider_profiles` row → localStorage → null
- On sign-in: if `rider_profiles` is empty AND localStorage has a soft profile, hydrate the row server-side via `/api/profile` PUT

**Component** — `apps/guest-site/app/components/RiderProfileSoft.vue`
- Placement on `/[slug]`: between hero and products grid, full-width inline strip (not a card or modal)
- Empty state: warm-orange strip with `What do you ride?` lead-in, two `<select>` (discipline, level), Save (disabled until both chosen), "Skip for now" link
- Filled state: pale-blue one-line summary `🏄 Beginner wingfoiler · Edit`. Edit re-opens the form inline; for signed-in users it links to `/account`
- Skipped state: completely hidden until `skipped` flag is cleared (cleared on sign-in or after manual reset only)
- A11y: native `<select>` (no custom dropdown), `<label for="...">` per field, `aria-live="polite"` on the saved-summary swap

**Consumers in this slice**
- Phase 2 gear cards: read `useRiderProfile()` to render badges

**Future consumers (not in this slice, documented for context)**
- Conditions page kit-size suggestions
- Destination programme highlights
- Notification thresholds

**Ship gate (Phase 1)**
- Widget renders empty state on first visit
- Both selects required to enable Save
- Filled state collapses correctly and persists across refresh
- Skip persists across refresh
- Signed-in users see existing `rider_profiles` data inline (no double-prompt)
- axe e2e clean on `/karpathos` after the widget lands

**Estimate:** 60 min

---

## Phase 2 — Gear/add-ons + component extraction

**Goal:** ship WT-47 — rich add-on cards with rider-profile fit, no hidden selection patterns.

**Refactor first** (zero behaviour change)
Before adding the new section, split `apps/guest-site/app/pages/book/[slug]/confirm.vue` (currently 640 lines) into:
- `apps/guest-site/app/components/booking/ReviewSummary.vue` — the destination/programme/dates summary card with totals rollup
- `apps/guest-site/app/components/booking/HotelPicker.vue` — the existing hotel radiogroup
- `apps/guest-site/app/pages/book/[slug]/confirm.vue` — orchestration only (~250 lines target)

**Then add** `apps/guest-site/app/components/booking/AddOnsSection.vue`
- Source: `/api/centres/:slug/products` filtered to `kind === 'rental'`. No new endpoint.
- Empty state: if no rentals at this centre, the entire section hides (no placeholder)
- Card layout: vertical list, each card ~80–100 px tall, image-left thumb (square), name + summary + per-day price middle, native `<input type="checkbox">` right
- Soft-guidance badges (top-right of card, small uppercase tracking):
  - `For your level` — when rider profile level ≥ product `minLevel`
  - `Match your discipline` — when rider profile discipline === product `discipline`
- Badges only render when soft profile exists; cards are never disabled, never warned
- Selected state: 2 px primary border + light primary fill, identical pattern to existing hotel picker

**State**
- Pinia checkout store gains `selectedAddOnIds: string[]`
- URL sync via `?addons=<id>,<id>` (same encoding as existing `?products=`)
- Refresh restores selections

**Pricing**
- Per-card line on the totals panel (in `ReviewSummary`): `Windsurf kit · 5 days  €325`
- Computed client-side as `addOn.priceCents × nightCount` per selected add-on
- Server re-computes the same way at booking-create time (no client trust)
- Sum added to `bookings.amount_cents` AND tracked separately in new `add_on_total_cents`

**Schema migration** — `packages/database/supabase/migrations/20260427120000_bookings_addons.sql`
- Add nullable `add_on_ids text[]` and `add_on_total_cents integer` columns to `public.bookings`
- RLS unchanged; columns are guest-writable on insert under existing `bookings_insert_own` policy

**Server** — `apps/guest-site/server/api/bookings/create.post.ts`
- Accept `addOnIds: string[]` in body (default `[]`)
- For each id: fetch from Directus, validate `kind === 'rental'` and `centre.id === resolvedCentre.id`, compute `priceCents × nightCount`
- Sum into `add_on_total_cents`; persist `add_on_ids` array
- Reject any id not at this centre with 400

**Ship gate (Phase 2)**
- Component extraction commit verified separately (e2e booking flow still works) before adding gear
- Rental cards render when present at the centre, hide entirely when not
- Soft-profile badges render correctly for matching products
- Selected add-ons appear in totals AND survive refresh
- Server validates add-on belongs to centre (test by injecting a foreign id)
- Bookings row persists `add_on_ids` and `add_on_total_cents`
- End-to-end manual: anon visit → sign in → pick wingfoil-beginner programme → see "For your level" badge → select → confirm → check Supabase row

**Bubbles:** WT-47 → Done, EPIC 7 stays In Progress.

**Estimate:** 90 min (30 refactor + 60 new section)

---

## Phase 3 — Email polish

**Goal:** close WT-51 — gear lines + label fix + preheader.

**Changes** to `apps/guest-site/server/utils/email.ts`
- Extend `BookingEmailInput` with `addOns: Array<{ name: string; perDayCents: number; nights: number; totalCents: number }>` (default `[]`)
- Render lines in text body: `Windsurf kit · €65/day × 5 = €325`
- Render rows in HTML body: identical `row()` helper, one row per add-on
- Update `grandTotalCents()` to sum hotel + add-on subtotals (currently only hotel)
- Fix the duplicate `Programme:` label bug at `email.ts:87,90` — `email.ts:87` already shows the programme name, label stays `Programme:`. `email.ts:90` shows the price; rename label to `Price:`. Same fix in `renderHtmlBody`.
- Add a preheader: `<div style="display:none;font-size:1px;color:transparent;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden">Booking ${ref} · ${arrival} → ${departure} · ${centreName}</div>` immediately inside `<body>`
- Subject line gets the booking ref bracketed: `Booking received — ${productName} at ${centreName} [${bookingRef}]`

**Caller** — `apps/guest-site/server/api/bookings/create.post.ts`
- Pass selected add-ons array (resolved server-side already during pricing) to `sendBookingConfirmation`

**Tests** — new file `apps/guest-site/server/utils/email.test.ts`
- Vitest snapshot tests for `renderTextBody` and `renderHtmlBody` with combinations:
  - No hotel, no add-ons
  - Hotel only
  - Add-ons only
  - Hotel + add-ons
- Snapshot file checked into git so future drift surfaces in PR diff (or commit diff, in our solo case)

**Ship gate (Phase 3)**
- All four snapshot tests pass
- Manual: send a real test booking with add-ons selected (Resend test key in `.env.local`), verify the inbox preview shows the preheader and subject contains the ref

**Bubbles:** WT-51 → Done.

**Estimate:** 45 min

---

## Phase 4 — Regression suite

**Goal:** close WT-53 — every behavioural anti-pattern from `mvp-plan.md:114-123` is enforced by a test, plus the new gear/add-ons rules.

**New file** — `e2e/non-regression.spec.ts`

| Test | Anti-pattern | Assertion |
|------|--------------|-----------|
| `real-prices-shown` | "From €X" labels | Load `/karpathos`; query all product card price elements; assert no element's text matches `/^from\s*€/i` |
| `anonymous-browse-allowed` | Personal data required to browse | Visit `/karpathos`, `/karpathos/conditions`, `/wing` without auth; none redirect to `/login`; expected content selectors visible |
| `profile-after-selection` | Profile asked before selection | Visit `/book/karpathos` without auth; assert no `firstname`/`lastname` inputs visible until `/confirm` |
| `no-auto-substitution` | Silent fallback to a different product | Programmatically request a centre with no products; page renders empty state, never silently shows a different centre's products |
| `no-pre-selected-upsells` | Hidden selection patterns | Load `/confirm` with fixture booking; assert no hotel radio is `:checked`, no add-on checkbox is `:checked`, no gear "Recommended for your level" badge auto-selects |
| `url-state-survives-refresh` | URL state lost on refresh | Pick dates + product + hotel + add-on on `/confirm`; refresh; assert all selections restored |
| `lazy-loaded-images` | Images blocking LCP | Assert all `<img>` elements outside the LCP element have `loading="lazy"` or `fetchpriority="auto"` |
| `gear-soft-guidance-only` | Filtering or warning on mismatch | Set rider profile to wingfoil-beginner; load `/confirm`; assert all rental cards remain clickable (no `disabled`, no `aria-disabled`) |

**Fixture strategy**
- Each test uses a stable Directus fixture or a Supabase seed booking so tests don't drift when content changes
- Where a test needs an authenticated user, reuse the existing axe e2e auth pattern (sign-in via Supabase service role)
- The `real-prices-shown` assertion is scoped to product card components only, not the whole page, to avoid false positives from casual prose

**Ship gate (Phase 4)**
- All 8 tests pass locally
- All 8 tests pass in CI
- Each test fails meaningfully if the anti-pattern is reintroduced (verify by temporarily breaking each rule)

**Bubbles:** WT-53 → Done.

**Estimate:** 90 min

---

## Phase 5 — Mobile audit + axe project + fixes

**Goal:** close WT-52 — automated mobile a11y coverage + manual sweep + fix findings.

**Playwright config** — extend `playwright.config.ts`
- Add second project: `{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }`
- The existing `e2e/smoke.spec.ts` axe loop runs against both projects automatically — instant double-coverage with zero new test code

**Manual sweep**
Pages to walk in mobile DevTools (or real device):
`/`, `/destinations`, `/karpathos`, `/karpathos/conditions`, `/wing`, `/journal`, `/book`, `/book/karpathos`, `/book/karpathos/confirm` (logged in, with fixture state), `/book/success`, `/login`, `/signup`, `/forgot-password`, `/account`

Per-page checklist:
- Tap targets ≥ 44 × 44 px (interactive elements only)
- No horizontal scroll at 360 px viewport
- Sticky nav doesn't cover content (especially form fields when keyboard is open)
- Form fields use correct `inputmode` / `autocomplete` / `type` attributes (`email`, `tel`, `numeric`)
- Soft keyboard doesn't break layout (no fixed elements jumping)
- Images load and don't cause layout shift

**Findings handling**
- Severity-high (broken UX, blocked flow): fix in this phase
- Severity-medium (suboptimal but usable): fix in this phase if cheap (≤10 min each), else file follow-up ticket
- Severity-low (cosmetic): file follow-up ticket only

Findings logged at the bottom of this spec when done.

**Ship gate (Phase 5)**
- `playwright.config.ts` runs two projects, both green
- Manual checklist completed and findings logged
- Severity-high fixes shipped
- WT-52 → Done; verify EPIC 7 status: if WT-47/51/52/53 all Done, transition WT-7 → Done

**Estimate:** 90 min

---

## Risks (slice-wide)

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `confirm.vue` refactor (Phase 2 step 1) regresses the existing flow | Med | Ship the refactor as its own commit before adding gear; verify e2e booking still works end-to-end before continuing |
| `real-prices-shown` test false-positives on prose text | Low | Scope assertion to product card components only |
| Mobile sweep finds more than fits in the slice | Med | Strict triage by severity; medium/low items become follow-up tickets, not slice scope |
| Soft profile collides with `rider_profiles` row on sign-in | Low | Hydration is one-way (localStorage → DB only when DB is empty); DB row is always source-of-truth |
| Resend snapshot tests drift if template changes | Low | Snapshot diff surfaces in commit; intentional changes update the snapshot |

## Stop conditions

Pause and call Andy if:
- Mobile sweep finds something requiring visual design (e.g. sticky-CTA approach)
- A regression test refuses to pass without changing existing behaviour (signal we got the rule wrong)
- Component extraction breaks something not anticipated

## Estimate roll-up

- Phase 1 (soft profile): 60 min
- Phase 2 (gear + extract): 90 min
- Phase 3 (email): 45 min
- Phase 4 (regression): 90 min
- Phase 5 (mobile): 90 min
- **Total: ~6 hours across 5 sessions**

## Findings log (filled during Phase 5)

_Empty — to be populated when mobile sweep runs._
