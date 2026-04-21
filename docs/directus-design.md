# Directus — data design for WindTribe content

WindTribe uses Directus as the **content** backend, alongside Supabase for transactional data. Per the MVP plan's data-architecture split:

| Backend      | Owns                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| **Directus** | Centres, products, hotels, destinations, journal — anything edited by non-developers |
| **Supabase** | Users, bookings, availability, payments — transactional / auth-gated / RLS-guarded   |

The two reference each other by stable IDs. Directus holds the descriptive content; Supabase holds the state that needs auth and realtime.

## Instance

- **URL:** `https://directus-production-1e38.up.railway.app`
- **Provider:** Syndeo's shared Railway Directus instance
- **Version:** Directus 11.14
- **Admin login:** andy@syndeo.cz (admin role)
- **WindTribe collection prefix:** `wt_` — coexists with Syndeo marketing site collections (pages, posts, case_studies, etc.)

## Access model

Directus 11 uses **policies** (not direct role permissions) to control access. WindTribe uses two existing policies:

| Policy               | Who                                   | Access to `wt_*`                                  |
| -------------------- | ------------------------------------- | ------------------------------------------------- |
| **Administrator**    | Andy + Syndeo admins                  | Full read/write/delete                            |
| **Content - Public** | Unauthenticated visitors (guest site) | Read **only**, filtered to `status = 'published'` |

No dedicated WindTribe-scoped API token is needed. The guest-site SSR fetches `/items/wt_*` without auth — the Public policy enforces the published-only filter.

For write operations (seeding, content updates), admins use:

- The Directus web UI at `/admin` (preferred — familiar CMS workflow).
- The provisioning script at `packages/database/scripts/directus-setup.js` (schema migrations + seed).

## Collections

All three have the standard Directus fields (`id` UUID, `status`, `sort`, `date_created`, `date_updated`) plus the bespoke fields listed below. Every collection supports publish/draft/archive workflow via `status`.

### `wt_centres`

WindTribe destinations — the content for centre / destination pages (e.g. Karpathos).

| Field         | Type   | Required | Notes                                                                   |
| ------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `slug`        | string | ✓        | URL-safe, unique. e.g. `karpathos`                                      |
| `name`        | string | ✓        | Display name — e.g. `ION Karpathos`                                     |
| `tagline`     | string |          | Short one-liner                                                         |
| `description` | text   |          | Long-form destination description                                       |
| `country`     | string |          |                                                                         |
| `region`      | string |          |                                                                         |
| `hero_image`  | string |          | URL. Will upgrade to a file relationship when Andy uploads real photos. |
| `gallery`     | json   |          | Array of image URLs                                                     |

### `wt_products`

Lessons, rentals, and packages bookable at a centre.

| Field            | Type   | Required | Notes                                                                          |
| ---------------- | ------ | -------- | ------------------------------------------------------------------------------ |
| `centre`         | m2o    | ✓        | FK → `wt_centres.id`                                                           |
| `kind`           | string |          | `lesson` / `rental` / `package`                                                |
| `discipline`     | string |          | `wingfoil` / `windsurf` / `kitesurf`                                           |
| `name`           | string | ✓        |                                                                                |
| `summary`        | string |          | Short — shown on cards                                                         |
| `description`    | text   |          | Long-form                                                                      |
| `price_cents`    | int    |          | Total price in cents (28500 = €285.00). Avoids floats. Currency in `currency`. |
| `currency`       | string |          | ISO 4217. Defaults to `EUR`.                                                   |
| `duration_label` | string |          | Human-readable, e.g. `"5 mornings · coaching + kit"`                           |
| `min_level`      | string |          | `beginner` / `intermediate` / `advanced`                                       |
| `image`          | string |          | URL                                                                            |
| `includes`       | json   |          | Array of short "what's included" strings                                       |

### `wt_hotels`

Partner accommodation, optionally bundled with bookings.

| Field                | Type   | Required | Notes                          |
| -------------------- | ------ | -------- | ------------------------------ |
| `centre`             | m2o    | ✓        | FK → `wt_centres.id`           |
| `name`               | string | ✓        |                                |
| `summary`            | string |          |                                |
| `image`              | string |          | URL                            |
| `nightly_from_cents` | int    |          | Starting nightly rate in cents |
| `currency`           | string |          | ISO 4217. Default `EUR`.       |

## Naming conventions

- **Collections:** `wt_<plural_snake_case>` — e.g. `wt_centres`, `wt_journal_posts`
- **Fields:** `snake_case`
- **Money:** always `_cents` suffix, integer, no floats
- **URLs:** `slug` fields; kebab-case or snake_case, lowercase, no spaces
- **Dates:** rely on Directus's built-in `date_created` / `date_updated`

## Reading from the guest site

Nitro server routes (`apps/guest-site/server/api/centres/[slug].get.ts`, etc.) fetch from Directus server-side. Example:

```ts
const directus = useRuntimeConfig().public.directusUrl
const res = await $fetch<{ data: Centre[] }>(
  `${directus}/items/wt_centres?filter[slug][_eq]=${slug}&fields=*`,
)
```

No auth header needed — the Content - Public policy permits read on published records.

## Editing content

Andy and the Syndeo content team use the Directus admin UI:

1. Log in at `https://directus-production-1e38.up.railway.app/admin`
2. Left sidebar shows **Content** → `Wt Centres`, `Wt Products`, `Wt Hotels`
3. Edit, preview, publish. Changes are live on the next page fetch (Nuxt can ISR / revalidate per route later if caching becomes a concern).

## Schema changes — how to evolve

Any schema change (new field, rename, enum addition) goes through **both** the Directus UI (so editors see it) **and** the provisioning script (`packages/database/scripts/directus-setup.js`) so fresh instances can be rebuilt. Treat the script as a declarative spec alongside the living schema.

For destructive changes (field removal, collection rename), export existing data first via Directus's export, apply the change, re-import.

## What's next (outside Chunk A2)

- **Chunk A3:** build the `/karpathos` destination page consuming `wt_centres` + `wt_products` + `wt_hotels` via the now-wired `/api/centres/*` routes.
- **Later:** swap `hero_image` / `image` string URLs for proper Directus file relationships once real photography lands.
- **Later:** add `wt_journal_posts` collection when journal/blog content is needed (post-launch).

## Implementation notes — guest-site server routes

`apps/guest-site/server/utils/directus.ts` is the single place that talks to Directus. It reads the base URL from `runtimeConfig.public.directusUrl` (env: `NUXT_PUBLIC_DIRECTUS_URL`), appends `/items/wt_*?filter[status][_eq]=published`, and maps snake_case fields to the camelCase TypeScript types in `apps/guest-site/app/fixtures/types.ts`. The four route files (`centres/index.get.ts`, `centres/[slug].get.ts`, `centres/[slug]/products.get.ts`, `centres/[slug]/hotels.get.ts`) stay thin — slug validation, 404 on unknown centre, pass-through `{ data }`. Add new consumers by calling the exported `fetchCentres` / `fetchCentreBySlug` / `fetchProductsByCentreId` / `fetchHotelsByCentreId` helpers rather than building ad-hoc Directus URLs.
