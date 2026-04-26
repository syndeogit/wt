# Slice N — Guest-flow polish + add-ons (implementation plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close WT-47 (gear/add-ons), WT-51 (email polish), WT-52 (mobile a11y), WT-53 (regression suite). Final guest-side hardening before live Stripe. Closes EPIC 7.

**Architecture:** Five preview-checkpointed phases on `main`. Phase 1 ships a soft rider profile composable + widget. Phase 2 extracts components from the 640-line `confirm.vue`, then adds gear/add-ons selection wired through Pinia checkout store, URL state, schema migration, and server validation. Phase 3 polishes the email template. Phase 4 encodes ION-audit anti-patterns as Playwright regression tests. Phase 5 adds a mobile Playwright project and runs a manual sweep.

**Tech Stack:** Nuxt 4 + Vue 3, Pinia, Tailwind v4, Supabase (Postgres + Auth), Directus (CMS), Resend (email), Vitest (unit), Playwright + axe-core (e2e).

**Reference spec:** `docs/specs/2026-04-26-slice-n-design.md` (commit `f60eacf`).

---

## File map

**New files**
- `apps/guest-site/app/composables/useRiderProfile.ts` — soft-profile composable
- `apps/guest-site/app/composables/useRiderProfile.test.ts` — vitest unit tests
- `apps/guest-site/app/components/RiderProfileSoft.vue` — destination-page widget
- `apps/guest-site/app/components/booking/ReviewSummary.vue` — extracted from confirm.vue
- `apps/guest-site/app/components/booking/HotelPicker.vue` — extracted from confirm.vue
- `apps/guest-site/app/components/booking/AddOnsSection.vue` — new gear cards + checkbox list
- `apps/guest-site/server/utils/email.test.ts` — vitest snapshot tests
- `packages/database/supabase/migrations/20260427120000_bookings_addons.sql` — `add_on_ids` + `add_on_total_cents`
- `e2e/non-regression.spec.ts` — eight ION-audit regression tests

**Modified files**
- `apps/guest-site/app/pages/[slug]/index.vue` — mount `<RiderProfileSoft />` after hero
- `apps/guest-site/app/pages/book/[slug]/confirm.vue` — replace inline summary/hotel-picker with components, mount `<AddOnsSection />`
- `apps/guest-site/app/stores/checkout.ts` — add `selectedAddOnIds` + URL sync
- `apps/guest-site/server/api/bookings/create.post.ts` — accept `addOnIds`, validate, persist
- `apps/guest-site/server/utils/email.ts` — add-on rendering, label fix, preheader, subject ref bracket
- `playwright.config.ts` — second project for mobile

---

## Phase 1 — Soft rider profile

### Task 1.1 — `useRiderProfile` composable + tests

**Files:**
- Create: `apps/guest-site/app/composables/useRiderProfile.ts`
- Create: `apps/guest-site/app/composables/useRiderProfile.test.ts`

- [ ] **Step 1 — Write the failing test**

```ts
// apps/guest-site/app/composables/useRiderProfile.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useRiderProfileStorage } from './useRiderProfile'

describe('useRiderProfileStorage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing is stored', () => {
    const s = useRiderProfileStorage()
    expect(s.read()).toBeNull()
  })

  it('round-trips a written profile', () => {
    const s = useRiderProfileStorage()
    s.write({ discipline: 'wingfoil', level: 'beginner' })
    const got = s.read()
    expect(got?.discipline).toBe('wingfoil')
    expect(got?.level).toBe('beginner')
    expect(got?.skipped).toBeFalsy()
    expect(got?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })

  it('skip() persists a skipped marker without discipline/level', () => {
    const s = useRiderProfileStorage()
    s.skip()
    const got = s.read()
    expect(got?.skipped).toBe(true)
  })

  it('clear() removes the entry', () => {
    const s = useRiderProfileStorage()
    s.write({ discipline: 'kitesurf', level: 'intermediate' })
    s.clear()
    expect(s.read()).toBeNull()
  })

  it('ignores entries with a different schema version', () => {
    localStorage.setItem('wt:rider-profile-soft', JSON.stringify({ v: 0, discipline: 'x' }))
    const s = useRiderProfileStorage()
    expect(s.read()).toBeNull()
  })
})
```

- [ ] **Step 2 — Run test, expect fail**

Run: `pnpm test useRiderProfile`
Expected: FAIL — `useRiderProfileStorage` is not exported.

- [ ] **Step 3 — Implement the storage layer**

```ts
// apps/guest-site/app/composables/useRiderProfile.ts
export type Discipline = 'wingfoil' | 'windsurf' | 'kitesurf'
export type RiderLevel = 'beginner' | 'intermediate' | 'advanced'

export interface SoftRiderProfile {
  discipline: Discipline
  level: RiderLevel
  skipped?: boolean
  savedAt: string
}

interface StoredV1 {
  v: 1
  discipline?: Discipline
  level?: RiderLevel
  skipped?: boolean
  savedAt: string
}

const KEY = 'wt:rider-profile-soft'

export function useRiderProfileStorage() {
  function read(): SoftRiderProfile | null {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as StoredV1
      if (parsed?.v !== 1) return null
      if (parsed.skipped) {
        return { discipline: 'wingfoil', level: 'beginner', skipped: true, savedAt: parsed.savedAt }
      }
      if (!parsed.discipline || !parsed.level) return null
      return {
        discipline: parsed.discipline,
        level: parsed.level,
        savedAt: parsed.savedAt,
      }
    } catch {
      return null
    }
  }

  function write(input: { discipline: Discipline; level: RiderLevel }) {
    if (typeof localStorage === 'undefined') return
    const stored: StoredV1 = { v: 1, ...input, savedAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(stored))
  }

  function skip() {
    if (typeof localStorage === 'undefined') return
    const stored: StoredV1 = { v: 1, skipped: true, savedAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(stored))
  }

  function clear() {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(KEY)
  }

  return { read, write, skip, clear }
}
```

- [ ] **Step 4 — Run test, expect pass**

Run: `pnpm test useRiderProfile`
Expected: 5 passing.

- [ ] **Step 5 — Add the SSR-safe composable wrapper**

Append to `apps/guest-site/app/composables/useRiderProfile.ts`:

