<script setup lang="ts">
import { getLocalTimeZone, parseDate } from '@internationalized/date'
import type { Centre, Hotel, Product } from '~/fixtures/types'

definePageMeta({ middleware: 'auth' })

interface RiderProfileRow {
  first_name: string
  last_name: string
  phone: string | null
  primary_discipline: string | null
  level: string | null
  notes: string | null
}

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const placing = ref(false)
const placeError = ref<string | null>(null)
const profileError = ref<string | null>(null)

const { data: centreRes, error: centreErr } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${slug.value}`,
  { key: () => `confirm-centre-${slug.value}` },
)
if (centreErr.value || !centreRes.value) {
  throw createError({ statusCode: 404, statusMessage: 'Destination not found', fatal: true })
}
const centre = computed(() => centreRes.value!.data)

const { data: productsRes } = await useFetch<{ data: Product[] }>(
  () => `/api/centres/${slug.value}/products`,
  { key: () => `confirm-products-${slug.value}`, default: () => ({ data: [] }) },
)
const products = computed(() => productsRes.value?.data ?? [])

const { data: hotelsRes } = await useFetch<{ data: Hotel[] }>(
  () => `/api/centres/${slug.value}/hotels`,
  { key: () => `confirm-hotels-${slug.value}`, default: () => ({ data: [] }) },
)
const hotels = computed(() => hotelsRes.value?.data ?? [])

const { data: profileRes } = await useFetch<{ profile: RiderProfileRow | null }>(
  '/api/profile',
  { key: 'confirm-profile', default: () => ({ profile: null }) },
)

const profileForm = reactive({
  firstName: profileRes.value?.profile?.first_name ?? '',
  lastName: profileRes.value?.profile?.last_name ?? '',
  phone: profileRes.value?.profile?.phone ?? '',
  primaryDiscipline: profileRes.value?.profile?.primary_discipline ?? '',
  level: profileRes.value?.profile?.level ?? '',
  notes: profileRes.value?.profile?.notes ?? '',
})

const productId = computed(() => {
  const raw = route.query.products
  if (typeof raw !== 'string') return null
  return raw.split(',')[0] || null
})
const product = computed(() =>
  productId.value ? products.value.find((p) => p.id === productId.value) ?? null : null,
)

// Pre-fill discipline + level from selected product if the profile hasn't set them yet.
watch(
  product,
  (p) => {
    if (!p) return
    if (!profileForm.primaryDiscipline) profileForm.primaryDiscipline = p.discipline
    if (!profileForm.level) profileForm.level = p.minLevel
  },
  { immediate: true },
)

const tz = getLocalTimeZone()

function safeDate(raw: unknown) {
  if (typeof raw !== 'string') return null
  try {
    return parseDate(raw).toDate(tz)
  } catch {
    return null
  }
}
const arrival = computed(() => safeDate(route.query.from))
const departure = computed(() => safeDate(route.query.to))
const nightCount = computed(() => {
  if (!arrival.value || !departure.value) return 0
  return Math.max(
    0,
    Math.round((departure.value.getTime() - arrival.value.getTime()) / (1000 * 60 * 60 * 24)),
  )
})

// Hotel selection — URL-synced via ?hotel=<id> so refresh preserves it.
const selectedHotelId = ref<string>(
  typeof route.query.hotel === 'string' ? route.query.hotel : '',
)
const selectedHotel = computed(() =>
  selectedHotelId.value ? hotels.value.find((h) => h.id === selectedHotelId.value) ?? null : null,
)
watch(selectedHotelId, (v) => {
  const query = { ...route.query }
  if (v) query.hotel = v
  else delete query.hotel
  router.replace({ query })
})
// Clear the selection if the URL'd hotel isn't actually at this centre
watch(hotels, (list) => {
  if (selectedHotelId.value && !list.find((h) => h.id === selectedHotelId.value)) {
    selectedHotelId.value = ''
  }
})
const hotelTotalCents = computed(() =>
  selectedHotel.value ? selectedHotel.value.nightlyFromCents * nightCount.value : 0,
)

const rentals = computed(() => products.value.filter((p) => p.kind === 'rental'))

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

// Drop any URL'd ids that don't actually exist as rentals at this centre
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

const grandTotalCents = computed(
  () => (product.value ? product.value.priceCents : 0) + hotelTotalCents.value + addOnTotalCents.value,
)

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const arrivalLabel = computed(() => (arrival.value ? dateFormatter.format(arrival.value) : null))
const departureLabel = computed(() =>
  departure.value ? dateFormatter.format(departure.value) : null,
)

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

const ready = computed(() => Boolean(product.value && arrival.value && departure.value))
const routeQuery = computed(() => route.query as Record<string, string | undefined>)

const mailSubject = computed(() => {
  if (!product.value) return 'WindTribe booking request'
  return `WindTribe booking — ${product.value.name} at ${centre.value.name}`
})
const mailBody = computed(() => {
  if (!product.value || !arrivalLabel.value || !departureLabel.value) return ''
  const lines = [
    'Hi WindTribe,',
    '',
    'I’d like to book the following:',
    '',
    `Destination: ${centre.value.name}`,
    `Programme:   ${product.value.name}`,
    `Arrival:     ${arrivalLabel.value}`,
    `Departure:   ${departureLabel.value} (${nightCount.value} night${nightCount.value === 1 ? '' : 's'})`,
    `Programme total: ${formatPrice(product.value.priceCents, product.value.currency)}`,
    '',
    'Please confirm availability and send payment details.',
    '',
    'Thanks!',
  ]
  return lines.join('\n')
})
const mailHref = computed(
  () =>
    `mailto:hello@windtribe.com?subject=${encodeURIComponent(mailSubject.value)}&body=${encodeURIComponent(mailBody.value)}`,
)

useHead(() => ({
  title: `Review booking — WindTribe`,
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
}))

const firstNameInput = useTemplateRef<HTMLInputElement>('firstNameInput')

async function placeBooking() {
  if (!product.value || !arrival.value || !departure.value) return
  placeError.value = null
  profileError.value = null

  if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
    profileError.value = 'Please enter your first and last name.'
    await nextTick(() => firstNameInput.value?.focus())
    return
  }

  placing.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        primaryDiscipline: profileForm.primaryDiscipline || null,
        level: profileForm.level || null,
        notes: profileForm.notes,
      },
    })

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
    await navigateTo(res.url, { external: true })
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    placeError.value =
      err?.data?.statusMessage || err?.message || 'Booking failed. Please try again.'
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-14">
    <nav
      aria-label="Booking"
      class="mb-8 text-xs uppercase tracking-[0.22em] text-primary-700 font-semibold"
    >
      <NuxtLink
        :to="{ path: `/book/${slug}`, query: route.query }"
        class="hover:text-accent-800"
      >
        ← Back to dates
      </NuxtLink>
    </nav>

    <template v-if="!ready">
      <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
        Missing information
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Let’s start over.
      </h1>
      <p class="mt-6 text-primary-900 leading-relaxed">
        We’re missing either the programme, the arrival, or the departure date. Head back to
        <NuxtLink :to="`/${slug}`" class="text-accent-700 hover:text-accent-800 underline underline-offset-4">
          {{ centre.name }}
        </NuxtLink>
        and pick a programme to start again.
      </p>
    </template>

    <template v-else>
      <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
        Review your booking
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Looks right?
      </h1>

      <ReviewSummary
        :centre="centre"
        :product="product!"
        :arrival-label="arrivalLabel!"
        :departure-label="departureLabel!"
        :night-count="nightCount"
        :selected-hotel="selectedHotel"
        :hotel-total-cents="hotelTotalCents"
        :add-ons="addOnsForSummary"
        :add-on-total-cents="addOnTotalCents"
        :grand-total-cents="grandTotalCents"
        :slug="slug"
        :route-query="routeQuery"
        :format-price="formatPrice"
      />

      <!-- Gear and rentals -->
      <AddOnsSection
        v-if="rentals.length"
        v-model="selectedAddOnIds"
        :products="rentals"
        :night-count="nightCount"
        :format-price="formatPrice"
      />

      <!-- Accommodation bundling -->
      <HotelPicker
        v-if="hotels.length"
        v-model="selectedHotelId"
        :hotels="hotels"
        :night-count="nightCount"
        :format-price="formatPrice"
      />

      <!-- Rider profile — collected AFTER product selection per the MVP plan (reverses the ION anti-pattern). -->
      <form
        class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
        aria-labelledby="rider-profile-heading"
        novalidate
        @submit.prevent="placeBooking"
      >
        <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
          Rider profile
        </p>
        <h2
          id="rider-profile-heading"
          class="font-display text-2xl sm:text-3xl text-primary-900 leading-tight text-pretty"
        >
          Who is riding?
        </h2>
        <p class="mt-3 text-sm text-primary-700 max-w-xl">
          Saved to your account — next booking won’t ask again. Edit anytime from
          <NuxtLink
            to="/account"
            class="text-accent-700 hover:text-accent-800 underline underline-offset-4"
            >your account</NuxtLink
          >.
        </p>

        <div class="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              for="profile-first-name"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              First name <span aria-hidden="true" class="text-accent-700">*</span>
            </label>
            <input
              id="profile-first-name"
              ref="firstNameInput"
              v-model="profileForm.firstName"
              type="text"
              name="given-name"
              autocomplete="given-name"
              required
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
          <div>
            <label
              for="profile-last-name"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Last name <span aria-hidden="true" class="text-accent-700">*</span>
            </label>
            <input
              id="profile-last-name"
              v-model="profileForm.lastName"
              type="text"
              name="family-name"
              autocomplete="family-name"
              required
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
          <div>
            <label
              for="profile-phone"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Phone
            </label>
            <input
              id="profile-phone"
              v-model="profileForm.phone"
              type="tel"
              name="tel"
              autocomplete="tel"
              inputmode="tel"
              spellcheck="false"
              placeholder="For urgent changes only"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
          <div>
            <label
              for="profile-discipline"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Main discipline
            </label>
            <select
              id="profile-discipline"
              v-model="profileForm.primaryDiscipline"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            >
              <option value="">—</option>
              <option value="wingfoil">Wingfoil</option>
              <option value="windsurf">Windsurf</option>
              <option value="kitesurf">Kitesurf</option>
            </select>
          </div>
          <div>
            <label
              for="profile-level"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Level
            </label>
            <select
              id="profile-level"
              v-model="profileForm.level"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            >
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label
              for="profile-notes"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Anything we should know?
            </label>
            <textarea
              id="profile-notes"
              v-model="profileForm.notes"
              name="notes"
              rows="3"
              placeholder="Injuries, dietary needs, anything else."
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
        </div>

        <p
          v-if="profileError"
          aria-live="polite"
          class="mt-5 inline-block text-sm bg-red-50 text-red-900 border border-red-200 rounded-lg px-3 py-2"
        >
          {{ profileError }}
        </p>

        <!-- Hidden submit anchor so Enter inside any input fires placeBooking;
             visible Place-booking UButton lives in the section below and still
             calls placeBooking via its @click. -->
        <button type="submit" class="sr-only" aria-hidden="true" tabindex="-1">
          Place booking
        </button>
      </form>

      <section class="mt-10 bg-primary-900 text-[color:var(--color-bg)] rounded-2xl p-6 sm:p-8">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-300 mb-3 font-semibold">
          Place booking
        </p>
        <h2 class="font-display text-2xl sm:text-3xl leading-tight text-pretty">
          Hold these dates.
        </h2>
        <p class="mt-4 text-[color:var(--color-bg)]/90 leading-relaxed max-w-xl">
          Placing the booking saves it to your account. Online payment opens in a future release —
          for now we’ll email within the day to confirm availability and take payment.
        </p>

        <p
          v-if="placeError"
          aria-live="polite"
          class="mt-5 inline-block text-sm bg-red-100 text-red-900 border border-red-300 rounded-lg px-3 py-2"
        >
          {{ placeError }}
        </p>

        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          <UButton
            size="lg"
            :loading="placing"
            :disabled="placing"
            class="rounded-full bg-accent-700 hover:bg-accent-800 text-white border-0 px-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
            @click="placeBooking"
          >
            {{ placing ? 'Placing…' : 'Place booking →' }}
          </UButton>
          <NuxtLink
            :to="{ path: `/book/${slug}`, query: route.query }"
            class="inline-flex items-center justify-center rounded-full border border-[color:var(--color-bg)]/40 hover:bg-[color:var(--color-bg)]/10 text-[color:var(--color-bg)] px-7 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
          >
            Change dates
          </NuxtLink>
        </div>

        <p class="mt-6 text-sm text-[color:var(--color-bg)]/80">
          Prefer email?
          <a
            :href="mailHref"
            class="underline underline-offset-4 hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900 rounded-sm"
          >
            Send the same details as a pre-filled message
          </a>
          and we’ll take it from there.
        </p>
      </section>
    </template>
  </div>
</template>
