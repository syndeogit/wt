<script setup lang="ts">
import type { Centre, Product } from '~/fixtures/types'

definePageMeta({ middleware: 'auth' })

interface BookingRow {
  id: string
  booking_ref: string
  centre_slug: string
  product_id: string
  arrival: string
  departure: string
  amount_cents: number
  currency: string
  status: string
  created_at: string
}

const route = useRoute()
const bookingRef = computed(() =>
  typeof route.query.ref === 'string' ? route.query.ref : null,
)

if (!bookingRef.value) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Missing booking reference',
    fatal: true,
  })
}

const { data, error } = await useFetch<{ booking: BookingRow }>(
  () => `/api/bookings/${bookingRef.value}`,
  { key: () => `booking-${bookingRef.value}` },
)
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Booking not found', fatal: true })
}
const booking = computed(() => data.value!.booking)

const { data: centreRes } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${booking.value.centre_slug}`,
  { key: () => `success-centre-${booking.value.centre_slug}` },
)
const centre = computed(() => centreRes.value?.data ?? null)

const { data: productsRes } = await useFetch<{ data: Product[] }>(
  () => `/api/centres/${booking.value.centre_slug}/products`,
  {
    key: () => `success-products-${booking.value.centre_slug}`,
    default: () => ({ data: [] }),
  },
)
const product = computed(
  () => productsRes.value?.data.find((p) => p.id === booking.value.product_id) ?? null,
)

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function fmtDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
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

const statusLabel = computed(() => booking.value.status.replace(/_/g, ' '))

useHead({
  title: 'Booking received — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-14">
    <div role="status" aria-live="polite" class="mb-10">
      <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
        Booking request received
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        We’ve got it.
      </h1>
      <p class="mt-6 text-lg text-primary-900 leading-relaxed max-w-2xl">
        Your reference is
        <span class="font-semibold tabular-nums" translate="no">{{ booking.booking_ref }}</span
        >. We’ll email within the day to confirm availability and take payment.
      </p>
    </div>

    <section
      class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <dl class="grid gap-6 sm:grid-cols-2">
        <div v-if="centre">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Destination
          </dt>
          <dd class="mt-1 text-primary-900" translate="no">{{ centre.name }}</dd>
          <dd v-if="centre.region" class="text-sm text-primary-700">
            {{ centre.region }}<span v-if="centre.country">, {{ centre.country }}</span>
          </dd>
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
      </dl>

      <div class="mt-8 pt-6 border-t border-primary-200/60 flex items-end justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Programme total
          </p>
          <p class="mt-1 font-display text-3xl text-primary-900 tabular-nums">
            {{ formatPrice(booking.amount_cents, booking.currency) }}
          </p>
          <p class="mt-2 text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Status: <span class="text-primary-900">{{ statusLabel }}</span>
          </p>
        </div>
      </div>
    </section>

    <div class="mt-10 flex flex-wrap gap-3">
      <UButton
        to="/account"
        size="lg"
        class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
      >
        Back to account
      </UButton>
      <UButton
        :to="`/${booking.centre_slug}`"
        size="lg"
        variant="outline"
        color="primary"
        class="rounded-full border-primary-900 text-primary-900 hover:bg-primary-100"
      >
        Back to <span translate="no">{{ centre?.name ?? 'destination' }}</span>
      </UButton>
    </div>
  </div>
</template>
