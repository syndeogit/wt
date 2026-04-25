<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import type { Centre, Product } from '~/fixtures/types'

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)

const { data: centreRes, error: centreErr } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${slug.value}`,
  { key: () => `book-centre-${slug.value}` },
)
if (centreErr.value || !centreRes.value) {
  throw createError({ statusCode: 404, statusMessage: 'Destination not found', fatal: true })
}
const centre = computed(() => centreRes.value!.data)

const { data: productsRes } = await useFetch<{ data: Product[] }>(
  () => `/api/centres/${slug.value}/products`,
  { key: () => `book-products-${slug.value}`, default: () => ({ data: [] }) },
)
const products = computed(() => productsRes.value?.data ?? [])

const selectedProductId = computed(() => {
  const raw = route.query.products
  if (typeof raw !== 'string') return null
  return raw.split(',')[0] || null
})
const product = computed(() =>
  selectedProductId.value
    ? products.value.find((p) => p.id === selectedProductId.value) ?? null
    : null,
)

const tz = getLocalTimeZone()
const minValue = computed(() => today(tz))

function tryParseDate(raw: unknown): CalendarDate | undefined {
  if (typeof raw !== 'string') return undefined
  try {
    const d = parseDate(raw)
    return d instanceof CalendarDate ? d : undefined
  } catch {
    return undefined
  }
}

interface DateRangeValue {
  start: CalendarDate | undefined
  end: CalendarDate | undefined
}
// UCalendar's v-model typing is reka-ui's DateRange | null — structurally the
// same as ours but nominally distinct. Store as our shape, cast at the binding.
const range = ref<DateRangeValue>({
  start: tryParseDate(route.query.from),
  end: tryParseDate(route.query.to),
})

watch(
  () => route.query,
  (q) => {
    range.value = { start: tryParseDate(q.from), end: tryParseDate(q.to) }
  },
)

function onCalendarUpdate(v: unknown) {
  const r = v as DateRangeValue | null
  range.value = {
    start: r?.start ?? undefined,
    end: r?.end ?? undefined,
  }
}

watch(
  range,
  (r) => {
    const query: Record<string, string> = {}
    if (selectedProductId.value) query.products = selectedProductId.value
    if (r?.start) query.from = r.start.toString()
    if (r?.end) query.to = r.end.toString()
    router.replace({ query })
  },
  { deep: true },
)

const nightCount = computed(() => {
  if (!range.value?.start || !range.value?.end) return 0
  const ms =
    range.value.end.toDate(tz).getTime() - range.value.start.toDate(tz).getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
})

const datesSelected = computed(() => Boolean(range.value?.start && range.value?.end))

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const arrivalLabel = computed(() =>
  range.value?.start ? dateFormatter.format(range.value.start.toDate(tz)) : null,
)
const departureLabel = computed(() =>
  range.value?.end ? dateFormatter.format(range.value.end.toDate(tz)) : null,
)

function onContinue() {
  if (!datesSelected.value || !selectedProductId.value) return
  router.push({
    path: `/book/${slug.value}/confirm`,
    query: {
      products: selectedProductId.value,
      from: range.value.start!.toString(),
      to: range.value.end!.toString(),
    },
  })
}

useHead(() => ({
  title: product.value
    ? `Book ${product.value.name} — WindTribe`
    : `Book a week — ${centre.value.name}`,
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
}))
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-14">
    <nav aria-label="Booking" class="mb-8 text-xs uppercase tracking-[0.22em] text-primary-700 font-semibold">
      <NuxtLink :to="`/${centre.slug}`" class="hover:text-accent-800">
        ← Back to <span translate="no">{{ centre.name }}</span>
      </NuxtLink>
    </nav>

    <template v-if="!product">
      <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
        Pick a programme
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Choose something to book.
      </h1>
      <p class="mt-6 text-primary-900 leading-relaxed max-w-xl">
        Open the destination page and hit <span class="font-semibold">Choose</span> on any lesson,
        rental, or package — we’ll bring you back here to pick dates.
      </p>
      <div class="mt-10">
        <UButton
          :to="`/${centre.slug}`"
          size="lg"
          class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
        >
          See <span translate="no">{{ centre.name }}</span>
        </UButton>
      </div>
    </template>

    <template v-else>
      <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
        Book a week
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Pick your dates.
      </h1>
      <p class="mt-4 text-primary-700 leading-relaxed max-w-2xl">
        Tap your arrival day, then your departure day. You can switch either one until you continue.
      </p>

      <div class="mt-10 grid gap-10 lg:grid-cols-5">
        <!-- Calendar -->
        <section class="lg:col-span-3">
          <div
            class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-4 sm:p-6 flex justify-center"
          >
            <UCalendar
              :model-value="(range as unknown) as never"
              range
              :min-value="minValue"
              :number-of-months="2"
              class="mx-auto"
              @update:model-value="onCalendarUpdate"
            />
          </div>
          <p v-if="!datesSelected" class="mt-4 text-sm text-primary-700">
            Pick two dates to see the total.
          </p>
        </section>

        <!-- Summary -->
        <aside class="lg:col-span-2">
          <div class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-7">
            <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold mb-2">
              Programme
            </p>
            <h2 class="font-display text-xl text-primary-900 leading-tight text-pretty">
              {{ product.name }}
            </h2>
            <p
              v-if="product.durationLabel"
              class="mt-1 text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold"
            >
              {{ product.durationLabel }}
            </p>

            <dl class="mt-6 space-y-4 text-sm">
              <div>
                <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                  Destination
                </dt>
                <dd class="mt-1 text-primary-900" translate="no">{{ centre.name }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                  Arrival
                </dt>
                <dd class="mt-1 text-primary-900 tabular-nums">{{ arrivalLabel ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                  Departure
                </dt>
                <dd class="mt-1 text-primary-900 tabular-nums">{{ departureLabel ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                  Nights
                </dt>
                <dd class="mt-1 text-primary-900 tabular-nums">{{ nightCount || '—' }}</dd>
              </div>
            </dl>

            <div class="mt-6 pt-5 border-t border-primary-200/60">
              <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                Programme total
              </p>
              <p class="mt-1 font-display text-3xl text-primary-900 tabular-nums">
                {{ formatPrice(product.priceCents, product.currency) }}
              </p>
              <p class="mt-1 text-xs text-primary-700">
                Accommodation priced separately in a future step.
              </p>
            </div>

            <UButton
              size="lg"
              :disabled="!datesSelected"
              class="mt-6 w-full justify-center rounded-full bg-primary-900 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white border-0"
              @click="onContinue"
            >
              {{ datesSelected ? 'Review booking →' : 'Pick dates to continue' }}
            </UButton>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