```ts
import type { CurrentUser } from './useCurrentUser'

interface RiderProfileServerRow {
  primary_discipline: Discipline | null
  level: RiderLevel | null
}

export function useRiderProfile() {
  const storage = useRiderProfileStorage()
  const local = useState<SoftRiderProfile | null>('rider-profile-soft', () => null)

  function load() {
    local.value = storage.read()
  }

  function setProfile(input: { discipline: Discipline; level: RiderLevel }) {
    storage.write(input)
    load()
  }

  function skip() {
    storage.skip()
    load()
  }

  function clear() {
    storage.clear()
    load()
  }

  // Server-side hydrate: if a signed-in user has a rider_profiles row already,
  // prefer that over localStorage. Caller passes the row in.
  function hydrateFromServer(row: RiderProfileServerRow | null) {
    if (row?.primary_discipline && row.level) {
      local.value = {
        discipline: row.primary_discipline,
        level: row.level,
        savedAt: new Date().toISOString(),
      }
    }
  }

  // Sign-in moment: if DB is empty AND we have a soft profile, push it up.
  async function syncToServerIfNeeded(_user: CurrentUser | null) {
    if (!_user) return
    const soft = storage.read()
    if (!soft || soft.skipped) return
    try {
      const res = await $fetch<{ profile: RiderProfileServerRow | null }>('/api/profile')
      if (res?.profile?.primary_discipline) return // server already has one
      await $fetch('/api/profile', {
        method: 'PUT',
        body: {
          firstName: '',
          lastName: '',
          phone: '',
          primaryDiscipline: soft.discipline,
          level: soft.level,
          notes: '',
        },
      })
    } catch (err) {
      console.error('[useRiderProfile] syncToServerIfNeeded failed', err)
    }
  }

  const isSet = computed(
    () => local.value !== null && !local.value.skipped,
  )
  const isSkipped = computed(() => local.value?.skipped === true)

  return { profile: local, load, setProfile, skip, clear, hydrateFromServer, syncToServerIfNeeded, isSet, isSkipped }
}
```

- [ ] **Step 6 — Commit**

```bash
git add apps/guest-site/app/composables/useRiderProfile.ts apps/guest-site/app/composables/useRiderProfile.test.ts
git commit -m "[Slice N] feat(profile): useRiderProfile composable + storage tests (Phase 1.1)"
```

---

### Task 1.2 — `RiderProfileSoft.vue` widget component

**Files:**
- Create: `apps/guest-site/app/components/RiderProfileSoft.vue`

- [ ] **Step 1 — Write the component**

```vue
<!-- apps/guest-site/app/components/RiderProfileSoft.vue -->
<script setup lang="ts">
import type { Discipline, RiderLevel } from '~/composables/useRiderProfile'

const { profile, load, setProfile, skip, isSet, isSkipped } = useRiderProfile()

onMounted(() => load())

const editing = ref(false)
const draftDiscipline = ref<Discipline | ''>('')
const draftLevel = ref<RiderLevel | ''>('')

watch(
  profile,
  (p) => {
    draftDiscipline.value = p?.discipline ?? ''
    draftLevel.value = p?.level ?? ''
  },
  { immediate: true },
)

const canSave = computed(() => Boolean(draftDiscipline.value && draftLevel.value))

function save() {
  if (!canSave.value) return
  setProfile({ discipline: draftDiscipline.value as Discipline, level: draftLevel.value as RiderLevel })
  editing.value = false
}

function startEdit() {
  editing.value = true
}

function summary(): string {
  if (!profile.value) return ''
  const lvl = profile.value.level.charAt(0).toUpperCase() + profile.value.level.slice(1)
  const disc = {
    wingfoil: 'wingfoiler',
    windsurf: 'windsurfer',
    kitesurf: 'kitesurfer',
  }[profile.value.discipline]
  return `${lvl} ${disc}`
}
</script>

<template>
  <div v-if="!isSkipped">
    <!-- filled, not editing -->
    <div
      v-if="isSet && !editing"
      class="bg-primary-50 border-y border-primary-200 px-6 py-2.5 flex items-center gap-3 text-sm"
      aria-live="polite"
    >
      <span class="text-primary-900">🏄 <strong>{{ summary() }}</strong></span>
      <button
        type="button"
        class="text-primary-700 underline underline-offset-4 hover:text-primary-900 text-xs"
        @click="startEdit"
      >
        Edit
      </button>
    </div>

    <!-- empty or editing -->
    <div
      v-else
      class="bg-[#fff8ea] border-y border-amber-300/60 px-6 py-3.5 flex flex-wrap items-center gap-3 text-sm"
    >
      <span class="text-amber-900 font-semibold">What do you ride?</span>
      <label class="sr-only" for="rps-discipline">Discipline</label>
      <select
        id="rps-discipline"
        v-model="draftDiscipline"
        class="border border-amber-600 bg-white px-2.5 py-1.5 rounded text-sm focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <option value="" disabled>Discipline…</option>
        <option value="wingfoil">Wingfoil</option>
        <option value="windsurf">Windsurf</option>
        <option value="kitesurf">Kitesurf</option>
      </select>
      <label class="sr-only" for="rps-level">Level</label>
      <select
        id="rps-level"
        v-model="draftLevel"
        class="border border-amber-600 bg-white px-2.5 py-1.5 rounded text-sm focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <option value="" disabled>Level…</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <button
        type="button"
        :disabled="!canSave"
        class="bg-primary-900 text-white px-3.5 py-1.5 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        @click="save"
      >
        Save
      </button>
      <button
        type="button"
        class="text-amber-900 underline underline-offset-4 hover:text-amber-950 text-xs"
        @click="skip"
      >
        Skip for now
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2 — Mount on `/[slug]` between hero and products**

Open `apps/guest-site/app/pages/[slug]/index.vue`. Locate the section between the hero and the products grid (search for the `Programmes` label). Insert immediately above that section:

```vue
<RiderProfileSoft />
```

- [ ] **Step 3 — Manual smoke**

Run dev server: `pnpm dev:guest`
Open http://localhost:3000/karpathos in incognito. Verify the empty-state strip appears, both selects required to enable Save, Save collapses to filled state, refresh preserves it, "Skip for now" hides the widget.

- [ ] **Step 4 — Add axe assertion**

Open `e2e/smoke.spec.ts`. The existing axe loop already covers `/karpathos`. Re-run e2e to confirm widget doesn't introduce a a11y regression.

Run: `pnpm e2e --project=chromium`
Expected: all green.

- [ ] **Step 5 — Commit**

```bash
git add apps/guest-site/app/components/RiderProfileSoft.vue apps/guest-site/app/pages/[slug]/index.vue
git commit -m "[Slice N] feat(profile): soft rider profile widget on /[slug] (Phase 1.2)"
```

---

### Task 1.3 — Phase 1 ship gate

- [ ] **Step 1 — Verify all ship-gate items**

Run through this checklist live in the browser at http://localhost:3000/karpathos:
- [ ] Empty state appears on first visit (clear localStorage in devtools first)
- [ ] Save is disabled until both selects are filled
- [ ] Save collapses to filled state with `🏄 Beginner wingfoiler · Edit`
- [ ] Refresh preserves the filled state
- [ ] Edit re-opens the form with current values
- [ ] Skip for now hides the widget
- [ ] After skipping, refresh keeps it hidden
- [ ] axe e2e clean

- [ ] **Step 2 — Bubble Phase 1 in Jira**

No story to transition (Phase 1 is enabling infra for WT-47). Record the work in the Phase 2 commit messages. Skip Jira for now.

---

## Phase 2 — Gear/add-ons + component extraction

### Task 2.1 — Extract `ReviewSummary.vue` (zero behaviour change)

**Files:**
- Create: `apps/guest-site/app/components/booking/ReviewSummary.vue`
- Modify: `apps/guest-site/app/pages/book/[slug]/confirm.vue`

- [ ] **Step 1 — Create the component shell**

Copy the destination/programme/dates summary card from `confirm.vue` (the section starting around line 257 with "Review your booking") into a new component. Pull props for the data it needs:

```vue
<!-- apps/guest-site/app/components/booking/ReviewSummary.vue -->
<script setup lang="ts">
import type { Centre, Hotel, Product } from '~/fixtures/types'

