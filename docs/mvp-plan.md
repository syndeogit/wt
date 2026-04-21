# WindTribe MVP Plan

> Living document. Updated as slices ship and decisions are made.
> Last updated: 2026-04-20.
> Stakeholder mirror: [WindTribe MVP Plan on Confluence (SD space)](https://syndeo-test.atlassian.net/wiki/spaces/SD/pages/234455041/WindTribe+MVP+Plan).
> This repo doc is the authoritative source — if the two disagree, this wins.

## Purpose

Single source of truth for what WindTribe is building toward an MVP, how we're building it, and what discipline we apply along the way. Sits alongside `docs/deployment.md`. Every section is revisable — if something here is wrong, change it, don't work around it.

## The MVP in one sentence

**A guest can discover ION Karpathos on the WindTribe website, browse available lessons and gear, bundle accommodation, pay securely, and receive a booking confirmation — on mobile or desktop, in the same booking session.**

## MVP discipline — the rule

> Build the **smallest version that is lovable**. Cut features, never cut quality. A story is done when the essential user goal it describes works and feels right — not when every edge case is handled.

Example — centre admin portal (Epic 4) in MVP-discipline means "centre can see their bookings and edit their availability." It does **not** mean "centre can audit-log every change, bulk-import products, set up custom roles, export to CSV, filter by 15 dimensions." The smallest useful version ships; the rest lands when real usage reveals the need.

No epic is parked. Every epic gets its minimum lovable version.

## Working mode — how Andy and Claude work together

Solo project (Andy + Claude). Credit and time budgets matter. The mode reflects that:

1. **Clickable increments every 30–60 min.** Each slice produces something Andy can open in a browser and form an opinion on. No multi-hour autonomous grinds without a checkpoint.
2. **Preview-per-branch is the feedback loop.** Claude pushes a branch, Vercel builds a preview, Andy opens the URL. Wrong direction caught in 30 min, not 4 hours.
3. **Ugly first, polished second.** Claude builds the simplest version that can be judged. If shape is right, we harden. If not, we bin cheaply.
4. **Direct-to-main merges after self-test.** PRs are optional — CI (`lint` + `typecheck` + `test`) is the primary gate.
5. **Jira hygiene per the saved rule.** Sub-task comment + transition, bubble to parent story + epic. No elaborate cascades when they don't earn their keep.
6. **Stop when a decision is needed.** Claude surfaces options; Andy decides. Defaults listed in the Open Questions section so Claude can proceed when Andy is unavailable.

## Slicing — vertical, not epic-by-epic

Each slice is a thin cut through every layer (schema → API → state → UI → deploy) for one user-visible feature. Every slice is deployable, clickable, and worth looking at on its own.

| Slice  | Delivers                                                                                                                    | Status  | Feeds epic(s) |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------- | ------------- |
| **0**  | Scaffolding: Tailwind, Nuxt UI, Pinia, checkout store, `@nuxt/image`, layout shell, fixtures, `/_styleguide`, mock `/api/*` | Pending | —             |
| **A**  | Browse: homepage + Karpathos destination page, product cards with real prices                                               | Pending | 2, 6          |
| **B**  | Identify: guest sign up / log in (Supabase Auth), session middleware                                                        | Pending | 2, 3, 6       |
| **C**  | Pick: date selection + product selection, Pinia-backed URL state preserved on refresh                                       | Pending | 2, 6          |
| **D**  | Bundle: gear + add-ons + accommodation bundling (live allocation)                                                           | Pending | 2, 5, 6       |
| **E**  | Profile: rider profile created at commitment step (after selection, not before)                                             | Pending | 2, 6          |
| **F**  | Pay: Stripe Connect + split payments + failed-payment retry                                                                 | Pending | 8             |
| **G**  | Confirm: confirmation page + email + iCal invite                                                                            | Pending | 6, 10         |
| **H**  | Polish: WCAG 2.1 AA, mobile Lighthouse 90+, non-regression against ION audit                                                | Pending | 6             |
| **I**  | Centre admin (lean): view bookings, edit availability                                                                       | Pending | 4             |
| **J**  | Hotel admin (lean): view allocations, confirm/decline bookings                                                              | Pending | 5             |
| **L**  | ION integration (lean): one-way booking export to ION; bidirectional later                                                  | Pending | 9             |
| **M**  | Launch prep: Karpathos content populated, partner hotel seeded, final testing                                               | Pending | 10            |
| **K+** | Activity feed — **deferred post-launch**. Doesn't feed the booking loop.                                                    | Parked  | 7             |

Note: Slice K intentionally reserved for the activity feed; it is the one deferred item. Everything else is pre-launch.

Each slice gets one (or more) Jira sub-tasks mapped as we hit it. The `mvp-slice` field in Jira comments tracks which slice a ticket belongs to.

## Slice 0 — scaffolding to build before Slice A

Finite list. If it's not here, it waits until it's actually needed.

**UI / styling**

- Tailwind CSS v4
- Nuxt UI v4 (components library)
- `@nuxt/image` (image optimisation)
- Brand tokens — primary colour + typography scale (placeholder values, swappable once Andy provides real brand)
- Layout shell — header + footer placeholders in every app

**State**

- **Pinia** (store management, root dep + Nuxt module)
- **Checkout state store** — typed Pinia store for cart / booking state (products, dates, accommodation, rider profile, payment status). URL-syncs key fields so refresh doesn't lose progress.

**Data**

- `fixtures/` folder per app for hardcoded mock data (products, centres, hotels) — one source of truth for prototyping
- `/api/*` mock routes returning fixture data — UI always calls the API, never hardcoded data directly. Swap to Supabase later = one-file change per endpoint.

**Developer experience**

- `/_styleguide` dev-only route showing every component in isolation with variants
- `app.config.ts` per app with site metadata (title, description, OG tags)

**Explicitly NOT in Slice 0 (add when Slice X needs them, not before)**

- Database schemas (Slice A starts that with just what it needs)
- Auth (Slice B)
- Stripe (Slice F)
- Email provider (Slice G)
- i18n, PWA, sitemap, analytics, feature flags — add when justified

## Architecture rules — load-bearing

Break any of these and future slices get expensive.

1. **Schema is multi-tenant from day 1.** Every domain table carries `centre_id` / `hotel_id` from the first migration. RLS policies check `centre_admin_of(centre_id)` even when no admin users exist yet. Cost today: ~zero. Benefit: admin portals (Slice I, J) are UI + API wiring, not a schema rewrite.
2. **Shared UI lives in `packages/ui`.** Any component that admin portals plausibly need (buttons, forms, date pickers, product cards, modals) goes into `@windtribe/ui`, not inside `apps/guest-site/app/components`. Guest-specific UI stays app-local.
3. **Server routes are resource-oriented.** `/api/centres/:id/products`, not `/api/homepage-data`. Lets admin portals, ION export (Slice L), and future mobile apps consume the same endpoints.

**Anti-patterns to watch for:**

- ❌ Hardcoding `"karpathos"` in routes, component names, string literals — always treat it as data
- ❌ "Homepage data" endpoints that bundle everything
- ❌ RLS policies that assume only guests exist
- ❌ Seeding data via SQL-only scripts when an API endpoint could do it — Slice I/J might not have admin UI yet, but the admin API should exist

## Quality bar — "useable and lovable"

Derived from the ION booking audit referenced in Epic 6 stories. Every slice must hold the line on:

- Real prices shown, never "From €X"
- No personal data required to browse
- Rider profile **after** product selection, not before (reverses the ION anti-pattern)
- No auto-substitution when preferred option unavailable
- No hidden selection patterns (auto-selecting the most expensive option)
- URL state preserves across refresh
- Keyboard navigable; screen-reader compatible
- Mobile-first — Lighthouse 90+ on mobile target
- Works on slow connections (lazy-loaded images, code-splitting)

Slice H formalises the non-regression checks. Earlier slices must not introduce the anti-patterns above.

## Open questions — block specific slices until answered

Claude proceeds with the default if Andy is unavailable. Defaults are swappable; don't over-invest in them.

| Question                                 | Blocks | Default if unanswered                         |
| ---------------------------------------- | ------ | --------------------------------------------- |
| Brand logo + primary colour              | 0      | Text logo + teal placeholder                  |
| Typography choice                        | 0      | Inter                                         |
| Homepage hero copy                       | A      | Generic placeholder, editable later           |
| Karpathos photos (real or stock)         | A      | Unsplash windsurf stock, swap later           |
| Partner hotel for MVP                    | D      | Skip accommodation bundle in earliest version |
| Stripe Connect vs single account         | F      | Connect (correct long-term, 2 weeks longer)   |
| Email provider                           | G      | Resend (cheap, simple Nuxt integration)       |
| Booking confirmation calendar format     | G      | iCal attachment                               |
| ION integration direction (pull vs push) | L      | Push bookings from WT to ION; ION-to-WT later |

## Data architecture — Directus + Supabase split

WindTribe uses two backends. Each owns the kinds of data it is built for.

**Directus** — content, editable by non-developers via the admin UI. Hosted on the existing Syndeo instance (`directus-production-1e38.up.railway.app`). WindTribe collections use the `wt_` prefix to coexist with Syndeo's marketing site collections. A dedicated WindTribe role + API token scopes access.

Owns: centres (descriptions, imagery, opening seasons), products (lessons, rentals, packages, prices, photos), hotels (descriptive content, photography), destinations (long-form marketing copy, SEO), journal posts.

**Supabase** — transactional, auth-gated, app-logic data. Project `windtribe` (ref `wrasfpjetwewvmjawqxs`, EU region).

Owns: user accounts, rider profiles, sessions, bookings, booking status transitions, availability + allocation tables, payments, refunds, real-time reservation locks.

Apps fetch from both: public content from Directus (no auth needed), user-specific state + booking writes from Supabase. Shared keys (e.g. `centre_id`, `product_id`) reference the same identifiers across both systems; Directus is source-of-truth for descriptive content, Supabase for transactional state.

Implication for Epic 4 (Centre admin) and Epic 5 (Hotel admin): centre/hotel staff use Directus directly to manage their content. WindTribe's admin portals (Slices I, J) only need to handle the operational bits — view bookings, edit availability — which Directus is not built for. This shrinks Epic 4 + 5 scope substantially.

## Wingfoil positioning

Headline product is **wing for beginners**. Wingfoiling is the fastest-growing wind sport globally and the most beginner-accessible — the MVP leans on this to bring city-dwellers ("I have always wanted to try") onto the water for the first time. Windsurf and kitesurf remain offered (and matter to existing audiences), but wing leads on the homepage, hero, and primary CTA.

## Current state

- **Epic 1 Done.** Monorepo, Nuxt 4, TS strict, lint + Prettier, Vitest, Playwright, GitHub Actions CI, Supabase live (project `windtribe` / ref `wrasfpjetwewvmjawqxs`), Vercel live (3 projects deploying from main), Sentry live (3 projects, EU region, default email alerts).
- **Slice 0** in progress. Style direction (Aegean — Mediterranean turquoise + coral on white, Outfit + Inter), Pinia + checkout store, fixtures, mock `/api`, `/styleguide` page all in. Directus collection setup pending — first sub-task of Slice A.
- **Next action:** Claude finishes Slice 0 cleanup, then starts Slice A (Browse) with Directus content.

## Credentials and environments

All runtime credentials live in `C:\dev\dev\WT\.env.local` (gitignored). `windtribe-env-template.env` (tracked, values empty) documents which vars exist. Vercel holds production/preview/dev copies per project. Never commit real values.

Current services wired: Jira (Syndeo), GitHub (syndeogit/wt), Supabase (windtribe, EU), Vercel (team `syndeogits-projects`, 3 projects), Sentry (org `syndeo-wh`, EU region, 3 projects), Directus (shared Syndeo instance, `wt_` prefix — wt_centres + wt_products + wt_hotels collections live, Content - Public read permissions granted, Karpathos seeded).

Full Directus design: [`docs/directus-design.md`](./directus-design.md). Stakeholder mirror: [WindTribe — Directus data design on Confluence](https://syndeo-test.atlassian.net/wiki/spaces/SD/pages/234881026/WindTribe+Directus+data+design).

## Changelog

- **2026-04-20** — Initial plan. All epics in, MVP-disciplined (smallest lovable version per story). Vertical slicing A–M with activity feed (K) deferred post-launch. Slice 0 scaffolding list includes Pinia + checkout state store.
- **2026-04-21** — Added Directus + Supabase split (Path A — share existing Syndeo Directus, `wt_` collection prefix). Added wingfoil positioning — wing leads, windsurf + kitesurf supporting. UI contrast fixes triggered by review (dark-mode CSS was inverting body to navy and breaking every navy text class).
- **2026-04-21** — Repaletted from "Open Sea" (navy + sand) to **"Aegean"** (white background + Mediterranean sky-blue + coral). Andy: "the blues are like the English Channel not the Mediterranean." New primary uses Tailwind sky family (#0ea5e9 → #0c4a6e); background is pure white with a barely-tinted elevated tone. Coral accent kept (classic Greek hotel signage combination).
- **2026-04-21** — Shifted primary to true turquoise (Tailwind cyan family — #06b6d4 → #164e63) after sky still read as English Channel. Committed primary-900 (#164e63) as single font-primary ink. Swapped display font from Fraunces (too compact at 7xl) to **Outfit** — geometric humanist sans with generous counters, confident at display sizes.
- **2026-04-21** — Slice A chunk A1 complete. Directus collections (`wt_centres`, `wt_products`, `wt_hotels`) provisioned on the shared Syndeo instance; Content - Public policy granted read access (published only); ION Karpathos seeded with 5 products + 2 partner hotels. Design documented at `docs/directus-design.md` and mirrored to [Confluence](https://syndeo-test.atlassian.net/wiki/spaces/SD/pages/234881026/). Provisioning script lives at `packages/database/scripts/directus-setup.js` — idempotent, re-runnable.
