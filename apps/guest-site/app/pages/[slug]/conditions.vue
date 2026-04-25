<script setup lang="ts">
import type { Centre } from '~/fixtures/types'

interface Conditions {
  centre: { slug: string; lat: number; lon: number; tz: string }
  current: {
    tempC: number
    windKn: number
    gustKn: number
    directionDeg: number
    weatherCode: number
    observedAt: string
  }
  next: {
    time: string
    windKn: number
    gustKn: number
    directionDeg: number
    weatherCode: number
  }[]
}
interface ForecastDay {
  date: string
  weatherCode: number
  tempMaxC: number
  tempMinC: number
  windMaxKn: number
  gustMaxKn: number
  directionDeg: number
  sunrise: string
  sunset: string
}
interface ForecastResponse {
  centre: { slug: string; lat: number; lon: number; tz: string }
  days: ForecastDay[]
}
interface HistoryYearSeries {
  year: number
  days: {
    dayOffset: number
    date: string
    windMaxKn: number
    gustMaxKn: number
    directionDeg: number
    tempMaxC: number
    tempMinC: number
    weatherCode: number
  }[]
}
interface HistoryAggregate {
  dayOffset: number
  date: string
  meanWindMaxKn: number | null
  p25WindMaxKn: number | null
  p75WindMaxKn: number | null
  meanGustMaxKn: number | null
}
interface HistoryResponse {
  centre: { slug: string; lat: number; lon: number; tz: string }
  window: { from: string; to: string; days: number }
  series: HistoryYearSeries[]
  aggregate: HistoryAggregate[]
}

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Centre details (same pattern as /[slug])
const { data: centreRes, error: centreErr } = await useFetch<{ data: Centre }>(
  () => `/api/centres/${slug.value}`,
  { key: () => `conditions-centre-${slug.value}` },
)
if (centreErr.value || !centreRes.value) {
  throw createError({ statusCode: 404, statusMessage: 'Destination not found', fatal: true })
}
const centre = computed(() => centreRes.value!.data)
const coordsConfigured = computed(
  () => centre.value.latitude !== null && centre.value.longitude !== null,
)

// Current conditions (best-effort — page still renders if Open-Meteo is down)
const { data: conditions } = await useFetch<Conditions | null>(
  () => `/api/conditions/${slug.value}`,
  {
    key: () => `conditions-current-${slug.value}`,
    default: () => null,
    transform: (d: Conditions | null) => d,
    onResponseError: () => {},
  },
)

// 14-day forecast
const { data: forecast } = await useFetch<ForecastResponse | null>(
  () => `/api/conditions/${slug.value}/forecast?days=14`,
  {
    key: () => `conditions-forecast-${slug.value}`,
    default: () => null,
    onResponseError: () => {},
  },
)

// Comparison window — default today + 7 days; URL ?from=&to= overrides.
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function plusDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const dateOnly = /^\d{4}-\d{2}-\d{2}$/
const fromISO = computed(() => {
  const v = route.query.from
  return typeof v === 'string' && dateOnly.test(v) ? v : todayISO()
})
const toISO = computed(() => {
  const v = route.query.to
  if (typeof v === 'string' && dateOnly.test(v)) return v
  return plusDaysISO(fromISO.value, 7)
})

const { data: history } = await useFetch<HistoryResponse | null>(
  () =>
    `/api/conditions/${slug.value}/history?from=${fromISO.value}&to=${toISO.value}&years=4`,
  {
    key: () => `conditions-history-${slug.value}-${fromISO.value}-${toISO.value}`,
    default: () => null,
    onResponseError: () => {},
  },
)

// Helpers
const compass = (deg: number) => {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round((deg % 360) / 45) % 8]!
}
const weatherLabel: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
}
const weatherText = (code: number) => weatherLabel[code] ?? 'Conditions'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const fmtShortDate = (iso: string) => dateFormatter.format(new Date(iso))
const fmtLongDate = (iso: string) => longDateFormatter.format(new Date(iso))
const fmtHour = (iso: string) => hourFormatter.format(new Date(iso))

const observedAtRelative = computed(() => {
  const c = conditions.value?.current
  if (!c) return ''
  const ms = Date.now() - new Date(c.observedAt).getTime()
  const min = Math.max(0, Math.round(ms / 60000))
  if (min < 1) return 'Just now'
  if (min < 60) return `${min} min ago`
  return `${Math.floor(min / 60)}h ago`
})

