<script setup lang="ts">
import type { Centre, Product } from '~/fixtures/types'

const { data: centresRes } = await useFetch<{ data: Centre[] }>('/api/centres', {
  key: 'wing-centres',
  default: () => ({ data: [] }),
})

const centres = computed(() => centresRes.value?.data ?? [])

// Fetch products for each centre, flatten, keep wingfoil only.
const { data: wingProducts } = await useAsyncData(
  'wing-products',
  async () => {
    const out: { product: Product; centre: Centre }[] = []
    for (const c of centres.value) {
      const res = await $fetch<{ data: Product[] }>(`/api/centres/${c.slug}/products`)
      for (const p of res.data) {
        if (p.discipline === 'wingfoil') out.push({ product: p, centre: c })
      }
    }
    return out
  },
  { default: () => [], watch: [centres] },
)

const kindLabel: Record<Product['kind'], string> = {
  package: 'Package',
  lesson: 'Lesson',
  rental: 'Rental',
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

useHead({
  title: 'Wing for beginners — WindTribe',
  meta: [
    {
      name: 'description',
      content:
        'Wingfoiling is the fastest-growing, most beginner-friendly wind sport. A week on the water, a coach beside you, first flights by Friday.',
    },
  ],
})
</script>

<template>
  <article>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="relative max-w-6xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-6 font-semibold">
          For first-timers · Karpathos, Greece
        </p>
        <h1
          class="font-display text-5xl sm:text-7xl leading-[1.02] text-primary-900 max-w-4xl text-pretty"
        >
          Wing for beginners.
        </h1>
        <p class="mt-8 text-lg sm:text-xl text-primary-900 max-w-2xl leading-relaxed">
          Wingfoiling is the fastest-growing wind sport in the world — and the most
          beginner-friendly. Soft wing, stable board, foil that lifts you clear of the chop. A week
          is long enough to go from curious to flying.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row gap-3">
          <UButton
            to="/karpathos"
            size="xl"
            class="rounded-full bg-accent-500 hover:bg-accent-600 text-white border-0 px-8"
          >
            See the week in Karpathos →
          </UButton>
        </div>
      </div>
    </section>

    <!-- Why wing -->
    <section class="border-t border-primary-200/60 bg-[color:var(--color-bg-elevated)]">
      <div class="max-w-6xl mx-auto px-6 py-20 grid gap-10 md:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3 font-semibold">
            Soft start
          </p>
          <h2 class="font-display text-2xl text-primary-900 leading-tight mb-3 text-pretty">
            The wing is inflatable.
          </h2>
          <p class="text-primary-900 leading-relaxed">
            You hold it like a kite but with a handle. Drop it in the water and nothing breaks,
            nothing drags you. The fear bar is much lower than kitesurfing.
          </p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3 font-semibold">
            Smooth water
          </p>
          <h2 class="font-display text-2xl text-primary-900 leading-tight mb-3 text-pretty">
            The foil cuts the chop.
          </h2>
          <p class="text-primary-900 leading-relaxed">
            Once you’re up, the board leaves the water and you glide. It feels silent and
            slow-motion. A week on the inside lagoon is enough to get there for most riders.
          </p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3 font-semibold">
            Coach in the water
          </p>
          <h2 class="font-display text-2xl text-primary-900 leading-tight mb-3 text-pretty">
            Not from the shore.
          </h2>
          <p class="text-primary-900 leading-relaxed">
            Groups capped at three. Your coach rides alongside you, adjusts the wing handle while
            you’re standing, catches you when you fall. Video debrief at the end of each session.
          </p>
        </div>
      </div>
    </section>

    <!-- The programme(s) -->
    <section class="max-w-6xl mx-auto px-6 py-20">
      <div class="mb-10">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
          The programme
        </p>
        <h2 class="font-display text-3xl sm:text-4xl text-primary-900 leading-tight text-pretty">
          Book the week.
        </h2>
      </div>

      <p v-if="!wingProducts.length" class="text-primary-700">
        No wing programmes published yet. Check back soon.
      </p>

      <ul v-else class="grid gap-6 md:grid-cols-2">
        <li
          v-for="{ product, centre } in wingProducts"
          :key="product.id"
          class="group bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 overflow-hidden flex flex-col"
        >
          <div class="relative aspect-[16/9] overflow-hidden bg-primary-100">
            <NuxtImg
              v-if="product.image"
              :src="product.image"
              :alt="`${product.name} — photo`"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              width="1200"
              height="675"
              sizes="(min-width: 768px) 50vw, 100vw"
              loading="lazy"
            />
            <span
              class="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/90 backdrop-blur text-primary-900 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1"
            >
              Wingfoil · {{ kindLabel[product.kind] }}
            </span>
          </div>
          <div class="p-6 flex flex-col flex-1">
            <p class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold mb-2">
              <span translate="no">{{ centre.name }}</span>
              <span v-if="centre.region"> · {{ centre.region }}</span>
            </p>
            <h3 class="font-display text-xl text-primary-900 leading-tight text-pretty">
              {{ product.name }}
            </h3>
            <p
              v-if="product.durationLabel"
              class="mt-2 text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold"
            >
              {{ product.durationLabel }}
            </p>
            <p v-if="product.summary" class="mt-4 text-primary-900 leading-relaxed text-sm">
              {{ product.summary }}
            </p>
            <ul
              v-if="product.includes?.length"
              class="mt-4 space-y-1.5 text-sm text-primary-700"
              aria-label="What’s included"
            >
              <li v-for="item in product.includes" :key="item" class="flex items-start gap-2">
                <span
                  class="mt-[0.45rem] inline-block w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0"
                  aria-hidden="true"
                />
                <span>{{ item }}</span>
              </li>
            </ul>
            <div
              class="mt-6 pt-5 border-t border-primary-200/60 flex items-center justify-between gap-4"
            >
              <p class="font-display text-2xl text-primary-900 tabular-nums">
                {{ formatPrice(product.priceCents, product.currency) }}
              </p>
              <UButton
                :to="{ path: `/book/${centre.slug}`, query: { products: product.id } }"
                size="sm"
                :aria-label="`Choose ${product.name}`"
                class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
              >
                Choose →
              </UButton>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Closing CTA -->
    <section class="bg-primary-700">
      <div
        class="max-w-6xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-accent-200 mb-3 font-semibold">
            Start here
          </p>
          <h2
            class="font-display text-3xl sm:text-4xl leading-tight text-white text-pretty max-w-xl"
          >
            Your first wing week, booked by Sunday.
          </h2>
        </div>
        <UButton
          to="/karpathos"
          size="xl"
          class="rounded-full bg-accent-500 hover:bg-accent-600 text-white border-0 px-8 shrink-0"
        >
          See the week →
        </UButton>
      </div>
    </section>
  </article>
</template>
