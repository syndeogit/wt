<script setup lang="ts">
import type { Hotel } from '~/fixtures/types'

defineProps<{
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
  <section
    class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    aria-labelledby="hotel-picker-heading"
  >
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Where to stay
    </p>
    <h2
      id="hotel-picker-heading"
      class="font-display text-2xl sm:text-3xl text-primary-900 leading-tight text-pretty"
    >
      Pick your bed.
    </h2>
    <p class="mt-3 text-sm text-primary-700 max-w-xl">
      Optional. We'll confirm availability and add the nights to your booking — or sort your
      own and we'll leave it alone.
    </p>

    <ul role="radiogroup" aria-labelledby="hotel-picker-heading" class="mt-6 grid gap-3">
      <li>
        <label
          class="flex items-start gap-4 rounded-2xl border border-primary-200 bg-white p-4 cursor-pointer transition-colors has-[:checked]:border-primary-900 has-[:checked]:bg-primary-50"
        >
          <input
            type="radio"
            name="hotel"
            value=""
            :checked="modelValue === ''"
            class="mt-1 h-4 w-4 accent-primary-900 border-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500"
            @change="onChange('')"
          />
          <span class="flex-1">
            <span class="block font-display text-base text-primary-900">
              I'll sort my own
            </span>
            <span class="block mt-1 text-sm text-primary-700">
              No hotel added to this booking.
            </span>
          </span>
        </label>
      </li>
      <li v-for="h in hotels" :key="h.id">
        <label
          class="flex items-start gap-4 rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 cursor-pointer transition-colors has-[:checked]:border-primary-900 has-[:checked]:bg-primary-50"
        >
          <input
            type="radio"
            name="hotel"
            :value="h.id"
            :checked="modelValue === h.id"
            class="mt-1 h-4 w-4 accent-primary-900 border-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500"
            @change="onChange(h.id)"
          />
          <span class="flex-1 flex flex-col sm:flex-row gap-4">
            <span
              v-if="h.image"
              class="relative w-full sm:w-40 aspect-[4/3] sm:aspect-auto sm:flex-shrink-0 rounded-lg overflow-hidden bg-primary-100"
            >
              <NuxtImg
                :src="h.image"
                :alt="`${h.name} — photo`"
                class="absolute inset-0 w-full h-full object-cover"
                width="800"
                height="600"
                sizes="(min-width: 640px) 160px, 100vw"
                loading="lazy"
              />
            </span>
            <span class="flex-1">
              <span class="block font-display text-lg text-primary-900" translate="no">
                {{ h.name }}
              </span>
              <span v-if="h.summary" class="block mt-1 text-sm text-primary-700 leading-relaxed">
                {{ h.summary }}
              </span>
              <span class="block mt-3 text-sm text-primary-900 tabular-nums">
                {{ formatPrice(h.nightlyFromCents, h.currency) }}<span class="text-primary-700">&nbsp;/ night</span>
                <span class="text-primary-700">
                  · {{ nightCount }} night{{ nightCount === 1 ? '' : 's' }} =
                </span>
                <span class="font-semibold">{{
                  formatPrice(h.nightlyFromCents * nightCount, h.currency)
                }}</span>
              </span>
            </span>
          </span>
        </label>
      </li>
    </ul>
  </section>
</template>