// Summary line: "Typically X-Y kn this week, this year tracking Z"
const summary = computed(() => {
  const h = history.value
  const f = forecast.value
  if (!h || !h.aggregate.length) return null
  const winds = h.aggregate
    .map((a) => a.meanWindMaxKn)
    .filter((v): v is number => typeof v === 'number')
  if (!winds.length) return null
  const p25s = h.aggregate
    .map((a) => a.p25WindMaxKn)
    .filter((v): v is number => typeof v === 'number')
  const p75s = h.aggregate
    .map((a) => a.p75WindMaxKn)
    .filter((v): v is number => typeof v === 'number')
  const lo = Math.round(p25s.reduce((a, b) => a + b, 0) / p25s.length)
  const hi = Math.round(p75s.reduce((a, b) => a + b, 0) / p75s.length)

  // Forecast value: average windMax across the same number of days from the forecast head
  let thisYear: number | null = null
  if (f?.days.length) {
    const slice = f.days.slice(0, h.window.days)
    const fcWinds = slice.map((d) => d.windMaxKn).filter((v) => Number.isFinite(v))
    if (fcWinds.length) {
      thisYear = Math.round(fcWinds.reduce((a, b) => a + b, 0) / fcWinds.length)
    }
  }
  return { lo, hi, thisYear }
})

useHead(() => ({
  title: `Conditions — ${centre.value.name} — WindTribe`,
  meta: [
    {
      name: 'description',
      content: `Live wind, weather and historical conditions for ${centre.value.name}. Open-Meteo data refreshed every 10 minutes.`,
    },
  ],
}))
</script>

