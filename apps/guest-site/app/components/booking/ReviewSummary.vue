<script setup lang="ts">
import type { Centre, Hotel, Product } from '~/fixtures/types'

defineProps<{
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
  <section
    class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
  >
    <dl class="grid gap-6 sm:grid-cols-2">
      <div>
        <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
          Destination
        </dt>
        <dd class="mt-1 text-primary-900" translate="no">{{ centre.name }}</dd>
        <dd v-if="centre.region" class="text-sm text-primary-700">
          {{ centre.region }}<span v-if="centre.country">, {{ centre.country }}</span>
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
          Programme
        </dt>
        <dd class="mt-1 text-primary-900">{{ product.name }}</dd>
        <dd v-if="product.durationLabel" class="text-sm text-primary-700">
          {{ product.durationLabel }}
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
          Arrival
        </dt>
        <dd class="mt-1 text-primary-900 tabular-nums">{{ arrivalLabel }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
          Departure
        </dt>
        <dd class="mt-1 text-primary-900 tabular-nums">
          {{ departureLabel }}
          <span class="text-primary-700">· {{ nightCount }} night{{ nightCount === 1 ? '' : 's' }}</span>
        </dd>
      </div>
    </dl>

    <p class="mt-6 text-sm">
      <NuxtLink
        :to="{
          path: `/${slug}/conditions`,
          query: { from: routeQuery.from, to: routeQuery.to },
        }"
        class="text-accent-700 hover:text-accent-800 underline underline-offset-4"
      >
        See the wind for your dates →
      </NuxtLink>
    </p>

    <div class="mt-8 pt-6 border-t border-primary-200/60">
      <dl class="space-y-2 text-sm tabular-nums">
        <div class="flex items-baseline justify-between gap-4">
          <dt class="text-primary-700">Programme</dt>
          <dd class="text-primary-900 font-medium">
            {{ formatPrice(product.priceCents, product.currency) }}
          </dd>
        </div>
        <div
          v-for="a in addOns"
          :key="a.name"
          class="flex items-baseline justify-between gap-4"
        >
          <dt class="text-primary-700">
            {{ a.name }} · {{ nightCount }} day{{ nightCount === 1 ? '' : 's' }}
          </dt>
          <dd class="text-primary-900 font-medium">
            {{ formatPrice(a.totalCents, a.currency) }}
          </dd>
        </div>
        <div
          v-if="selectedHotel"
          class="flex items-baseline justify-between gap-4"
        >
          <dt class="text-primary-700">
            <span translate="no">{{ selectedHotel.name }}</span> ·
            {{ nightCount }} night{{ nightCount === 1 ? '' : 's' }}
          </dt>
          <dd class="text-primary-900 font-medium">
            {{ formatPrice(hotelTotalCents, selectedHotel.currency) }}
          </dd>
        </div>
      </dl>
      <div class="mt-4 pt-4 border-t border-primary-200/60 flex items-end justify-between gap-4">
        <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
          Total
        </p>
        <p class="font-display text-3xl text-primary-900 tabular-nums">
          {{ formatPrice(grandTotalCents, product.currency) }}
        </p>
      </div>
    </div>
  </section>
</template>