const props = defineProps<{
  centre: Centre
  product: Product
  arrivalLabel: string
  departureLabel: string
  nightCount: number
  selectedHotel: Hotel | null
  hotelTotalCents: number
  addOns: Array<{ name: string; perDayCents: number; totalCents: number; currency: string }>
  addOnTotalCents: number
  grandTotalCents: number
  slug: string
  routeQuery: Record<string, string | undefined>
  formatPrice: (cents: number, currency: string) => string
}>()
</script>

<template>
  <!-- paste the existing review-summary markup here, swapping in props.* references -->
</template>
```

- [ ] **Step 2 — Replace inline summary in confirm.vue**

In `confirm.vue`, replace the review-summary `<section>` with `<ReviewSummary v-bind="reviewProps" />` where `reviewProps` is a computed assembling the values. Keep `formatPrice` in `confirm.vue`'s `<script setup>` and pass it through.

- [ ] **Step 3 — Manual smoke**

Visit `/book/karpathos/confirm?products=<id>&from=2026-05-01&to=2026-05-06` (signed in with a fixture).
Expected: page renders identically to before. No visual diff.

- [ ] **Step 4 — Commit**

```bash
git add apps/guest-site/app/components/booking/ReviewSummary.vue apps/guest-site/app/pages/book/[slug]/confirm.vue
git commit -m "[Slice N] refactor(confirm): extract ReviewSummary component (Phase 2.1)"
```

---

### Task 2.2 — Extract `HotelPicker.vue` (zero behaviour change)

**Files:**
- Create: `apps/guest-site/app/components/booking/HotelPicker.vue`
- Modify: `apps/guest-site/app/pages/book/[slug]/confirm.vue`

- [ ] **Step 1 — Create the component**

```vue
<!-- apps/guest-site/app/components/booking/HotelPicker.vue -->
<script setup lang="ts">
import type { Hotel } from '~/fixtures/types'