<template>
  <article class="max-w-6xl mx-auto px-6 py-14">
    <nav
      aria-label="Breadcrumb"
      class="mb-8 text-xs uppercase tracking-[0.22em] text-primary-700 font-semibold"
    >
      <NuxtLink :to="`/${slug}`" class="hover:text-accent-800">
        ← <span translate="no">{{ centre.name }}</span>
      </NuxtLink>
    </nav>

    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Live conditions
    </p>
    <h1
      class="font-display text-5xl sm:text-6xl text-primary-900 leading-[1.05] text-pretty"
      translate="no"
    >
      {{ centre.name }} · wind &amp; weather.
    </h1>
    <p class="mt-6 text-lg text-primary-900 max-w-2xl leading-relaxed">
      What the bay looks like right now, the next two weeks, and how it usually feels at this time
      of year.
    </p>

    <!-- Coords missing fallback -->
    <p
      v-if="!coordsConfigured"
      class="mt-12 bg-[color:var(--color-bg-elevated)] border border-primary-200/60 rounded-2xl p-6 text-primary-700"
    >
      Conditions for this destination aren't configured yet. We need to set the coordinates on the
      centre record before live weather can show here.
    </p>

    <template v-else>
      <!-- Right Now -->
      <section
        v-if="conditions"
        class="mt-12 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-10"
        aria-labelledby="now-heading"
      >
        <div class="flex items-center justify-between gap-4">
          <p class="text-xs uppercase tracking-[0.22em] text-accent-700 font-semibold">
            Right now
          </p>
          <p class="text-xs text-primary-700 tabular-nums">
            {{ observedAtRelative }} · {{ weatherText(conditions.current.weatherCode) }}
          </p>
        </div>
        <h2
          id="now-heading"
          class="mt-2 font-display text-2xl sm:text-3xl text-primary-900 leading-tight text-pretty"
        >
          The bay, this minute.
        </h2>
        <dl class="mt-8 grid grid-cols-3 gap-6">
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Wind
            </dt>
            <dd
              class="mt-2 font-display text-5xl sm:text-6xl text-primary-900 tabular-nums leading-none"
            >
              {{ Math.round(conditions.current.windKn) }}
            </dd>
            <dd class="mt-1 text-sm text-primary-700">
              kn · gust
              <span class="tabular-nums">{{ Math.round(conditions.current.gustKn) }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Direction
            </dt>
            <dd class="mt-2 font-display text-5xl sm:text-6xl text-primary-900 leading-none">
              {{ compass(conditions.current.directionDeg) }}
            </dd>
            <dd class="mt-1 text-sm text-primary-700 tabular-nums">
              {{ Math.round(conditions.current.directionDeg) }}°
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Air
            </dt>
            <dd
              class="mt-2 font-display text-5xl sm:text-6xl text-primary-900 tabular-nums leading-none"
            >
              {{ Math.round(conditions.current.tempC) }}°
            </dd>
            <dd class="mt-1 text-sm text-primary-700">Celsius</dd>
          </div>
        </dl>
      </section>

      <!-- 14-day forecast -->
      <section
        v-if="forecast?.days.length"
        class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
        aria-labelledby="forecast-heading"
      >
        <h2
          id="forecast-heading"
          class="text-xs uppercase tracking-[0.22em] text-accent-700 font-semibold"
        >
          Next 14 days
        </h2>
        <p class="mt-1 font-display text-2xl text-primary-900 leading-tight">
          The fortnight ahead.
        </p>
        <div
          class="mt-6 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
          tabindex="0"
          role="region"
          aria-label="14-day forecast — scroll horizontally"
        >
          <ol class="grid grid-flow-col auto-cols-[minmax(120px,1fr)] gap-3 min-w-full pb-2">
            <li
              v-for="day in forecast.days"
              :key="day.date"
              class="bg-[color:var(--color-bg)] rounded-xl border border-primary-200/60 p-3"
            >
              <p class="text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold">
                {{ fmtShortDate(day.date) }}
              </p>
              <p class="mt-2 font-display text-3xl text-primary-900 tabular-nums leading-none">
                {{ Math.round(day.windMaxKn) }}
              </p>
              <p class="mt-1 text-[11px] uppercase tracking-wide text-primary-700">
                kn · {{ compass(day.directionDeg) }}
              </p>
              <p class="mt-1 text-[11px] text-primary-700 tabular-nums">
                gust {{ Math.round(day.gustMaxKn) }}
              </p>
              <p class="mt-3 text-xs text-primary-700">
                {{ weatherText(day.weatherCode) }}
              </p>
              <p class="mt-1 text-xs text-primary-700 tabular-nums">
                {{ Math.round(day.tempMinC) }}–{{ Math.round(day.tempMaxC) }}°
              </p>
              <p class="mt-2 text-[11px] text-primary-700 tabular-nums">
                ☀ {{ fmtHour(day.sunrise) }}–{{ fmtHour(day.sunset) }}
              </p>
            </li>
          </ol>
        </div>
        <p class="mt-4 text-xs text-primary-700">
          Source: Open-Meteo, refreshed every 10 minutes. Local time
          <span class="tabular-nums">({{ centre.timezone }})</span>.
        </p>
      </section>

      <!-- Compared to past years -->
      <section
        v-if="history?.series.length"
        class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
        aria-labelledby="history-heading"
      >
        <h2
          id="history-heading"
          class="text-xs uppercase tracking-[0.22em] text-accent-700 font-semibold"
        >
          Compared to past years
        </h2>
        <p class="mt-1 font-display text-2xl text-primary-900 leading-tight text-pretty">
          {{ fmtLongDate(history.window.from) }} — {{ fmtLongDate(history.window.to) }}
        </p>
        <p
          v-if="summary"
          class="mt-4 text-primary-900 leading-relaxed max-w-2xl"
        >
          Typically <span class="font-semibold tabular-nums">{{ summary.lo }}–{{ summary.hi }} kn</span>
          this week, based on the past
          <span class="tabular-nums">{{ history.series.length }}</span> years.
          <template v-if="summary.thisYear !== null">
            This year tracking
            <span class="font-semibold tabular-nums">{{ summary.thisYear }} kn</span>.
          </template>
        </p>

        <div class="mt-8">
          <ConditionsChart
            :aggregate="history.aggregate"
            :forecast="forecast?.days ?? []"
            :years="history.series.map((s) => s.year)"
          />
        </div>

        <p class="mt-6 text-xs text-primary-700">
          Source: Open-Meteo archive, years
          <span class="tabular-nums">{{ history.series.map((s) => s.year).join(' / ') }}</span>.
          Override the window via
          <code class="font-mono text-primary-900">?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code>.
        </p>
      </section>
    </template>
  </article>
</template>
