<script setup lang="ts">
const config = useRuntimeConfig()
const fbPageUrl = computed(() => (config.public.facebookPageUrl as string) || '')

const fbEmbedSrc = computed(() => {
  if (!fbPageUrl.value) return ''
  const params = new URLSearchParams({
    href: fbPageUrl.value,
    tabs: 'timeline',
    width: '340',
    height: '900',
    small_header: 'true',
    adapt_container_width: 'true',
    hide_cover: 'true',
    show_facepile: 'false',
  })
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`
})

interface ConditionsHour {
  time: string
  windKn: number
  gustKn: number
  directionDeg: number
  weatherCode: number
}
interface ConditionsResponse {
  centre: { slug: string; lat: number; lon: number; tz: string }
  current: {
    tempC: number
    windKn: number
    gustKn: number
    directionDeg: number
    weatherCode: number
    observedAt: string
  }
  next: ConditionsHour[]
}

const { data: conditions } = await useFetch<ConditionsResponse>('/api/conditions/karpathos', {
  key: 'conditions-karpathos',
})

// Compass: 8 cardinal points.
function compass(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round(((deg % 360) / 45)) % 8]!
}

// WMO weather codes -> brief label. Subset that Karpathos summer realistically sees.
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
function weatherText(code: number): string {
  return weatherLabel[code] ?? 'Conditions'
}

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
function fmtHour(iso: string): string {
  return hourFormatter.format(new Date(iso))
}

const observedAtRelative = computed(() => {
  const c = conditions.value?.current
  if (!c) return ''
  const ms = Date.now() - new Date(c.observedAt).getTime()
  const min = Math.max(0, Math.round(ms / 60000))
  if (min < 1) return 'Just now'
  if (min === 1) return '1 min ago'
  if (min < 60) return `${min} min ago`
  return `${Math.floor(min / 60)}h ago`
})

useHead({
  title: 'Journal — WindTribe',
  meta: [
    {
      name: 'description',
      content:
        'Live wind, weather and the ION Karpathos team feed — what the bay looks like right now.',
    },
  ],
})
</script>

<template>
  <article class="max-w-6xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Live from the bay
    </p>
    <h1 class="font-display text-5xl sm:text-6xl text-primary-900 leading-[1.05] text-pretty">
      Journal.
    </h1>
    <p class="mt-6 text-lg text-primary-900 max-w-2xl leading-relaxed">
      What ION Karpathos looks like right now — wind, weather, and whatever the team is posting.
      Worth a check the week before you fly out.
    </p>

    <div class="mt-14 grid gap-10 lg:grid-cols-3">
      <!-- Conditions: main column -->
      <div class="lg:col-span-2 space-y-6">
        <section
          v-if="conditions"
          class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-10"
          aria-labelledby="conditions-heading"
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
            id="conditions-heading"
            class="mt-2 font-display text-3xl sm:text-4xl text-primary-900 leading-tight text-pretty"
          >
            <span translate="no">Anemos · ION Karpathos</span>
          </h2>

          <dl class="mt-8 grid grid-cols-3 gap-6">
            <div>
              <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
                Wind
              </dt>
              <dd class="mt-2 font-display text-5xl sm:text-6xl text-primary-900 tabular-nums leading-none">
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
              <dd class="mt-2 font-display text-5xl sm:text-6xl text-primary-900 tabular-nums leading-none">
                {{ Math.round(conditions.current.tempC) }}°
              </dd>
              <dd class="mt-1 text-sm text-primary-700">Celsius</dd>
            </div>
          </dl>
        </section>

        <!-- Next 6 hours -->
        <section
          v-if="conditions?.next.length"
          class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
          aria-labelledby="forecast-heading"
        >
          <h2
            id="forecast-heading"
            class="text-xs uppercase tracking-[0.22em] text-accent-700 font-semibold"
          >
            Next 6 hours
          </h2>
          <ol class="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-3">
            <li
              v-for="h in conditions.next"
              :key="h.time"
              class="bg-[color:var(--color-bg)] rounded-xl border border-primary-200/60 p-3 text-center"
            >
              <p class="text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold tabular-nums">
                {{ fmtHour(h.time) }}
              </p>
              <p class="mt-2 font-display text-2xl text-primary-900 tabular-nums leading-none">
                {{ Math.round(h.windKn) }}
              </p>
              <p class="mt-1 text-[11px] uppercase tracking-wide text-primary-700">
                kn · {{ compass(h.directionDeg) }}
              </p>
              <p class="mt-1 text-[11px] text-primary-700 tabular-nums">
                gust {{ Math.round(h.gustKn) }}
              </p>
            </li>
          </ol>
          <p class="mt-4 text-xs text-primary-700">
            Source: Open-Meteo, refreshed every 10 minutes. Local time
            <span class="tabular-nums">(Europe/Athens)</span>.
          </p>
          <p class="mt-3 text-xs">
            <NuxtLink
              to="/karpathos/conditions"
              class="text-accent-700 hover:text-accent-800 underline underline-offset-4 font-semibold"
            >
              See the full Karpathos forecast →
            </NuxtLink>
          </p>
        </section>

        <!-- Full week of lessons — sits directly under weather, left of FB feed -->
        <LessonsThisWeek centre-slug="karpathos" :days="7" />
      </div>

      <!-- Facebook feed: sidebar -->
      <aside class="lg:col-span-1">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
          From the team
        </p>
        <h2 class="font-display text-2xl text-primary-900 leading-tight text-pretty mb-5">
          Latest posts.
        </h2>
        <template v-if="fbEmbedSrc">
          <div
            class="overflow-hidden rounded-2xl border border-primary-200/60 bg-[color:var(--color-bg-elevated)]"
          >
            <iframe
              :src="fbEmbedSrc"
              title="ION Karpathos on Facebook"
              class="block w-full"
              style="height: 900px; border: 0"
              loading="lazy"
              allow="encrypted-media"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
          <p class="mt-3 text-xs text-primary-700">
            Feed not loading? Some privacy extensions block facebook.com — open the
            <a
              :href="fbPageUrl"
              target="_blank"
              rel="noopener"
              class="underline underline-offset-4 text-accent-700 hover:text-accent-800"
              >page directly</a
            >.
          </p>
        </template>
        <template v-else>
          <p class="text-primary-700">Feed coming soon.</p>
        </template>
      </aside>
    </div>
  </article>
</template>
