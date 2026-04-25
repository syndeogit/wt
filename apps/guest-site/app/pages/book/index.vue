<script setup lang="ts">
import type { Centre } from '~/fixtures/types'

const { data: res } = await useFetch<{ data: Centre[] }>('/api/centres', {
  key: 'book-centres',
  default: () => ({ data: [] }),
})
const centres = computed(() => res.value?.data ?? [])

useHead({
  title: 'Book your week — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Book a week
    </p>
    <h1 class="font-display text-4xl sm:text-6xl text-primary-900 leading-[1.05] text-pretty">
      Where shall we send you?
    </h1>
    <p class="mt-6 text-lg text-primary-900 max-w-2xl leading-relaxed">
      Pick a destination to see the programmes, dates, and prices. The full online checkout —
      availability, accommodation, payment — is coming with the next slice; for now we confirm every
      booking by hand so nothing slips.
    </p>

    <p v-if="!centres.length" class="mt-16 text-primary-700">
      No destinations published yet. Check back soon.
    </p>

    <ul v-else class="mt-14 grid gap-5 sm:grid-cols-2">
      <li
        v-for="(c, i) in centres"
        :key="c.id"
        class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 overflow-hidden"
      >
        <NuxtLink
          :to="`/${c.slug}`"
          class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
        >
          <div class="relative aspect-[16/9] overflow-hidden bg-primary-100">
            <NuxtImg
              v-if="c.heroImage"
              :src="c.heroImage"
              :alt="`${c.name} — photography`"
              class="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
              width="1200"
              height="675"
              sizes="(min-width: 640px) 50vw, 100vw"
              :loading="i === 0 ? 'eager' : 'lazy'"
              :fetchpriority="i === 0 ? 'high' : undefined"
            />
          </div>
          <div class="p-6">
            <p class="text-xs uppercase tracking-[0.2em] text-primary-700 font-semibold mb-2">
              <span v-if="c.region">{{ c.region }} · </span>{{ c.country }}
            </p>
            <p
              class="font-display text-2xl text-primary-900 leading-tight text-pretty"
              translate="no"
            >
              {{ c.name }}
            </p>
            <p class="mt-5 text-xs uppercase tracking-[0.18em] text-accent-700 font-semibold">
              See the week →
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <p class="mt-14 text-sm text-primary-700">
      Prefer to chat first?
      <a
        href="mailto:hello@windtribe.com"
        class="text-accent-700 hover:text-accent-800 underline underline-offset-4"
      >
        Email us
      </a>
      and we’ll walk you through it.
    </p>
  </div>
</template>