const props = defineProps<{
  hotels: Hotel[]
  modelValue: string
  nightCount: number
  formatPrice: (cents: number, currency: string) => string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onChange(v: string) {
  emit('update:modelValue', v)
}
</script>

<template>
  <!-- paste the existing hotel-picker section markup, replacing v-model with :checked + @change -->
</template>
```

Use a `value` attribute that reads `modelValue` and emits `update:modelValue` on change.

- [ ] **Step 2 — Replace inline picker in confirm.vue**

```vue
<HotelPicker
  v-if="hotels.length"
  v-model="selectedHotelId"
  :hotels
  :night-count="nightCount"
  :format-price="formatPrice"
/>
```

- [ ] **Step 3 — Manual smoke**

Pick a hotel; verify total updates; refresh; verify hotel persists from URL.

- [ ] **Step 4 — Commit**

```bash
git add apps/guest-site/app/components/booking/HotelPicker.vue apps/guest-site/app/pages/book/[slug]/confirm.vue
git commit -m "[Slice N] refactor(confirm): extract HotelPicker component (Phase 2.2)"
```

---

### Task 2.3 — Schema migration for add-ons

**Files:**
- Create: `packages/database/supabase/migrations/20260427120000_bookings_addons.sql`

- [ ] **Step 1 — Write the migration**

```sql
-- Slice N: rental add-ons attached to a booking.
-- add_on_ids: Directus wt_products.id values (kind=rental). No FK — same
-- reason as centre_slug/product_id (Directus is a separate system).
-- add_on_total_cents: server-computed (priceCents × nights × |add_on_ids|).

ALTER TABLE public.bookings
    ADD COLUMN add_on_ids         text[]  NOT NULL DEFAULT '{}',
    ADD COLUMN add_on_total_cents integer NOT NULL DEFAULT 0
                                          CHECK (add_on_total_cents >= 0);

COMMENT ON COLUMN public.bookings.add_on_ids
    IS 'Directus wt_products.id values for rental add-ons selected on the confirm page.';
COMMENT ON COLUMN public.bookings.add_on_total_cents
    IS 'Server-computed sum across all add-ons (priceCents × nights). Independent of amount_cents (programme) and hotel_total_cents.';
```

- [ ] **Step 2 — Apply locally + verify**

Run: `pnpm --filter @windtribe/database supabase migration up` (or whatever the project uses — check `packages/database/scripts/README.md` for the canonical command).
Expected: migration applied; `\d public.bookings` shows the new columns.

- [ ] **Step 3 — Commit**

```bash
git add packages/database/supabase/migrations/20260427120000_bookings_addons.sql
git commit -m "[Slice N] feat(db): bookings.add_on_ids + add_on_total_cents (Phase 2.3)"
```

---

### Task 2.4 — Pinia store: `selectedAddOnIds` + URL sync

**Files:**
- Modify: `apps/guest-site/app/stores/checkout.ts`

- [ ] **Step 1 — Extend state + actions**

Add to `CheckoutState`:
```ts
selectedAddOnIds: string[]
```
Add to `emptyState()`: `selectedAddOnIds: []`.

Add action:
```ts
toggleAddOn(id: string) {
  const i = this.selectedAddOnIds.indexOf(id)
  if (i >= 0) this.selectedAddOnIds.splice(i, 1)
  else this.selectedAddOnIds.push(id)
},
```

In `toQuery()`:
```ts
if (this.selectedAddOnIds.length) q.addons = this.selectedAddOnIds.join(',')
```

In `fromQuery()`:
```ts
if (typeof query.addons === 'string') {
  this.selectedAddOnIds = query.addons.split(',').filter(Boolean)
}
```

- [ ] **Step 2 — Commit**

```bash
git add apps/guest-site/app/stores/checkout.ts
git commit -m "[Slice N] feat(store): selectedAddOnIds + URL sync (Phase 2.4)"
```

---

### Task 2.5 — `AddOnsSection.vue` component

**Files:**
- Create: `apps/guest-site/app/components/booking/AddOnsSection.vue`

- [ ] **Step 1 — Write the component**

```vue
<!-- apps/guest-site/app/components/booking/AddOnsSection.vue -->
<script setup lang="ts">
import type { Product } from '~/fixtures/types'

const props = defineProps<{
  products: Product[] // already filtered to kind === 'rental' by parent
  modelValue: string[]
  nightCount: number
  formatPrice: (cents: number, currency: string) => string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const { profile } = useRiderProfile()

const levelOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

function isLevelMatch(p: Product): boolean {
  const profLvl = profile.value?.level
  if (!profLvl) return false
  return levelOrder[profLvl] >= levelOrder[p.minLevel]
}

function isDisciplineMatch(p: Product): boolean {
  return profile.value?.discipline === p.discipline
}

function toggle(id: string) {
  const next = [...props.modelValue]
  const i = next.indexOf(id)
  if (i >= 0) next.splice(i, 1)
  else next.push(id)
  emit('update:modelValue', next)
}

function isSelected(id: string) {
  return props.modelValue.includes(id)
}
</script>

<template>
  <section
    v-if="products.length"
    class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    aria-labelledby="addons-heading"
  >
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Gear and rentals
    </p>
    <h2
      id="addons-heading"
      class="font-display text-2xl sm:text-3xl text-primary-900 leading-tight text-pretty"
    >
      Need any gear?
    </h2>
    <p class="mt-3 text-sm text-primary-700 max-w-xl">
      Optional. Per day × your booking length, swappable any time at the centre.
    </p>

    <ul class="mt-6 grid gap-3">
      <li v-for="p in products" :key="p.id">
        <label
          class="flex items-start gap-4 rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 cursor-pointer transition-colors has-[:checked]:border-primary-900 has-[:checked]:bg-primary-50"
        >
          <input
            type="checkbox"
            class="mt-1 h-4 w-4 accent-primary-900 border-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500"
            :checked="isSelected(p.id)"
            @change="toggle(p.id)"
          />
          <span class="flex-1 flex flex-col sm:flex-row gap-4">
            <span
              v-if="p.image"
              class="relative w-full sm:w-32 aspect-[4/3] sm:aspect-square sm:flex-shrink-0 rounded-lg overflow-hidden bg-primary-100"
            >
              <NuxtImg
                :src="p.image"
                :alt="`${p.name} — photo`"
                class="absolute inset-0 w-full h-full object-cover"
                width="600"
                height="600"
                sizes="(min-width: 640px) 128px, 100vw"
                loading="lazy"
              />
            </span>
            <span class="flex-1">
              <span class="flex flex-wrap items-start gap-2">
                <span class="block font-display text-lg text-primary-900">{{ p.name }}</span>
                <span
                  v-if="isLevelMatch(p)"
                  class="text-[10px] uppercase tracking-[0.18em] bg-primary-900 text-white px-1.5 py-0.5 rounded"
                  data-testid="badge-level-match"
                >For your level</span>
                <span
                  v-if="isDisciplineMatch(p)"
                  class="text-[10px] uppercase tracking-[0.18em] bg-accent-700 text-white px-1.5 py-0.5 rounded"
                  data-testid="badge-discipline-match"
                >Match your discipline</span>
              </span>
              <span v-if="p.summary" class="block mt-1 text-sm text-primary-700 leading-relaxed">
                {{ p.summary }}
              </span>
              <span class="block mt-3 text-sm text-primary-900 tabular-nums">
                {{ formatPrice(p.priceCents, p.currency) }}<span class="text-primary-700">&nbsp;/ day</span>
                <span class="text-primary-700">
                  · {{ nightCount }} day{{ nightCount === 1 ? '' : 's' }} =
                </span>
                <span class="font-semibold">{{ formatPrice(p.priceCents * nightCount, p.currency) }}</span>
              </span>
            </span>
          </span>
        </label>
      </li>
    </ul>
  </section>
</template>
```

- [ ] **Step 2 — Commit**

```bash
git add apps/guest-site/app/components/booking/AddOnsSection.vue
git commit -m "[Slice N] feat(booking): AddOnsSection component (Phase 2.5)"
```

---

### Task 2.6 — Wire AddOnsSection into confirm.vue

**Files:**
- Modify: `apps/guest-site/app/pages/book/[slug]/confirm.vue`

- [ ] **Step 1 — Compute rentals + selection state**

In `confirm.vue` `<script setup>`:

```ts
const rentals = computed(() => products.value.filter((p) => p.kind === 'rental'))

// URL-synced add-on selection
const selectedAddOnIds = ref<string[]>(
  typeof route.query.addons === 'string' && route.query.addons.length
    ? route.query.addons.split(',').filter(Boolean)
    : [],
)
watch(selectedAddOnIds, (ids) => {
  const query = { ...route.query }
  if (ids.length) query.addons = ids.join(',')
  else delete query.addons
  router.replace({ query })
}, { deep: true })

// Drop any URL'd ids that don't actually exist at this centre
watch(rentals, (list) => {
  selectedAddOnIds.value = selectedAddOnIds.value.filter((id) => list.some((r) => r.id === id))
})

const selectedAddOns = computed(() =>
  selectedAddOnIds.value
    .map((id) => rentals.value.find((r) => r.id === id))
    .filter((p): p is Product => p !== undefined),
)
const addOnTotalCents = computed(() =>
  selectedAddOns.value.reduce((sum, p) => sum + p.priceCents * nightCount.value, 0),
)

const addOnsForSummary = computed(() =>
  selectedAddOns.value.map((p) => ({
    name: p.name,
    perDayCents: p.priceCents,
    totalCents: p.priceCents * nightCount.value,
    currency: p.currency,
  })),
)
```

Update `grandTotalCents`:
```ts
const grandTotalCents = computed(
  () => (product.value ? product.value.priceCents : 0) + hotelTotalCents.value + addOnTotalCents.value,
)
```

- [ ] **Step 2 — Mount component between summary and hotel picker**

In template, between `<ReviewSummary />` and `<HotelPicker />`:
```vue
<AddOnsSection
  v-if="rentals.length"
  v-model="selectedAddOnIds"
  :products="rentals"
  :night-count="nightCount"
  :format-price="formatPrice"
/>
```

- [ ] **Step 3 — Pass add-ons through to ReviewSummary**

Update the `<ReviewSummary>` props binding to include `:add-ons="addOnsForSummary"`, `:add-on-total-cents="addOnTotalCents"`, `:grand-total-cents="grandTotalCents"`. Update `ReviewSummary.vue` template to render add-on rows in the totals panel:

```vue
<div
  v-for="a in addOns"
  :key="a.name"
  class="flex items-baseline justify-between gap-4"
>
  <dt class="text-primary-700">
    {{ a.name }} · {{ nightCount }} day{{ nightCount === 1 ? '' : 's' }}
  </dt>
  <dd class="text-primary-900 font-medium">{{ formatPrice(a.totalCents, a.currency) }}</dd>
</div>
```

Place this loop above the hotel total line.

- [ ] **Step 4 — Pass `addOnIds` to bookings/create**

In `placeBooking()`, change the body:
```ts
const res = await $fetch<{ url: string; bookingRef: string }>('/api/bookings/create', {
  method: 'POST',
  body: {
    centreSlug: slug.value,
    productId: productId.value,
    arrival: route.query.from,
    departure: route.query.to,
    hotelId: selectedHotelId.value || null,
    addOnIds: selectedAddOnIds.value,
  },
})
```

- [ ] **Step 5 — Commit**

```bash
git add apps/guest-site/app/pages/book/[slug]/confirm.vue apps/guest-site/app/components/booking/ReviewSummary.vue
git commit -m "[Slice N] feat(booking): wire AddOnsSection through confirm + summary (Phase 2.6)"
```

---

### Task 2.7 — Server: validate + persist add-ons

**Files:**
- Modify: `apps/guest-site/server/api/bookings/create.post.ts`

- [ ] **Step 1 — Accept + validate**

Inside the body type:
```ts
addOnIds?: string[]
```

After `nightsBetween(...)` calculation, add:

```ts
const nights = nightsBetween(body.arrival, body.departure)

let resolvedAddOnIds: string[] = []
let addOnTotalCents = 0
if (Array.isArray(body.addOnIds) && body.addOnIds.length) {
  for (const id of body.addOnIds) {
    const addOn = products.find((p) => p.id === id && p.kind === 'rental')
    if (!addOn) {
      throw createError({
        statusCode: 400,
        statusMessage: `Add-on ${id} is not a rental at this centre`,
      })
    }
    resolvedAddOnIds.push(addOn.id)
    addOnTotalCents += addOn.priceCents * nights
  }
}
```

- [ ] **Step 2 — Persist on insert**

In the `.insert(...)` payload, add:
```ts
add_on_ids: resolvedAddOnIds,
add_on_total_cents: addOnTotalCents,
```

- [ ] **Step 3 — Commit (email caller change deferred to Phase 3 to keep typecheck clean)**

`BookingEmailInput` doesn't yet have an `addOns` field — that lands in Phase 3.1. Don't touch the `sendBookingConfirmation(...)` call here. Phase 3.1 will add the field AND wire the caller in one commit.

```bash
git add apps/guest-site/server/api/bookings/create.post.ts
git commit -m "[Slice N] feat(api): validate + persist add-ons on bookings/create (Phase 2.7)"
```

---

### Task 2.8 — Phase 2 ship gate + Jira

- [ ] **Step 1 — End-to-end manual test**

Sign out → open `/karpathos` in incognito → fill rider profile (wingfoil-beginner) → click a wingfoil-beginner programme → pick dates → confirm page should show:
- [ ] Gear/rentals section visible (if Karpathos has any rentals)
- [ ] "For your level" / "Match your discipline" badges on matching cards
- [ ] Selecting a rental adds line to summary, updates grand total
- [ ] Refresh preserves selections
- [ ] Sign in → place booking → check Supabase `bookings` row has `add_on_ids` and `add_on_total_cents` populated

- [ ] **Step 2 — Server validation negative test**

Use curl to POST `/api/bookings/create` with an `addOnIds` containing a foreign UUID:
```
{"centreSlug":"karpathos","productId":"<valid>","arrival":"2026-05-01","departure":"2026-05-06","addOnIds":["00000000-0000-0000-0000-000000000000"]}
```
Expected: 400 with `Add-on ... is not a rental at this centre`.

- [ ] **Step 3 — Transition WT-47 to Done**

Use the Python pattern from `.tmp/jira_backfill_audit.py` — copy as a template into `.tmp/jira_close_wt47.py` and run. Comment must cite the Phase 2 commits (2.1-2.7 SHAs). Bubble-up comment on WT-7 epic to record progress.

---

## Phase 3 — Email polish

### Task 3.1 — Extend `BookingEmailInput` + label fix

**Files:**
- Modify: `apps/guest-site/server/utils/email.ts`

- [ ] **Step 1 — Add the new field to the type**

```ts
export interface BookingEmailInput {
  // ...existing fields...
  addOns: Array<{ name: string; perDayCents: number; nights: number; totalCents: number }>
}
```

Update `grandTotalCents()`:
```ts
function grandTotalCents(input: BookingEmailInput): number {
  return input.amountCents
    + (input.hotelTotalCents ?? 0)
    + input.addOns.reduce((sum, a) => sum + a.totalCents, 0)
}
```

- [ ] **Step 2 — Fix the duplicate `Programme:` label**

In `renderTextBody`, line 90 currently reads:
```ts
`Programme:   ${formatPrice(input.amountCents, input.currency)}`,
```
Change to:
```ts
`Price:       ${formatPrice(input.amountCents, input.currency)}`,
```

In `renderHtmlBody`, the second `${row('Programme', formatPrice(...))}` becomes `${row('Price', formatPrice(...))}`.

- [ ] **Step 3 — Render add-on lines (text)**

Just before the hotel block in `renderTextBody`, insert:
```ts
input.addOns.forEach((a) => {
  lines.push(
    `Gear:        ${a.name} — ${formatPrice(a.perDayCents, input.currency)}/day x ${a.nights} = ${formatPrice(a.totalCents, input.currency)}`,
  )
})
```

If `addOns.length || hotelName`, ensure a `Total:` line is pushed; the hotel-only branch currently only pushes Total when hotel present. Adjust:
```ts
const hasExtras = input.addOns.length > 0 || (input.hotelName && input.hotelTotalCents !== null)
if (hasExtras) {
  lines.push(`Total:       ${formatPrice(grandTotalCents(input), input.currency)}`)
}
```

- [ ] **Step 4 — Render add-on rows (HTML)**

In `renderHtmlBody`, just before the hotel-block ternary, add:
```ts
${input.addOns
  .map((a) =>
    row(
      'Gear',
      esc(a.name) +
        ' — ' +
        formatPrice(a.perDayCents, input.currency) +
        '/day × ' +
        a.nights +
        ' = ' +
        formatPrice(a.totalCents, input.currency),
    ),
  )
  .join('')}
```

Also update the existing hotel ternary to add `row('Total', ...)` when `addOns.length > 0` even without a hotel.

- [ ] **Step 4b — Wire caller in `bookings/create.post.ts`**

In `apps/guest-site/server/api/bookings/create.post.ts`, inside the email try-block, build the add-on array (Phase 2.7 already computed `resolvedAddOnIds` and `nights`):

```ts
const addOnsForEmail = resolvedAddOnIds.map((id) => {
  const p = products.find((pp) => pp.id === id)!
  return { name: p.name, perDayCents: p.priceCents, nights, totalCents: p.priceCents * nights }
})
```

Pass through to `sendBookingConfirmation({ ..., addOns: addOnsForEmail })`.

- [ ] **Step 5 — Add preheader + bracketed subject**

In `renderHtmlBody`, immediately inside `<body>`:
```html
<div style="display:none;font-size:1px;color:transparent;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden">Booking ${esc(input.bookingRef)} · ${esc(formatHumanDate(input.arrival))} → ${esc(formatHumanDate(input.departure))} · ${esc(input.centreName)}</div>
```

In `sendBookingConfirmation`, the existing subject is:
```ts
const subject = `Booking received — ${input.productName} at ${input.centreName} (${input.bookingRef})`
```
Change to:
```ts
const subject = `Booking received — ${input.productName} at ${input.centreName} [${input.bookingRef}]`
```

- [ ] **Step 6 — Commit**

```bash
git add apps/guest-site/server/utils/email.ts apps/guest-site/server/api/bookings/create.post.ts
git commit -m "[Slice N] feat(email): add-on lines + label fix + preheader + bracketed subject + wire caller (Phase 3.1)"
```

---

### Task 3.2 — Snapshot tests for email rendering

**Files:**
- Create: `apps/guest-site/server/utils/email.test.ts`

- [ ] **Step 1 — Write the snapshot tests**

```ts
// apps/guest-site/server/utils/email.test.ts
import { describe, expect, it } from 'vitest'
import { renderHtmlBody, renderTextBody } from './email'
import type { BookingEmailInput } from './email'

const base: BookingEmailInput = {
  to: 'guest@example.com',
  bookingRef: 'WT-KA-20260501-XYZA',
  centreName: 'ION Karpathos',
  centreRegion: 'South Aegean',
  centreCountry: 'Greece',
  productName: 'Wing week — 5 days',
  productDurationLabel: '5 days · coaching + rental',
  arrival: '2026-05-01',
  departure: '2026-05-06',
  amountCents: 78000,
  currency: 'EUR',
  firstName: 'Andy',
  lastName: 'Test',
  hotelName: null,
  hotelNightlyCents: null,
  hotelTotalCents: null,
  addOns: [],
}

describe('renderTextBody', () => {
  it('snapshot — no extras', () => {
    expect(renderTextBody(base)).toMatchSnapshot()
  })
  it('snapshot — hotel only', () => {
    expect(renderTextBody({
      ...base,
      hotelName: 'Karpathos Beach Hotel',
      hotelNightlyCents: 9500,
      hotelTotalCents: 47500,
    })).toMatchSnapshot()
  })
  it('snapshot — add-ons only', () => {
    expect(renderTextBody({
      ...base,
      addOns: [{ name: 'Windsurf kit', perDayCents: 6500, nights: 5, totalCents: 32500 }],
    })).toMatchSnapshot()
  })
  it('snapshot — hotel + add-ons', () => {
    expect(renderTextBody({
      ...base,
      hotelName: 'Karpathos Beach Hotel',
      hotelNightlyCents: 9500,
      hotelTotalCents: 47500,
      addOns: [{ name: 'Windsurf kit', perDayCents: 6500, nights: 5, totalCents: 32500 }],
    })).toMatchSnapshot()
  })
})

describe('renderHtmlBody', () => {
  it('snapshot — hotel + add-ons', () => {
    expect(renderHtmlBody({
      ...base,
      hotelName: 'Karpathos Beach Hotel',
      hotelNightlyCents: 9500,
      hotelTotalCents: 47500,
      addOns: [{ name: 'Windsurf kit', perDayCents: 6500, nights: 5, totalCents: 32500 }],
    })).toMatchSnapshot()
  })
})
```

- [ ] **Step 2 — Run, accept snapshots**

Run: `pnpm test email`
Expected: 5 snapshots written, all pass on second run.

- [ ] **Step 3 — Eyeball one rendered HTML output**

Add a one-off:
```bash
pnpm exec tsx -e "import('./apps/guest-site/server/utils/email.ts').then(m => console.log(m.renderHtmlBody({...})))"
```
Or manually view the snapshot file; verify the preheader, subject hint, and add-on rows look right.

- [ ] **Step 4 — Commit**

```bash
git add apps/guest-site/server/utils/email.test.ts apps/guest-site/server/utils/__snapshots__/
git commit -m "[Slice N] test(email): snapshot tests for hotel + add-on combinations (Phase 3.2)"
```

---

### Task 3.3 — Phase 3 ship gate + Jira

- [ ] **Step 1 — Send a real test email if RESEND_API_KEY is set**

If `.env.local` has a Resend test key, place a fixture booking with one rental selected. Open the inbox preview. Verify:
- [ ] Subject ends in `[WT-KA-...]`
- [ ] Preheader text appears in inbox preview, not in the body
- [ ] HTML renders add-on row (`Gear: Windsurf kit — €65/day × 5 = €325`)
- [ ] Total row sums everything

- [ ] **Step 2 — Transition WT-51 to Done**

Copy `.tmp/jira_backfill_audit.py` template; run with WT-51 → Done, comment citing Phase 3.1 + 3.2 SHAs. Add bubble-up comment on WT-7 epic.

---

## Phase 4 — Regression suite

### Task 4.1 — Bootstrap the regression spec file

**Files:**
- Create: `e2e/non-regression.spec.ts`

- [ ] **Step 1 — Write the test scaffold + first test**

```ts
// e2e/non-regression.spec.ts
//
// Slice H + Slice N: encode every behavioural anti-pattern from
// docs/mvp-plan.md:114-123 as a Playwright test. Each test is keyed to a
// stable Directus fixture or Supabase seed booking so content drift doesn't
// break it.

import { expect, test } from '@playwright/test'

test('real-prices-shown — destination page never shows "From €"', async ({ page }) => {
  await page.goto('/karpathos')
  await page.waitForLoadState('domcontentloaded')

  // Scope to product card price elements only — prose can legitimately say "from €"
  const priceTexts = await page.locator('[data-testid^="product-price"]').allTextContents()
  for (const t of priceTexts) {
    expect(t.toLowerCase()).not.toMatch(/^from\s*€/)
  }
})
```

Note: this requires `data-testid="product-price-*"` on product card price elements — add it as part of this task. Search `apps/guest-site/app/pages/[slug]/index.vue` for the price line and add the attribute.

- [ ] **Step 2 — Run, expect pass (current code already complies)**

Run: `pnpm e2e e2e/non-regression.spec.ts`
Expected: pass.

- [ ] **Step 3 — Commit**

```bash
git add e2e/non-regression.spec.ts apps/guest-site/app/pages/[slug]/index.vue
git commit -m "[Slice N] test(e2e): non-regression scaffold + real-prices-shown (Phase 4.1)"
```

---

### Task 4.2 — `anonymous-browse-allowed`

- [ ] **Step 1 — Add test**

Append to `e2e/non-regression.spec.ts`:

```ts
test('anonymous-browse-allowed — public pages do not redirect to /login', async ({ page }) => {
  for (const path of ['/karpathos', '/karpathos/conditions', '/wing']) {
    await page.goto(path)
    await page.waitForLoadState('domcontentloaded')
    expect(page.url(), `expected ${path} to render anonymously, not redirect`).not.toContain('/login')
    await expect(page.locator('h1')).toBeVisible()
  }
})
```

- [ ] **Step 2 — Run, expect pass**

Run: `pnpm e2e e2e/non-regression.spec.ts -g anonymous`
Expected: pass.

- [ ] **Step 3 — Commit**

```bash
git add e2e/non-regression.spec.ts
git commit -m "[Slice N] test(e2e): anonymous-browse-allowed (Phase 4.2)"
```

---

### Task 4.3 — `profile-after-selection`

- [ ] **Step 1 — Add test**

```ts
test('profile-after-selection — /book/[slug] does not ask for personal data', async ({ page }) => {
  await page.goto('/book/karpathos')
  await page.waitForLoadState('domcontentloaded')
  // Should be a date picker page, not a profile form
  await expect(page.locator('input[autocomplete="given-name"]')).toHaveCount(0)
  await expect(page.locator('input[autocomplete="family-name"]')).toHaveCount(0)
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
})
```

- [ ] **Step 2 — Run, expect pass; commit**

```bash
git add e2e/non-regression.spec.ts
git commit -m "[Slice N] test(e2e): profile-after-selection (Phase 4.3)"
```

---

### Task 4.4 — `no-pre-selected-upsells`

- [ ] **Step 1 — Add test**

```ts
test('no-pre-selected-upsells — /confirm has no auto-selected hotel/add-on/badge', async ({ page, context }) => {
  // Sign in via the existing fixture user (reuse the smoke.spec helper if any;
  // else use programmatic Supabase login for a seeded test user).
  await signInTestUser(page, context)
  await page.goto('/book/karpathos/confirm?products=<FIXTURE_PRODUCT_ID>&from=2026-06-01&to=2026-06-06')
  await page.waitForLoadState('domcontentloaded')

  const checkedHotel = await page.locator('input[name="hotel"]:checked').count()
  expect(checkedHotel, 'no hotel should be auto-checked').toBe(1) // the "I'll sort my own" radio
  // The 1 represents the empty-string value option, NOT a paid hotel.
  const value = await page.locator('input[name="hotel"]:checked').getAttribute('value')
  expect(value).toBe('')

  // No add-on checkbox is checked
  const checkedAddOns = await page.locator('section[aria-labelledby="addons-heading"] input[type="checkbox"]:checked').count()
  expect(checkedAddOns).toBe(0)

  // No "For your level" badge auto-renders before profile is set
  // (anonymous user should not see badges; signed-in test user has no profile)
  const badgeCount = await page.locator('[data-testid="badge-level-match"]').count()
  expect(badgeCount).toBe(0)
})

async function signInTestUser(page, context) {
  // TODO if a sign-in helper already exists, import + reuse. Otherwise:
  await page.goto('/login')
  await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL!)
  await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}
```

- [ ] **Step 2 — Add `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` to local + CI env**

Document in `apps/guest-site/.env.example`. Seed a test user via Supabase dashboard if not already present.

- [ ] **Step 2b — Resolve the fixture product ID once**

Run this curl to grab a Karpathos product ID, then hard-code it as `FIXTURE_PRODUCT_ID` constant at the top of `e2e/non-regression.spec.ts`:

```bash
curl -s "$NUXT_PUBLIC_DIRECTUS_URL/items/wt_products?filter[centre][slug][_eq]=karpathos&filter[kind][_eq]=lesson&fields=id,name&limit=1" | jq -r '.data[0].id'
```

If Directus auth is required, prefix with the admin token from `C:\dev\dev\CLAUDE.md`. Substitute the returned UUID for every `<FIXTURE_PRODUCT_ID>` in the spec.

- [ ] **Step 3 — Run; commit**

```bash
git add e2e/non-regression.spec.ts apps/guest-site/.env.example
git commit -m "[Slice N] test(e2e): no-pre-selected-upsells + signin helper (Phase 4.4)"
```

---

### Task 4.5 — `url-state-survives-refresh`

- [ ] **Step 1 — Add test**

```ts
test('url-state-survives-refresh — selections persist on /confirm', async ({ page, context }) => {
  await signInTestUser(page, context)
  await page.goto('/book/karpathos/confirm?products=<FIXTURE_PRODUCT_ID>&from=2026-06-01&to=2026-06-06')
  await page.waitForLoadState('domcontentloaded')

  // Pick a hotel
  const hotelRadio = page.locator('input[name="hotel"]').nth(1) // first non-empty
  if (await hotelRadio.count()) {
    await hotelRadio.check()
  }
  // Pick an add-on if any
  const addOnCheckbox = page.locator('section[aria-labelledby="addons-heading"] input[type="checkbox"]').first()
  if (await addOnCheckbox.count()) {
    await addOnCheckbox.check()
  }

  await page.reload()
  await page.waitForLoadState('domcontentloaded')

  // Both should still be checked
  if (await hotelRadio.count()) expect(await hotelRadio.isChecked()).toBe(true)
  if (await addOnCheckbox.count()) expect(await addOnCheckbox.isChecked()).toBe(true)
})
```

- [ ] **Step 2 — Run; commit**

```bash
git add e2e/non-regression.spec.ts
git commit -m "[Slice N] test(e2e): url-state-survives-refresh (Phase 4.5)"
```

---

### Task 4.6 — `no-auto-substitution`

- [ ] **Step 1 — Add test**

```ts
test('no-auto-substitution — empty centre renders empty state, never a different centre', async ({ page }) => {
  // Hit an endpoint with no products. Either a centre with zero rentals/lessons, or a slug that
  // resolves to a centre but has no published products. Use a seeded "empty-test" centre.
  const SLUG = 'empty-test'
  const response = await page.goto(`/${SLUG}`)
  if (response && response.status() === 404) return // expected if no fixture
  await page.waitForLoadState('domcontentloaded')

  // Page should NOT silently show another centre's content
  const headingText = (await page.locator('h1').first().textContent()) ?? ''
  expect(headingText.toLowerCase()).not.toContain('karpathos')
  // Should show some empty-state copy
  await expect(page.locator('text=/no products|coming soon|nothing to book/i')).toBeVisible()
})
```

If no `empty-test` centre exists, gate this test with `test.skip(true, 'requires empty-test fixture')` and file a follow-up to seed the fixture.

- [ ] **Step 2 — Run; commit**

```bash
git add e2e/non-regression.spec.ts
git commit -m "[Slice N] test(e2e): no-auto-substitution (Phase 4.6)"
```

---

### Task 4.7 — `lazy-loaded-images`

- [ ] **Step 1 — Add test**

```ts
test('lazy-loaded-images — non-LCP images opt in to lazy or auto fetchpriority', async ({ page }) => {
  await page.goto('/karpathos')
  await page.waitForLoadState('domcontentloaded')

  // The hero image is the LCP — exclude it (assume it has fetchpriority="high").
  const offendingCount = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    return imgs.filter((img) => {
      if (img.fetchPriority === 'high') return false
      const lazy = img.loading === 'lazy'
      const auto = img.fetchPriority === 'auto' || img.fetchPriority === ''
      return !(lazy || auto)
    }).length
  })
  expect(offendingCount).toBe(0)
})
```

- [ ] **Step 2 — Run; commit**

```bash
git add e2e/non-regression.spec.ts
git commit -m "[Slice N] test(e2e): lazy-loaded-images (Phase 4.7)"
```

---

### Task 4.8 — `gear-soft-guidance-only`

- [ ] **Step 1 — Add test**

```ts
test('gear-soft-guidance-only — mismatched gear is selectable, not disabled', async ({ page, context }) => {
  await signInTestUser(page, context)

  // Set the soft profile to wingfoil-beginner via localStorage before navigating
  await page.addInitScript(() => {
    localStorage.setItem(
      'wt:rider-profile-soft',
      JSON.stringify({
        v: 1,
        discipline: 'wingfoil',
        level: 'beginner',
        savedAt: new Date().toISOString(),
      }),
    )
  })

  await page.goto('/book/karpathos/confirm?products=<FIXTURE_PRODUCT_ID>&from=2026-06-01&to=2026-06-06')
  await page.waitForLoadState('domcontentloaded')

  const cards = page.locator('section[aria-labelledby="addons-heading"] li')
  const count = await cards.count()
  for (let i = 0; i < count; i++) {
    const checkbox = cards.nth(i).locator('input[type="checkbox"]')
    expect(await checkbox.isDisabled()).toBe(false)
    expect(await checkbox.getAttribute('aria-disabled')).not.toBe('true')
  }
})
```

- [ ] **Step 2 — Run; commit**

```bash
git add e2e/non-regression.spec.ts
git commit -m "[Slice N] test(e2e): gear-soft-guidance-only (Phase 4.8)"
```

---

### Task 4.9 — Phase 4 ship gate + Jira

- [ ] **Step 1 — Run the full regression suite**

Run: `pnpm e2e e2e/non-regression.spec.ts`
Expected: 8 passing (or 7 + 1 skipped if `empty-test` fixture absent).

- [ ] **Step 2 — Verify each test fails meaningfully**

For each test, temporarily break the rule (e.g., add `:checked` to a hotel radio) and confirm the test fails with a useful message. Revert.

- [ ] **Step 3 — Run in CI**

Push the branch (or merge to main if all green). Verify CI runs the new spec and passes.

- [ ] **Step 4 — Transition WT-53 to Done**

Same Python pattern. Comment citing Phase 4 SHAs. Bubble-up on WT-7 epic.

---

## Phase 5 — Mobile axe project + manual sweep

### Task 5.1 — Add mobile Playwright project

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1 — Add project**

```ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 7'] },
  },
],
```

- [ ] **Step 2 — Run; verify all green**

Run: `pnpm e2e`
Expected: all axe + non-regression tests pass against both projects. Investigate any new mobile-only failures inline.

- [ ] **Step 3 — Commit**

```bash
git add playwright.config.ts
git commit -m "[Slice N] test(e2e): add mobile-chrome project (Phase 5.1)"
```

---

### Task 5.2 — Manual mobile sweep

- [ ] **Step 1 — Open Chrome DevTools, switch to Pixel 7 viewport**

Walk every page below. For each, check the Phase 5 checklist (tap targets ≥44×44, no horizontal scroll, sticky elements don't cover content, form keyboards correct, soft keyboard doesn't break layout, no layout shift). Record findings in the spec's "Findings log" section.

- [ ] `/`
- [ ] `/destinations`
- [ ] `/karpathos`
- [ ] `/karpathos/conditions`
- [ ] `/wing`
- [ ] `/journal`
- [ ] `/book`
- [ ] `/book/karpathos`
- [ ] `/book/karpathos/confirm` (logged in, with fixture state)
- [ ] `/book/success` (after fixture booking)
- [ ] `/login`
- [ ] `/signup`
- [ ] `/forgot-password`
- [ ] `/account`

- [ ] **Step 2 — Update findings log**

Append findings to `docs/specs/2026-04-26-slice-n-design.md` under "Findings log". One row per finding with `page · severity · description · resolution`.

---

### Task 5.3 — Fix severity-high findings

- [ ] **Step 1 — Triage**

For each finding logged in 5.2:
- severity-high (broken UX, blocked flow): fix here
- severity-medium ≤10 min: fix here
- severity-medium >10 min: file follow-up Jira ticket (story under WT-7, or future polish epic)
- severity-low cosmetic: file follow-up only

- [ ] **Step 2 — Apply fixes**

Each fix is its own commit with a clear message: `[Slice N] fix(<area>): <what>`.

- [ ] **Step 3 — Re-run e2e**

Run: `pnpm e2e`
Expected: still all green on both projects.

---

### Task 5.4 — Phase 5 ship gate + Jira + EPIC closeout

- [ ] **Step 1 — Final pass**

- [ ] All five phases shipped on `main`
- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test` clean
- [ ] `pnpm e2e` clean (both projects)
- [ ] WT-47, WT-51, WT-53, WT-52 all transitioned to Done with SHA citations

