# SYNDION Master Plan

> Architectural source of truth. Read alongside `ION_CLUB_SYSTEM_PLAYBOOK.md`.
> Status: draft, April 2026.

## 1. Strategic Context

SYNDION is the ERP platform Syndeo is building for instructor-led activity businesses where conditions drive scheduling and equipment choice. The 2026 season at ION Club Karpathos is the first deployment and the proving ground.

This document captures the architectural decisions taken in April 2026 to split the existing single-app SYNDION codebase into a multi-app, multi-vertical platform that lives inside the Windtribe monorepo.

**Current state (April 2026):**

- `syndeogit/ion-karpathos` — original single-Nuxt-app SYNDION codebase, getting unwieldy.
- `syndeogit/wt` — Windtribe monorepo, currently bootstrapping (branch `WT-74-initialise-monorepo`) with pnpm workspaces, three apps (`guest-site`, `centre-admin`, `hotel-admin`), three packages (`shared`, `ui`, `database`).
- ION Karpathos system at "Development Complete – Ready for Season Testing" status; Portal People Finance API live; customer matching at 96.3% via composite key (Name + DOB).

**Why split now:**

- Six aspirational apps across two surfaces (centre operations + WT marketplace) cannot live in one Nuxt app without becoming unmaintainable.
- WT monorepo is in bootstrap — folding SYNDION in now is cheaper than retro-fitting later.
- Strategic positioning: SYNDION as a multi-vertical ERP only works if the codebase reflects that from the start. ION-only architecture closes doors.

## 2. Architectural Model

Three layers, in order of generality:

**SYNDION (the platform).** Generic ERP for instructor-led activity businesses. Owns: tenancy, customers, bookings, scheduling, products, calendars, payments, notifications, operational conditions, staff qualifications, equipment lifecycle. Domain-agnostic — does not know what wind, snow, or a wave is.

**Verticals.** Domain-specific bindings on top of SYNDION primitives. Windtribe is the first vertical (surf/kite/wind). Future verticals (snow schools, dive schools, climbing schools, etc.) are additional packages following the same pattern.

**Tenants.** Individual operating businesses. ION Club Karpathos is the first Windtribe tenant. Each tenant gets its own configuration, branding, and Supabase instance.

**Apps** sit across this stack:

- **Marketplace apps** (`guest-site`, `marketplace-centre`, `marketplace-hotel`) — Windtribe-branded surfaces aimed at the public and at centres listing on Windtribe.
- **Centre operations apps** (`ops-office`, `ops-team`, `ops-customer`, `ops-rentals`) — SYNDION-powered apps deployed per tenant for running the day inside a centre.

## 3. Core Architectural Principle: Generic Abstractions, Vertical Bindings

SYNDION owns the *primitives*. Verticals own the *bindings*. Profitability logic that depends on context lives in SYNDION's hooks, not in vertical-specific code paths.

This is not a stylistic preference. It is the commitment that lets SYNDION sell into more than one vertical. Violation of it forks the codebase per vertical.

**The primitives, mapped across the ICP:**

| SYNDION primitive       | Windtribe (surf)                          | Snowtribe (snow)                      | Dive school                          |
| ----------------------- | ----------------------------------------- | ------------------------------------- | ------------------------------------ |
| `operational_conditions`  | wind speed/direction, wave height, swell  | snow depth, temperature, visibility   | visibility, current, depth, water temp |
| `staff_qualifications`    | IKO / IWO / VDWS                          | BASI / ISIA / CSIA                    | PADI / SSI                           |
| `equipment_selection`     | board + sail by wind + ability            | ski + binding by ability + snow type  | tank + wetsuit + BCD by experience   |
| `lesson_segmentation`     | beginner/intermediate/advanced thresholds | same structure, different thresholds  | same                                 |
| `location_zoning`         | Main Station vs Chicken Bay               | nursery slope vs red runs             | shore dive vs boat dive              |
| `seasonality`             | May–Oct                                   | Dec–Apr                               | year-round, regional                 |

The conditions-aware scheduling engine, dynamic pricing, equipment recommendation, and capacity planning logic all live in SYNDION. They take conditions as input and produce decisions as output. Vertical packages provide the conditions data and the qualification taxonomies.

**Test for the abstraction:** any feature that would need to be rebuilt to onboard a snow school is in the wrong place. If wind logic hardcodes into syndion-core, the snow pitch fails. If wind only lives in the surf vertical with no abstraction underneath, the conditions-aware scheduling engine gets rewritten from scratch for every vertical.

The ICP isn't "surf schools and snow schools." It's **instructor-led activity businesses where conditions drive scheduling and equipment choice.** SYNDION is the ERP for that category.

## 4. Repository Layout

Single monorepo: `syndeogit/wt`.

