<script setup lang="ts">
import type { Centre, Hotel, Product } from '~/fixtures/types'

definePageMeta({ middleware: 'admin-hotel' })

interface AdminBookingDetail {
  bookingRef: string
  centreSlug: string
  productId: string
  guestEmail: string | null
  arrival: string
  departure: string
  amountCents: number
  currency: string
  hotelId: string | null
  hotelNightlyCents: number | null
  hotelTotalCents: number | null
  status: string
  confirmationEmailSentAt: string | null
  createdAt: string
  updatedAt: string
}
interface AdminProfile {
  firstName: string
  lastName: string
  phone: string | null
  primaryDiscipline: string | null
  level: string | null
  notes: string | null
}

const route = useRoute()
const bookingRef = computed(() => route.params.ref as string)
const hotelQuery = computed(() =>
  typeof route.query.hotel === 'string' ? route.query.hotel : null,
)

const { data, error } = await useFetch<{
  booking: AdminBookingDetail
  profile: AdminProfile | null
}>(() => `/api/admin/hotel/bookings/${bookingRef.value}`, {
  key: () => `admin-hotel-booking-${bookingRef.value}`,
})
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Booking not found', fatal: true })
}
const booking = computed(() => data.value!.booking)
const profile = computed(() => data.value!.profile)

const { data: centreRes } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${booking.value.centreSlug}`,
  { key: () => `admin-hotel-booking-centre-${booking.value.centreSlug}` },
)
const centre = computed(() => centreRes.value?.data ?? null)

const { data: productsRes } = await useFetch<{ data: Product[] }>(
  () => `/api/centres/${booking.value.centreSlug}/products`,
  {
    key: () => `admin-hotel-booking-products-${booking.value.centreSlug}`,
    default: () => ({ data: [] }),
  },
)
const product = computed(
  () => productsRes.value?.data.find((p) => p.id === booking.value.productId) ?? null,
)

const { data: hotelsRes } = await useFetch<{ data: Hotel[] }>(
  () => `/api/centres/${booking.value.centreSlug}/hotels`,
  {
    key: () => `admin-hotel-booking-hotels-${booking.value.centreSlug}`,
    default: () => ({ data: [] }),
  },
)
const hotel = computed(() => {
  const id = booking.value.hotelId
  return id ? hotelsRes.value?.data.find((h) => h.id === id) ?? null : null
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
function fmtDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}
function fmtDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}
function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
const nightCount = computed(() => {
  const a = new Date(booking.value.arrival).getTime()
  const d = new Date(booking.value.departure).getTime()
  return Math.max(0, Math.round((d - a) / (1000 * 60 * 60 * 24)))
})

useHead(() => ({
  title: `${booking.value.bookingRef} — hotel admin — WindTribe`,
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
}))
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-14">
    <nav
      aria-label="Booking"
      class="mb-8 text-xs uppercase tracking-[0.22em] text-primary-700 font-semibold"
    >
      <NuxtLink
        :to="`/admin/hotel/bookings${hotelQuery ? '?hotel=' + hotelQuery : ''}`"
        class="rounded hover:text-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        ← Back to bookings
      </NuxtLink>
    </nav>

    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Booking
    </p>
    <h1
      class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty tabular-nums"
      translate="no"
    >
      {{ booking.bookingRef }}
    </h1>
    <p class="mt-2 text-sm text-primary-700">
      Placed {{ fmtDateTime(booking.createdAt) }}
      · Status
      <span class="font-semibold text-primary-900">{{ booking.status.replace(/_/g, ' ') }}</span>
    </p>

    <!-- Stay details (hotel-admin perspective) -->
    <section
      class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <h2 class="font-display text-2xl text-primary-900 mb-6 leading-tight text-pretty">
        Stay
      </h2>
      <dl class="grid gap-5 sm:grid-cols-2">
        <div v-if="hotel">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Hotel</dt>
          <dd class="mt-1 text-primary-900" translate="no">{{ hotel.name }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
            Check-in
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">{{ fmtDate(booking.arrival) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
            Check-out
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">
            {{ fmtDate(booking.departure) }}
            <span class="text-primary-700 whitespace-nowrap"
              >·&nbsp;{{ nightCount }} night{{ nightCount === 1 ? '' : 's' }}</span
            >
          </dd>
        </div>
        <div
          v-if="booking.hotelNightlyCents !== null && booking.hotelTotalCents !== null"
          class="sm:col-span-2"
        >
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
            Hotel total
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">
            <span class="whitespace-nowrap"
              >{{ formatPrice(booking.hotelNightlyCents, booking.currency) }}/night</span
            >
            <span class="whitespace-nowrap">×&nbsp;{{ nightCount }}</span>
            <span class="whitespace-nowrap"
              >=&nbsp;{{ formatPrice(booking.hotelTotalCents, booking.currency) }}</span
            >
          </dd>
        </div>
      </dl>
    </section>

    <!-- Guest -->
    <section
      class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <h2 class="font-display text-2xl text-primary-900 mb-6 leading-tight text-pretty">
        Guest
      </h2>
      <dl class="grid gap-5 sm:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Name</dt>
          <dd class="mt-1 text-primary-900" translate="no">
            <template v-if="profile">
              {{ profile.firstName }} {{ profile.lastName }}
            </template>
            <template v-else>
              <span class="text-primary-700">No profile saved.</span>
            </template>
          </dd>
        </div>
        <div v-if="booking.guestEmail">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Email</dt>
          <dd class="mt-1 text-primary-900 break-all" translate="no">{{ booking.guestEmail }}</dd>
        </div>
        <div v-if="profile?.phone">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Phone</dt>
          <dd class="mt-1 text-primary-900 tabular-nums" translate="no">{{ profile.phone }}</dd>
        </div>
        <div v-if="profile?.notes" class="sm:col-span-2">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Notes</dt>
          <dd class="mt-1 text-primary-900 whitespace-pre-line">{{ profile.notes }}</dd>
        </div>
      </dl>
    </section>

    <!-- Programme (informational, hotel admin doesn't manage this) -->
    <section
      v-if="centre || product"
      class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <h2 class="font-display text-2xl text-primary-900 mb-6 leading-tight text-pretty">
        Programme
      </h2>
      <dl class="grid gap-5 sm:grid-cols-2">
        <div v-if="centre">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
            Destination
          </dt>
          <dd class="mt-1 text-primary-900" translate="no">{{ centre.name }}</dd>
        </div>
        <div v-if="product">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
            Programme
          </dt>
          <dd class="mt-1 text-primary-900">{{ product.name }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