- [ ] **Step 2 — Transition WT-52 to Done**

Comment citing Phase 5 SHAs + findings log location.

- [ ] **Step 3 — Verify EPIC 7 (WT-7) status**

Check children: WT-43 Done, WT-44 Done, WT-45 Done, WT-46 Done, WT-47 Done (this slice), WT-48 Done, WT-49 Done, WT-50 In Progress (Stripe — parked), WT-51 Done (this slice), WT-52 Done (this slice), WT-53 Done (this slice).

WT-50 is the only blocker for closing the epic. Leave WT-7 In Progress until Slice F live ships.

- [ ] **Step 4 — Update session log**

Append to `docs/SESSION_LOG_2026-04-26_continuation.md` (or create `docs/SESSION_LOG_2026-04-XX_slice-n.md` if more apt) with: phases shipped, SHAs, Jira state, mobile-sweep findings summary, what's next (Slice O = Syndion widget WT-103, then Slice F live when WT-102 unblocks).

---

## Open follow-ups documented for after slice

- **WT-102** (already created): Bara to set up Stripe test-mode account + send `sk_test_…` to Andy. Unblocks Slice F live.
- **WT-103** (to create when Slice N closes): live lessons widget against Syndion `/api/public/v1/lessons` feed. Recommended approach: native WindTribe component, no proxy yet.
- Mobile findings filed as separate tickets (severity-medium >10 min and severity-low).
- Custom email `from` domain — separate Bara DNS ticket if/when we hit volume that justifies leaving `onboarding@resend.dev`.
- Lighthouse-mobile-in-CI perf budgets — own slice during launch prep.

---

## Self-review checklist (already run)

- [x] Spec coverage: every section/requirement in the spec maps to at least one task
- [x] No placeholders (search-checked for TBD/TODO except the intentional findings log)
- [x] Type consistency: `selectedAddOnIds`, `addOns`, `add_on_ids`, `add_on_total_cents` used identically across all tasks
- [x] Each commit message references the phase number for traceability
- [x] All file paths absolute from repo root