```
wt/
  apps/
    guest-site            # windtribe.com (existing)
    marketplace-centre    # centre listing portal on WT (renamed from centre-admin)
    marketplace-hotel     # hotel listing portal on WT (renamed from hotel-admin)
    ops-office            # centre admin desktop (Radko / Mirka)
    ops-team              # instructor mobile
    ops-customer          # guest PWA with QR check-in
    ops-rentals           # NFC station
  packages/
    shared                # cross-app composables, utilities (existing)
    ui                    # design system (existing, will gain tenant theming)
    database              # Supabase schemas (existing, extended for multi-tenant)
    syndion-core          # ERP primitives: tenancy, customers, scheduling, products
    syndion-conditions    # Conditions engine (generic; takes inputs, produces decisions)
    syndion-ui            # Generic admin/ops components
    vertical-windtribe    # Surf bindings: lessons, instructors, equipment, wind data
    # future: vertical-snowtribe, vertical-dive, etc.
  tenants/
    karpathos/            # ION Karpathos config, Supabase pointer, branding, feature flags
```

**Naming conventions:**

- Apps prefixed `marketplace-` (Windtribe public/marketplace surfaces) or `ops-` (per-tenant centre operations).
- Platform packages prefixed `syndion-`.
- Vertical packages prefixed `vertical-`.
- Generic packages (`shared`, `ui`, `database`) keep their existing names.

**Why this structure:**

- The `vertical-` prefix makes the architectural intent visible in the file tree.
- Adding a new vertical (snow, dive) is a known extension point, not a fork.
- pnpm workspace globs stay flat (`apps/*`, `packages/*`) — no nested glob complexity.
- pnpm filters stay trivial: `pnpm --filter ops-office dev`.

## 5. Tooling

**Already in place (WT-74):**

- pnpm 10 workspaces, Node 20.11+
- Nuxt 3 across all apps

**Adopting now:**

- **Turborepo** — build cache, remote caching, pipeline orchestration. Cheap to add now, painful at 12+ packages.
- **Sentry** — error tracking, one org, project per app. Already in WT.
- **Playwright** — E2E tests for critical paths only:
  - Booking flow on `guest-site`
  - Drag-drop schedule on `ops-office`
  - Walk-in book → assign instructor on `ops-team`
  - NFC tap → return → invoice on `ops-rentals`
  - Customer-matching pipeline (the 96.3% logic)
  - Run against Vercel preview deploys per PR.
- **Vitest** — unit tests at package level.
- **Storybook** — component dev environment for `packages/ui` and `packages/syndion-ui`. Prevents design drift across six apps.
- **Directus** — admin plane on top of Supabase. CRUD UI for products, pricing, staff, schedule templates, lookup tables. Already in WT. **Boundary:** Directus is the admin plane; Nuxt apps with direct Supabase clients are the operational plane. Real-time/operational traffic does not route through Directus.

**Hosting:**

- Vercel — one project per app, all pointing at this monorepo with different root directories. Subdomain per app.

**On the horizon (named for context, not deciding now):**

- **PostHog** — product analytics. Knowing which features Radko uses vs ignores is the difference between "we delivered" and "we delivered things they care about."
- **Resend** or **Postmark** — transactional email. Booking confirmations, schedules, end-of-day reports.
- **Stripe** — when billing/multi-tenant subscription lands.

**Stack summary:**

```
Frontend:    Nuxt 3, Tailwind, Pinia
Backend:     Supabase (DB, auth, real-time, storage)
Admin:       Directus (on the same Postgres)
Hosting:     Vercel
Monorepo:    pnpm workspaces + Turborepo
Errors:      Sentry
E2E tests:   Playwright (critical paths only)
Unit tests:  Vitest
UI dev:      Storybook
CI:          GitHub Actions
Issues:      Jira (syndeo-test, EV/WT projects)
```

## 6. Multi-Tenancy & Data

**Tenant model:** tenant-per-database. Each centre/operator gets its own Supabase project. The apps resolve which Supabase to talk to via the tenant config in `tenants/<name>/`.

**Why not row-level multi-tenancy:** for ION Karpathos, the IP and data arrangement is specific — Syndeo owns the code, Radko/the centre owns the guest data, only Radko or his nominated representative can request access, export, or deletion. Physical separation makes that arrangement enforceable. For future hundreds of small operators, the cost of running a Supabase project per tenant is low enough that the simplicity wins.

**ION-specific data ownership:** all SYNDION code is Syndeo IP regardless of where it's deployed. Guest data in the ION Karpathos Supabase belongs to Radko/the centre.

**Activation:** centres are activated by being added to `tenants/`. For 2026 with ION as the only customer, activation is "Radko has a contract." When billing lands (post-2026 season), activation gates on subscription status.

