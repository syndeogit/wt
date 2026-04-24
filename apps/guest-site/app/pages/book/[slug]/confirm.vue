<script setup lang="ts">
import { getLocalTimeZone, parseDate } from '@internationalized/date'
import type { Centre, Product } from '~/fixtures/types'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { user } = useCurrentUser()

const placing = ref(false)
const placeError = ref<string | null>(null)

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

const productId = computed(() => {
  const raw = route.query.products
  if (typeof raw !== 'string') return null
  return raw.split(',')[0] || null
})
const product = computed(() =>
  productId.value ? products.value.find((p) => p.id === productId.value) ?? null : null,
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

async function placeBooking() {
  if (!product.value || !arrival.value || !departure.value) return
  if (!user.value) {
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  placeError.value = null
  placing.value = true
  try {
    const res = await $fetch<{ url: string; bookingRef: string }>('/api/bookings/create', {
      method: 'POST',
      body: {
        centreSlug: slug.value,
        productId: productId.value,
        arrival: route.query.from,
        departure: route.query.to,
      },
    })
    await navigateTo(res.url, { external: true })
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    placeError.value = err?.data?.statusMessage || err?.message || 'Booking failed. Please try again.'
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
        class="hover:text-accent-600"
      >
        ← Back to dates
      </NuxtLink>
    </nav>

    <template v-if="!ready">
      <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
        Missing information
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Let’s start over.
      </h1>
      <p class="mt-6 text-primary-900 leading-relaxed">
        We’re missing either the programme, the arrival, or the departure date. Head back to
        <NuxtLink :to="`/${slug}`" class="text-accent-600 hover:text-accent-700 underline underline-offset-4">
          {{ centre.name }}
        </NuxtLink>
        and pick a programme to start again.
      </p>
    </template>

    <template v-else>
      <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
        Review your booking
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Looks right?
      </h1>

      <section
        class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
      >
        <dl class="grid gap-6 sm:grid-cols-2">
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
              Destination
            </dt>
            <dd class="mt-1 text-primary-900" translate="no">{{ centre.name }}</dd>
            <dd v-if="centre.region" class="text-sm text-primary-700">
              {{ centre.region }}<span v-if="centre.country">, {{ centre.country }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
              Programme
            </dt>
            <dd class="mt-1 text-primary-900">{{ product!.name }}</dd>
            <dd v-if="product!.durationLabel" class="text-sm text-primary-700">
              {{ product!.durationLabel }}
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
              Arrival
            </dt>
            <dd class="mt-1 text-primary-900 tabular-nums">{{ arrivalLabel }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
              Departure
            </dt>
            <dd class="mt-1 text-primary-900 tabular-nums">
              {{ departureLabel }}
              <span class="text-primary-700">· {{ nightCount }} night{{ nightCount === 1 ? '' : 's' }}</span>
            </dd>
          </div>
        </dl>

        <div class="mt-8 pt-6 border-t border-primary-200/60 flex items-end justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
              Programme total
            </p>
            <p class="mt-1 font-display text-3xl text-primary-900 tabular-nums">
              {{ formatPrice(product!.priceCents, product!.currency) }}
            </p>
          </div>
        </div>
      </section>

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
            class="rounded-full bg-accent-500 hover:bg-accent-600 text-white border-0 px-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
            @click="placeBooking"
          >
            {{ placing ? 'Placing…' : user ? 'Place booking →' : 'Sign in to place booking →' }}
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
