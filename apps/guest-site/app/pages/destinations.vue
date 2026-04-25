<script setup lang="ts">
import type { Centre } from '~/fixtures/types'

const { data: res } = await useFetch<{ data: Centre[] }>('/api/centres', {
  key: 'destinations-list',
  default: () => ({ data: [] }),
})
const centres = computed(() => res.value?.data ?? [])

useHead({
  title: 'Destinations — WindTribe',
  meta: [
    {
      name: 'description',
      content:
        'Curated wind-sport destinations. One week, one centre, everything handled — from the water to the bed.',
    },
  ],
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Chosen, not listed
    </p>
    <h1 class="font-display text-4xl sm:text-6xl text-primary-900 leading-[1.05] text-pretty">
      Destinations.
    </h1>
    <p class="mt-6 text-lg text-primary-900 max-w-2xl leading-relaxed">
      Each centre is somewhere we’d go back to. One week at one place, not a directory of a hundred
      you’ve never heard of. More land as we find them.
    </p>

    <p v-if="!centres.length" class="mt-16 text-primary-700">
      No destinations published yet. Check back soon.
    </p>

    <ul v-else class="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="c in centres"
        :key="c.id"
        class="group bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 overflow-hidden flex flex-col"
      >
        <NuxtLink
          :to="`/${c.slug}`"
          class="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
        >
          <div class="relative aspect-[4/3] overflow-hidden bg-primary-100">
            <NuxtImg
              v-if="c.heroImage"
              :src="c.heroImage"
              :alt="`${c.name} — photography`"
              class="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
              width="1200"
              height="900"
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              loading="lazy"
            />
          </div>
          <div class="p-6">
            <p class="text-xs uppercase tracking-[0.2em] text-primary-700 font-semibold mb-2">
              <span v-if="c.region">{{ c.region }} · </span>{{ c.country }}
            </p>
            <h2
              class="font-display text-2xl text-primary-900 leading-tight text-pretty"
              translate="no"
            >
              {{ c.name }}
            </h2>
            <p v-if="c.tagline" class="mt-3 text-primary-900 leading-relaxed text-sm">
              {{ c.tagline }}
            </p>
            <p class="mt-5 text-xs uppercase tracking-[0.18em] text-accent-700 font-semibold">
              Plan a week →
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