**Federation with WT booking engine:** when the WT booking engine launches and a guest books a Karpathos lesson via WT, the booking needs to land in the ION Karpathos Supabase. Pattern is **webhook from WT → ION**: WT emits a booking-created event with a reference ID; the ION ops apps fetch full details via authenticated API. No PII pushed through shared storage. This pattern is also what replaces the current Surf Data Google Sheet flow once the new booking engine is live.

## 7. Naming & IP

**SYNDION** is the working codename for the platform. It is used in the codebase, in package names (`@syndion/core`), in Confluence, and in internal communication.

**The public product name is deferred.** SYNDION as a public-facing brand has potential trademark exposure with ION (the substring overlap, plus the etymological origin from "Syndeo + ION"). Before SYNDION is marketed externally or used as a customer-facing brand outside ION, a 30-minute trademark consultation should resolve the question.

**Windtribe** is the surf vertical brand. Customer-facing for `guest-site`, `marketplace-centre`, `marketplace-hotel`.

**For ION Karpathos in 2026:** Radko knows the system as SYNDION today. As marketplace and ops apps deploy under the Windtribe brand, the surface name will shift to Windtribe. Worth a soft heads-up to Radko at an appropriate point.

## 8. Migration Sequence

Strangler pattern, not big bang. The existing `ion-karpathos` repo keeps running until each piece is migrated.

### Phase 0 — WT monorepo bootstrap completion

- Finish WT-74 follow-ups (TypeScript config, lint, README) — already in Jira as Tasks 1.1.2 / 1.1.3 / 1.1.4
- Add Turborepo, Sentry, Playwright scaffolding, Storybook
- Rename existing `centre-admin` → `marketplace-centre`, `hotel-admin` → `marketplace-hotel`

### Phase 1 — Platform package scaffolding

- Create `packages/syndion-core`, `packages/syndion-conditions`, `packages/syndion-ui`, `packages/vertical-windtribe`
- Move shared types and primitives from `ion-karpathos` into `syndion-core`
- Establish `tenants/karpathos/` config (Supabase pointer, branding, feature flags)

### Phase 2 — Lift apps in order

1. **`ops-rentals` first** — most isolated, NFC epic is clean greenfield, lowest risk for testing the migration pattern.
2. **`ops-customer`** — guest PWA, also relatively self-contained.
3. **`ops-office`** — Radko/Mirka desktop, the heaviest app. Drag-drop scheduling, finance views, customer master.
4. **`ops-team`** — instructor mobile. Last because it depends on data from office and rentals.

Each app: lift the relevant route tree from `ion-karpathos`, refactor shared logic into `syndion-core` or `vertical-windtribe` as it surfaces, deploy to Vercel, smoke-test against ION Supabase, cut over.

### Phase 3 — Decommission `ion-karpathos`

- All four ops apps running from the WT monorepo against the ION Supabase.
- `ion-karpathos` repo archived (not deleted — kept for git history).
- Documentation updated; `ION_CLUB_SYSTEM_PLAYBOOK` references new repo paths.

**Cutover constraint:** ION Karpathos 2026 season starts May. Phase 0–2 should complete before the season ramps. Strangler approach means partial migration is safe — apps that haven't been lifted yet keep running in `ion-karpathos`.

## 9. Open Decisions

| Decision                                                  | Status                                            | Resolve by                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| Public product name (replace SYNDION externally)          | Open — trademark check needed                     | Before first non-ION customer             |
| Directus rollout for ION (now or post-season)             | Open — preference is post-season                  | Phase 2                                   |
| Billing / subscription model                              | Out of scope for 2026                             | Pre-2027 season                           |
| Federation pattern when WT booking engine launches        | Decided in principle (webhook + reference ID)     | Implementation when WT booking engine lands |
| Auth: single Supabase Auth across tenants vs per-tenant   | Open — preference is per-tenant for data isolation | Phase 1                                   |
| `tenants/` config schema                                  | Open                                              | Phase 1                                   |
| `database` package: single multi-schema vs per-tenant pkg | Open                                              | Phase 1                                   |

## 10. Out of Scope for 2026

- A second vertical (snow, dive). Architecture supports it; no resourcing this season.
- A second tenant beyond Karpathos. Architecture supports it; no go-to-market motion this season.
- Subscription billing.
- Public Storybook or component library distribution outside the monorepo.
- Internationalisation beyond what ION needs (English + minimal localisation for guests).
- Mobile native apps (PWAs only).

## 11. How This Document Is Maintained

This is the architectural source of truth. It changes when architectural decisions change.

- Updates land via PR. Significant changes get a brief commit message explaining the rationale.
- The Confluence mirror under EVOLVE space (EV09) is the readable copy for non-engineers; the repo version is canonical. If the two diverge, the repo wins.
- Claude Code reads this on every session along with `ION_CLUB_SYSTEM_PLAYBOOK.md`.
