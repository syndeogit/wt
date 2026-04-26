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
          >
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
                  data-testid="badge-level-match"
                  class="text-[10px] uppercase tracking-[0.18em] bg-primary-900 text-white px-1.5 py-0.5 rounded"
                >For your level</span>
                <span
                  v-if="isDisciplineMatch(p)"
                  data-testid="badge-discipline-match"
                  class="text-[10px] uppercase tracking-[0.18em] bg-accent-700 text-white px-1.5 py-0.5 rounded"
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
