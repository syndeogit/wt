<script setup lang="ts">
definePageMeta({ middleware: 'admin-centre' })

interface AdminBooking {
  bookingRef: string
  centreSlug: string
  productId: string
  guestEmail: string | null
  guestFirstName: string | null
  guestLastName: string | null
  arrival: string
  departure: string
  amountCents: number
  currency: string
  hotelId: string | null
  hotelTotalCents: number | null
  status: string
  confirmationEmailSentAt: string | null
  createdAt: string
}

const route = useRoute()
const { user } = useCurrentUser()

const centre = computed(() =>
  typeof route.query.centre === 'string'
    ? route.query.centre
    : user.value?.adminCentres?.[0] ?? null,
)

const { data, error, refresh, pending } = await useFetch<{ bookings: AdminBooking[] }>(
  () => `/api/admin/centre/bookings?centre=${encodeURIComponent(centre.value ?? '')}`,
  {
    key: () => `admin-centre-bookings-${centre.value}`,
    default: () => ({ bookings: [] }),
    watch: [centre],
  },
)
const bookings = computed(() => data.value?.bookings ?? [])

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
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
function totalCents(b: AdminBooking): number {
  return b.amountCents + (b.hotelTotalCents ?? 0)
}
function guestName(b: AdminBooking): string {
  const n = [b.guestFirstName, b.guestLastName].filter(Boolean).join(' ').trim()
  return n || b.guestEmail || 'Unknown'
}
const statusTone: Record<string, string> = {
  pending_payment: 'bg-accent-50 text-accent-800 border-accent-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-primary-100 text-primary-700 border-primary-200',
  refunded: 'bg-primary-100 text-primary-700 border-primary-200',
}

useHead(() => ({
  title: `Bookings — ${centre.value ?? 'admin'} — WindTribe`,
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
}))
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-14">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
          Centre admin · <span translate="no">{{ centre }}</span>
        </p>
        <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
          Bookings.
        </h1>
      </div>
      <UButton
        size="sm"
        variant="outline"
        color="primary"
        :loading="pending"
        class="rounded-full border-primary-900 text-primary-900 hover:bg-primary-100"
        @click="() => refresh()"
      >
        Refresh
      </UButton>
    </div>

    <p
      v-if="error"
      aria-live="polite"
      class="text-sm bg-red-50 text-red-900 border border-red-200 rounded-lg px-3 py-2"
    >
      {{ error.message }}
    </p>

    <p v-else-if="!bookings.length" class="text-primary-700">
      No bookings yet for this centre.
    </p>

    <div
      v-else
      class="overflow-x-auto bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60"
    >
      <table class="min-w-full text-sm">
        <caption class="sr-only">
          Bookings for {{ centre }}, newest first.
        </caption>
        <thead>
          <tr class="text-left">
            <th
              scope="col"
              class="px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
            >
              Ref
            </th>
            <th
              scope="col"
              class="px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
            >
              Guest
            </th>
            <th
              scope="col"
              class="px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
            >
              Dates
            </th>
            <th
              scope="col"
              class="px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
            >
              Total
            </th>
            <th
              scope="col"
              class="px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
            >
              Status
            </th>
            <th
              scope="col"
              class="px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
            >
              Placed
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-primary-200/60">
          <tr v-for="b in bookings" :key="b.bookingRef" class="hover:bg-primary-50/50">
            <td class="px-4 sm:px-6 py-4 align-top">
              <NuxtLink
                :to="`/admin/centre/bookings/${b.bookingRef}?centre=${centre}`"
                class="font-mono text-primary-900 hover:text-accent-600 underline underline-offset-4 tabular-nums"
                translate="no"
              >
                {{ b.bookingRef }}
              </NuxtLink>
            </td>
            <td class="px-4 sm:px-6 py-4 align-top">
              <div class="text-primary-900" translate="no">{{ guestName(b) }}</div>
              <div v-if="b.guestEmail" class="text-xs text-primary-700" translate="no">
                {{ b.guestEmail }}
              </div>
            </td>
            <td class="px-4 sm:px-6 py-4 align-top tabular-nums whitespace-nowrap text-primary-900">
              {{ fmtDate(b.arrival) }} → {{ fmtDate(b.departure) }}
            </td>
            <td class="px-4 sm:px-6 py-4 align-top tabular-nums whitespace-nowrap text-primary-900">
              {{ formatPrice(totalCents(b), b.currency) }}
            </td>
            <td class="px-4 sm:px-6 py-4 align-top">
              <span
                class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                :class="statusTone[b.status] || statusTone.cancelled"
              >
                {{ b.status.replace(/_/g, ' ') }}
              </span>
            </td>
            <td
              class="px-4 sm:px-6 py-4 align-top tabular-nums whitespace-nowrap text-primary-700"
            >
              {{ fmtDate(b.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
