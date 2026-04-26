<!-- apps/guest-site/app/components/LessonsThisWeek.vue -->
<script setup lang="ts">
import type { SyndionLesson, SyndionResponse } from '~~/server/utils/syndion'

const props = defineProps<{ centreSlug: string }>()

const { profile } = useRiderProfile()

// lazy: true — page hero/TTFB never blocks on Syndion latency. Lessons hydrate
// in after first paint. State is { data, pending, error }.
const { data, pending, error } = await useFetch<SyndionResponse | null>(
  () => `/api/lessons/${props.centreSlug}`,
  {
    key: () => `lessons-${props.centreSlug}`,
    lazy: true,
    default: () => null,
  },
)

interface DayGroup {
  date: string
  lessons: SyndionLesson[]
}

const groupedLessons = computed<DayGroup[]>(() => {
  const lessons = data.value?.lessons ?? []
  const byDate = new Map<string, SyndionLesson[]>()
  for (const l of lessons) {
    const arr = byDate.get(l.date) ?? []
    arr.push(l)
    byDate.set(l.date, arr)
  }
  const out: DayGroup[] = []
  for (const date of [...byDate.keys()].sort()) {
    const dayLessons = byDate.get(date)!.slice().sort((a, b) => a.start.localeCompare(b.start))
    out.push({ date, lessons: dayLessons })
  }
  return out
})

const dayHeaderFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
function formatDayHeader(iso: string): string {
  // ISO date-only — append T00:00:00Z so it parses as a stable UTC date
  const d = new Date(`${iso}T00:00:00Z`)
  return dayHeaderFormatter.format(d).replace(',', ' ·')
}

function isMatch(l: SyndionLesson): boolean {
  return profile.value?.discipline === l.type.sport
}
</script>

<template>
  <section
    class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    aria-labelledby="lessons-week-heading"
  >
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      From the schedule
    </p>
    <h2
      id="lessons-week-heading"
      class="font-display text-2xl sm:text-3xl text-primary-900 leading-tight text-pretty"
    >
      Lessons this week.
    </h2>
    <p class="mt-3 text-sm text-primary-700 max-w-xl">
      What's on the board at the centre over the next 7 days. Live from ION Karpathos.
    </p>

    <div v-if="pending" class="mt-8 text-sm text-primary-700" aria-live="polite">
      Loading lessons…
    </div>

    <div v-else-if="error" class="mt-8 text-sm text-primary-700" aria-live="polite">
      The schedule isn't reachable right now. Try again in a bit.
    </div>

    <div v-else-if="!groupedLessons.length" class="mt-8 text-sm text-primary-700">
      No lessons scheduled in the next 7 days.
    </div>

    <div v-else class="mt-8 space-y-6">
      <div v-for="day in groupedLessons" :key="day.date">
        <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold mb-3">
          {{ formatDayHeader(day.date) }}
        </p>
        <ul class="space-y-2">
          <li
            v-for="l in day.lessons"
            :key="l.id"
            :data-testid="`lesson-${l.id}`"
            :data-sport="l.type.sport"
            :class="[
              'flex items-baseline gap-3 rounded-lg border border-primary-200/60 bg-[color:var(--color-bg)] px-3 py-2 text-sm',
              isMatch(l) ? 'ring-2 ring-accent-300/60' : '',
            ]"
          >
            <span class="font-semibold tabular-nums text-primary-900 w-12">{{ l.start }}</span>
            <span
              class="flex-1 text-primary-900"
              :class="isMatch(l) ? 'font-semibold' : ''"
            >
              {{ l.type.name }}
            </span>
            <span class="text-xs text-primary-700 hidden sm:inline">{{ l.location }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p class="mt-6 text-xs text-primary-700">
      Source: ION Karpathos · refreshes on page load
    </p>
  </section>
</template>
