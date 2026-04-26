<script setup lang="ts">
import type { Centre, Hotel, Product } from '~/fixtures/types'
import { syndionCodeForSlug } from '~/utils/syndion'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: centreRes, error: centreErr } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${slug.value}`,
  { key: () => `centre-${slug.value}` },
)

if (centreErr.value || !centreRes.value) {
  throw createError({ statusCode: 404, statusMessage: 'Destination not found', fatal: true })
}

const centre = computed(() => centreRes.value!.data)

const { data: productsRes } = await useFetch<{ data: Product[] }>(
  () => `/api/centres/${slug.value}/products`,
  { key: () => `products-${slug.value}`, default: () => ({ data: [] }) },
)
const { data: hotelsRes } = await useFetch<{ data: Hotel[] }>(
  () => `/api/centres/${slug.value}/hotels`,
  { key: () => `hotels-${slug.value}`, default: () => ({ data: [] }) },
)

interface ConditionsLite {
  current: { windKn: number; directionDeg: number }
}
// Best-effort live wind chip on the hero. 404s when coords aren't configured;
// we just hide the chip in that case so the page still renders.
const { data: conditions } = await useFetch<ConditionsLite | null>(
  () => `/api/conditions/${slug.value}`,
  {
    key: () => `hero-conditions-${slug.value}`,
    default: () => null,
    onResponseError: () => {},
  },
)
function compass(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round((deg % 360) / 45) % 8]!
}

const products = computed(() => productsRes.value?.data ?? [])
const hotels = computed(() => hotelsRes.value?.data ?? [])

const kindOrder: Record<Product['kind'], number> = { package: 0, lesson: 1, rental: 2 }
const sortedProducts = computed(() =>
  [...products.value].sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind]),
)

const disciplineLabel: Record<Product['discipline'], string> = {
  wingfoil: 'Wingfoil',
  windsurf: 'Windsurf',
  kitesurf: 'Kitesurf',
}
const kindLabel: Record<Product['kind'], string> = {
  package: 'Package',
  lesson: 'Lesson',
  rental: 'Rental',
}
const levelLabel: Record<Product['minLevel'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

useHead(() => ({
  title: `${centre.value.name} — WindTribe`,
  meta: [
    { name: 'description', content: centre.value.tagline || centre.value.description.slice(0, 160) },
    { property: 'og:title', content: `${centre.value.name} — WindTribe` },
    {
      property: 'og:description',
      content: centre.value.tagline || centre.value.description.slice(0, 160),
    },
    { property: 'og:image', content: centre.value.heroImage },
  ],
  link: centre.value.heroImage
    ? [
        {
          rel: 'preload',
          as: 'image',
          href: centre.value.heroImage,
          fetchpriority: 'high',
        },
      ]
    : [],
}))
</script>

<template>
  <article>
    <!-- Hero -->
    <section class="relative">
      <div class="relative h-[60vh] min-h-[420px] max-h-[640px] overflow-hidden">
        <NuxtImg
          v-if="centre.heroImage"
          :src="centre.heroImage"
          :alt="`${centre.name} — hero photography`"
          class="absolute inset-0 w-full h-full object-cover"
          width="1600"
          height="1000"
          sizes="100vw"
          loading="eager"
          fetchpriority="high"
        />
        <div
          class="absolute inset-0 bg-gradient-to-b from-primary-950/20 via-primary-950/40 to-primary-950/70"
          aria-hidden="true"
        />
        <div class="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-14 sm:pb-20">
          <p class="text-xs uppercase tracking-[0.22em] text-accent-50 mb-4 font-semibold">
            <span v-if="centre.region">{{ centre.region }} · </span>{{ centre.country }}
          </p>
          <h1
            class="font-display text-5xl sm:text-7xl leading-[1.02] text-white max-w-4xl text-pretty drop-shadow"
            translate="no"
          >
            {{ centre.name }}
          </h1>
          <p
            v-if="centre.tagline"
            class="mt-6 text-lg sm:text-2xl text-white/90 max-w-2xl leading-relaxed"
          >
            {{ centre.tagline }}
          </p>
          <NuxtLink
            v-if="conditions?.current"
            :to="`/${slug}/conditions`"
            class="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-white/95 backdrop-blur px-4 py-2 text-sm font-medium text-primary-900 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            :aria-label="`Live conditions: ${Math.round(conditions.current.windKn)} knots ${compass(conditions.current.directionDeg)}. Open the conditions page.`"
          >
            <span class="text-accent-700 uppercase tracking-[0.14em] text-xs font-semibold">
              Wind now
            </span>
            <span class="tabular-nums">{{ Math.round(conditions.current.windKn) }} kn</span>
            <span class="text-primary-700">·</span>
            <span>{{ compass(conditions.current.directionDeg) }}</span>
            <span aria-hidden="true" class="ml-1">→</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Overview -->
    <section
      v-if="centre.description"
      class="max-w-6xl mx-auto px-6 py-20 [content-visibility:auto] [contain-intrinsic-size:0_400px]"
    >
      <div class="grid gap-10 md:grid-cols-5 md:gap-16">
        <div class="md:col-span-2">
          <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
            The destination
          </p>
          <h2 class="font-display text-3xl sm:text-4xl text-primary-900 leading-[1.1] text-pretty">
            Why {{ centre.name.replace(/^ION\s+/i, '') }}.
          </h2>
        </div>
        <div class="md:col-span-3">
          <p class="text-lg text-primary-900 leading-relaxed whitespace-pre-line">
            {{ centre.description }}
          </p>
        </div>
      </div>
    </section>

    <RiderProfileSoft />

    <!-- Live lessons (Karpathos only — gated by Syndion centre map) -->
    <section
      v-if="syndionCodeForSlug(slug)"
      class="max-w-6xl mx-auto px-6 py-20 [content-visibility:auto] [contain-intrinsic-size:0_800px]"
    >
      <LessonsThisWeek :centre-slug="slug" />
    </section>

    <!-- Products -->
    <section
      class="border-t border-primary-200/60 bg-[color:var(--color-bg-elevated)] [content-visibility:auto] [contain-intrinsic-size:0_1200px]"
    >
      <div class="max-w-6xl mx-auto px-6 py-20">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
              Lessons, rentals, packages
            </p>
            <h2 class="font-display text-3xl sm:text-4xl text-primary-900 leading-tight text-pretty">
              What you can book.
            </h2>
          </div>
          <p class="text-sm text-primary-700 max-w-sm">
            Real prices, not “from”. Pick the shape that fits your week — we build the rest around
            it.
          </p>
        </div>

        <p v-if="!sortedProducts.length" class="text-primary-700">
          No products published for this destination yet.
        </p>

        <ul v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="product in sortedProducts"
            :key="product.id"
            class="group bg-[color:var(--color-bg)] rounded-2xl border border-primary-200/60 overflow-hidden flex flex-col"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-primary-100">
              <NuxtImg
                v-if="product.image"
                :src="product.image"
                :alt="`${product.name} — photo`"
                class="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                width="1200"
                height="900"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                loading="lazy"
              />
              <span
                class="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/90 backdrop-blur text-primary-900 text-[11px] uppercase tracking-[0.18em] font-semibold px-3 py-1"
              >
                {{ disciplineLabel[product.discipline] }} · {{ kindLabel[product.kind] }}
              </span>
            </div>
            <div class="p-6 flex flex-col flex-1">
              <h3 class="font-display text-xl text-primary-900 leading-tight text-pretty">
                {{ product.name }}
              </h3>
              <p
                v-if="product.durationLabel"
                class="mt-2 text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold"
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
                <div>
                  <p
                    :data-testid="`product-price-${product.id}`"
                    class="font-display text-2xl text-primary-900 tabular-nums"
                  >
                    {{ formatPrice(product.priceCents, product.currency) }}
                  </p>
                  <p class="text-xs text-primary-700 uppercase tracking-wide">
                    {{ levelLabel[product.minLevel] }}
                  </p>
                </div>
                <UButton
                  size="sm"
                  class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
                  :aria-label="`Choose ${product.name}`"
                  :to="{ path: `/book/${centre.slug}`, query: { products: product.id } }"
                >
                  Choose
                </UButton>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Hotels -->
    <section
      v-if="hotels.length"
      class="max-w-6xl mx-auto px-6 py-20 [content-visibility:auto] [contain-intrinsic-size:0_600px]"
    >
      <div class="mb-10">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
          Where to stay
        </p>
        <h2 class="font-display text-3xl sm:text-4xl text-primary-900 leading-tight text-pretty">
          Partner accommodation on the bay.
        </h2>
        <p class="mt-4 text-primary-700 max-w-2xl">
          Walk to the centre, sleep near the water. Add a hotel to any booking — one confirmation,
          no second checkout.
        </p>
      </div>
      <ul class="grid gap-6 md:grid-cols-2">
        <li
          v-for="hotel in hotels"
          :key="hotel.id"
          class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 overflow-hidden flex flex-col sm:flex-row"
        >
          <div class="sm:w-2/5 aspect-[4/3] sm:aspect-auto relative bg-primary-100">
            <NuxtImg
              v-if="hotel.image"
              :src="hotel.image"
              :alt="`${hotel.name} — photo`"
              class="absolute inset-0 w-full h-full object-cover"
              width="1200"
              height="900"
              sizes="(min-width: 768px) 40vw, 100vw"
              loading="lazy"
            />
          </div>
          <div class="p-6 flex-1 flex flex-col">
            <h3 class="font-display text-xl text-primary-900 leading-tight text-pretty">
              {{ hotel.name }}
            </h3>
            <p v-if="hotel.summary" class="mt-3 text-primary-900 leading-relaxed text-sm">
              {{ hotel.summary }}
            </p>
            <div class="mt-auto pt-5">
              <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                From
              </p>
              <p class="font-display text-2xl text-primary-900 tabular-nums">
                {{ formatPrice(hotel.nightlyFromCents, hotel.currency) }}<span
                  class="text-sm font-normal text-primary-700"
                >&nbsp;/ night</span>
              </p>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Closing CTA -->
    <section class="bg-primary-700 [content-visibility:auto] [contain-intrinsic-size:0_200px]">
      <div
        class="max-w-6xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-accent-50 mb-3 font-semibold">
            Ready to book
          </p>
          <h2
            class="font-display text-3xl sm:text-4xl leading-tight text-white text-pretty max-w-xl"
          >
            Pick your week at <span translate="no">{{ centre.name }}</span>.
          </h2>
        </div>
        <UButton
          :to="`/book/${centre.slug}`"
          size="xl"
          class="rounded-full bg-accent-700 hover:bg-accent-800 text-white border-0 px-8 shrink-0"
        >
          Start booking →
        </UButton>
      </div>
    </section>
  </article>
</template>
