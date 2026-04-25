<script setup lang="ts">
import type { Centre, Hotel, Product } from '~/fixtures/types'

definePageMeta({ middleware: 'admin-centre' })

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
  stripeSessionId: string | null
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
const centreQuery = computed(() =>
  typeof route.query.centre === 'string' ? route.query.centre : null,
)

const { data, error } = await useFetch<{
  booking: AdminBookingDetail
  profile: AdminProfile | null
}>(() => `/api/admin/centre/bookings/${bookingRef.value}`, {
  key: () => `admin-booking-${bookingRef.value}`,
})
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Booking not found', fatal: true })
}
const booking = computed(() => data.value!.booking)
const profile = computed(() => data.value!.profile)

const { data: centreRes } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${booking.value.centreSlug}`,
  { key: () => `admin-booking-centre-${booking.value.centreSlug}` },
)
const centre = computed(() => centreRes.value?.data ?? null)

const { data: productsRes } = await useFetch<{ data: Product[] }>(
  () => `/api/centres/${booking.value.centreSlug}/products`,
  {
    key: () => `admin-booking-products-${booking.value.centreSlug}`,
    default: () => ({ data: [] }),
  },
)
const product = computed(
  () => productsRes.value?.data.find((p) => p.id === booking.value.productId) ?? null,
)

const { data: hotelsRes } = await useFetch<{ data: Hotel[] }>(
  () => `/api/centres/${booking.value.centreSlug}/hotels`,
  {
    key: () => `admin-booking-hotels-${booking.value.centreSlug}`,
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
const grandTotalCents = computed(
  () => booking.value.amountCents + (booking.value.hotelTotalCents ?? 0),
)
const disciplineLabels: Record<string, string> = {
  wingfoil: 'Wingfoil',
  windsurf: 'Windsurf',
  kitesurf: 'Kitesurf',
}
const levelLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

useHead(() => ({
  title: `${booking.value.bookingRef} — admin — WindTribe`,
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
        :to="`/admin/centre/bookings${centreQuery ? '?centre=' + centreQuery : ''}`"
        class="hover:text-accent-600"
      >
        ← Back to bookings
      </NuxtLink>
    </nav>

    <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
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

    <!-- Guest -->
    <section
      class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <h2 class="font-display text-2xl text-primary-900 mb-6 leading-tight text-pretty">
        Guest
      </h2>
      <dl class="grid gap-5 sm:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Name</dt>
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
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Email</dt>
          <dd class="mt-1 text-primary-900 break-all" translate="no">{{ booking.guestEmail }}</dd>
        </div>
        <div v-if="profile?.phone">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Phone</dt>
          <dd class="mt-1 text-primary-900 tabular-nums" translate="no">{{ profile.phone }}</dd>
        </div>
        <div v-if="profile?.primaryDiscipline">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Main discipline
          </dt>
          <dd class="mt-1 text-primary-900">
            {{ disciplineLabels[profile.primaryDiscipline] ?? profile.primaryDiscipline }}
          </dd>
        </div>
        <div v-if="profile?.level">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Level</dt>
          <dd class="mt-1 text-primary-900">
            {{ levelLabels[profile.level] ?? profile.level }}
          </dd>
        </div>
        <div v-if="profile?.notes" class="sm:col-span-2">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Notes</dt>
          <dd class="mt-1 text-primary-900 whitespace-pre-line">{{ profile.notes }}</dd>
        </div>
      </dl>
    </section>

    <!-- Programme + dates + hotel -->
    <section
      class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <h2 class="font-display text-2xl text-primary-900 mb-6 leading-tight text-pretty">
        Booking
      </h2>
      <dl class="grid gap-5 sm:grid-cols-2">
        <div v-if="centre">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Destination
          </dt>
          <dd class="mt-1 text-primary-900" translate="no">{{ centre.name }}</dd>
        </div>
        <div v-if="product">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Programme
          </dt>
          <dd class="mt-1 text-primary-900">{{ product.name }}</dd>
          <dd v-if="product.durationLabel" class="text-sm text-primary-700">
            {{ product.durationLabel }}
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Arrival
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">{{ fmtDate(booking.arrival) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Departure
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">
            {{ fmtDate(booking.departure) }}
            <span class="text-primary-700"
              >· {{ nightCount }} night{{ nightCount === 1 ? '' : 's' }}</span
            >
          </dd>
        </div>
        <div v-if="hotel" class="sm:col-span-2">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Hotel</dt>
          <dd class="mt-1 text-primary-900" translate="no">{{ hotel.name }}</dd>
          <dd
            v-if="booking.hotelNightlyCents !== null && booking.hotelTotalCents !== null"
            class="text-sm text-primary-700 tabular-nums"
          >
            {{ formatPrice(booking.hotelNightlyCents, booking.currency) }}/night × {{ nightCount }}
            = {{ formatPrice(booking.hotelTotalCents, booking.currency) }}
          </dd>
        </div>
      </dl>

      <div class="mt-8 pt-6 border-t border-primary-200/60">
        <dl class="space-y-2 text-sm tabular-nums">
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-primary-700">Programme</dt>
            <dd class="text-primary-900 font-medium">
              {{ formatPrice(booking.amountCents, booking.currency) }}
            </dd>
          </div>
          <div
            v-if="hotel && booking.hotelTotalCents !== null"
            class="flex items-baseline justify-between gap-4"
          >
            <dt class="text-primary-700" translate="no">{{ hotel.name }}</dt>
            <dd class="text-primary-900 font-medium">
              {{ formatPrice(booking.hotelTotalCents, booking.currency) }}
            </dd>
          </div>
        </dl>
        <div class="mt-4 pt-4 border-t border-primary-200/60 flex items-end justify-between gap-4">
          <p class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Total</p>
          <p class="font-display text-3xl text-primary-900 tabular-nums">
            {{ formatPrice(grandTotalCents, booking.currency) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Operational metadata -->
    <section
      class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <h2 class="font-display text-2xl text-primary-900 mb-6 leading-tight text-pretty">
        System
      </h2>
      <dl class="grid gap-5 sm:grid-cols-2 text-sm">
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Created
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">{{ fmtDateTime(booking.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Updated
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">{{ fmtDateTime(booking.updatedAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Confirmation email
          </dt>
          <dd class="mt-1 text-primary-900 tabular-nums">
            {{ booking.confirmationEmailSentAt ? fmtDateTime(booking.confirmationEmailSentAt) : 'Not sent' }}
          </dd>
        </div>
        <div v-if="booking.stripeSessionId">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Stripe session
          </dt>
          <dd class="mt-1 text-primary-900 font-mono text-xs break-all" translate="no">
            {{ booking.stripeSessionId }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
