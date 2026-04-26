<script setup lang="ts">
// Year-over-year wind comparison chart.
// X axis: each day of the comparison window.
// Solid coral line: this year's forecast windMaxKn.
// Shaded primary band: historical p25-p75 across past N years.
// Dotted primary line: historical mean.
// Background: horizontal Windguru-coloured wind-strength bands so the reader
// can see "this is in the green / yellow / red zone" without reading the axis.
// A tabular breakdown is rendered below the chart for screen-reader users
// (and as a useful at-a-glance table for everyone).

import { WIND_BANDS } from '~/utils/windguru'

interface AggregateDay {
  dayOffset: number
  date: string
  meanWindMaxKn: number | null
  p25WindMaxKn: number | null
  p75WindMaxKn: number | null
}
interface ForecastDay {
  date: string
  windMaxKn: number
}

const props = defineProps<{
  aggregate: AggregateDay[]
  forecast: ForecastDay[]
  /** Years included in the historical aggregate, oldest first. */
  years: number[]
}>()

interface ChartPoint {
  i: number
  date: string
  forecast: number | null
  mean: number | null
  p25: number | null
  p75: number | null
}

const points = computed<ChartPoint[]>(() => {
  const fcByDate = new Map(props.forecast.map((d) => [d.date, d.windMaxKn]))
  return props.aggregate.map((a, i) => ({
    i,
    date: a.date,
    forecast: fcByDate.get(a.date) ?? null,
    mean: a.meanWindMaxKn,
    p25: a.p25WindMaxKn,
    p75: a.p75WindMaxKn,
  }))
})

// Chart dimensions (viewBox-based, scales fluidly).
const VB_WIDTH = 800
const VB_HEIGHT = 320
const PAD = { top: 24, right: 16, bottom: 36, left: 40 }
const innerW = VB_WIDTH - PAD.left - PAD.right
const innerH = VB_HEIGHT - PAD.top - PAD.bottom

// Y scale: 0 to (max value rounded up to nearest 5, with a bit of headroom).
const yMax = computed(() => {
  const all: number[] = []
  for (const p of points.value) {
    if (p.forecast !== null) all.push(p.forecast)
    if (p.p75 !== null) all.push(p.p75)
    if (p.mean !== null) all.push(p.mean)
  }
  const peak = all.length ? Math.max(...all) : 25
  return Math.max(15, Math.ceil((peak + 3) / 5) * 5)
})
const yTicks = computed(() => {
  const step = yMax.value <= 20 ? 5 : yMax.value <= 40 ? 10 : 15
  const out: number[] = []
  for (let v = 0; v <= yMax.value; v += step) out.push(v)
  return out
})

function x(i: number): number {
  if (points.value.length <= 1) return PAD.left + innerW / 2
  return PAD.left + (i / (points.value.length - 1)) * innerW
}
function y(v: number): number {
  return PAD.top + innerH - (v / yMax.value) * innerH
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
})
function fmtTick(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

// Forecast line — only points where forecast is non-null
const forecastPath = computed(() => {
  const segs: string[] = []
  let inSegment = false
  for (const p of points.value) {
    if (p.forecast === null) {
      inSegment = false
      continue
    }
    segs.push(`${inSegment ? 'L' : 'M'} ${x(p.i).toFixed(2)} ${y(p.forecast).toFixed(2)}`)
    inSegment = true
  }
  return segs.join(' ')
})

// Mean line (dotted) — only segments where mean is non-null
const meanPath = computed(() => {
  const segs: string[] = []
  let inSegment = false
  for (const p of points.value) {
    if (p.mean === null) {
      inSegment = false
      continue
    }
    segs.push(`${inSegment ? 'L' : 'M'} ${x(p.i).toFixed(2)} ${y(p.mean).toFixed(2)}`)
    inSegment = true
  }
  return segs.join(' ')
})

// Band path — closed polygon p75 left→right then p25 right→left, drawn only over
// continuous spans where both bounds are present.
const bandPath = computed(() => {
  const spans: ChartPoint[][] = []
  let cur: ChartPoint[] = []
  for (const p of points.value) {
    if (p.p25 !== null && p.p75 !== null) {
      cur.push(p)
    } else if (cur.length) {
      spans.push(cur)
      cur = []
    }
  }
  if (cur.length) spans.push(cur)

  return spans
    .map((span) => {
      const top = span
        .map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.i).toFixed(2)} ${y(p.p75!).toFixed(2)}`)
        .join(' ')
      const bottom = [...span]
        .reverse()
        .map((p) => `L ${x(p.i).toFixed(2)} ${y(p.p25!).toFixed(2)}`)
        .join(' ')
      return `${top} ${bottom} Z`
    })
    .join(' ')
})

const chartTitle = computed(
  () =>
    `Wind in knots, day by day. Solid coral line: this year's forecast. Shaded band: 25th-75th percentile from ${props.years.join(', ')}. Dotted line: mean across those years. Background tinted with Windguru wind-strength colours.`,
)

// Visible Windguru bands, each clipped to the chart's y-range. Drawn as
// horizontal rects behind everything else so the lines/area still read.
interface VisibleBand {
  y: number
  height: number
  hex: string
  key: string
}
const visibleBands = computed<VisibleBand[]>(() => {
  const out: VisibleBand[] = []
  for (const b of WIND_BANDS) {
    const lo = Math.max(0, b.from)
    const hi = Math.min(yMax.value, b.to === Infinity ? yMax.value : b.to)
    if (hi <= lo) continue
    const yTop = y(hi) // higher value -> smaller y in screen coords
    const yBot = y(lo)
    const height = yBot - yTop
    if (height <= 0) continue
    out.push({
      y: yTop,
      height,
      hex: b.hex,
      key: `${b.from}-${b.to === Infinity ? 'inf' : b.to}`,
    })
  }
  return out
})
</script>

<template>
  <figure class="not-prose">
    <svg
      :viewBox="`0 0 ${VB_WIDTH} ${VB_HEIGHT}`"
      class="block w-full h-auto"
      role="img"
      :aria-label="chartTitle"
    >
      <!-- Windguru wind-strength background bands -->
      <g aria-hidden="true">
        <rect
          v-for="b in visibleBands"
          :key="b.key"
          :x="PAD.left"
          :y="b.y"
          :width="innerW"
          :height="b.height"
          :fill="b.hex"
          fill-opacity="0.32"
        />
      </g>

      <!-- Y gridlines + tick labels -->
      <g class="text-primary-500" font-size="11">
        <g v-for="t in yTicks" :key="t">
          <line
            :x1="PAD.left"
            :x2="PAD.left + innerW"
            :y1="y(t)"
            :y2="y(t)"
            stroke="currentColor"
            stroke-opacity="0.18"
            stroke-width="1"
          />
          <text
            :x="PAD.left - 6"
            :y="y(t) + 4"
            text-anchor="end"
            fill="currentColor"
            class="tabular-nums"
          >
            {{ t }}
          </text>
        </g>
      </g>

      <!-- X labels -->
      <g class="text-primary-700" font-size="11">
        <text
          v-for="p in points"
          :key="`x-${p.i}`"
          :x="x(p.i)"
          :y="VB_HEIGHT - 12"
          text-anchor="middle"
          fill="currentColor"
        >
          {{ fmtTick(p.date) }}
        </text>
      </g>

      <!-- Historical band -->
      <path
        v-if="bandPath"
        :d="bandPath"
        class="fill-primary-300/40"
        stroke="none"
      />

      <!-- Historical mean (dotted) -->
      <path
        v-if="meanPath"
        :d="meanPath"
        class="stroke-primary-700"
        fill="none"
        stroke-width="1.5"
        stroke-dasharray="3 4"
        stroke-linecap="round"
      />

      <!-- This year's forecast (solid coral) -->
      <path
        v-if="forecastPath"
        :d="forecastPath"
        class="stroke-accent-700"
        fill="none"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <g v-if="forecastPath">
        <circle
          v-for="p in points.filter((q) => q.forecast !== null)"
          :key="`fc-dot-${p.i}`"
          :cx="x(p.i)"
          :cy="y(p.forecast!)"
          r="3.5"
          class="fill-accent-700"
        />
      </g>

      <!-- Y axis label -->
      <text
        :x="PAD.left - 32"
        :y="PAD.top + innerH / 2"
        :transform="`rotate(-90 ${PAD.left - 32} ${PAD.top + innerH / 2})`"
        text-anchor="middle"
        font-size="10"
        class="fill-primary-700 uppercase tracking-widest font-semibold"
      >
        kn
      </text>
    </svg>

    <!-- Legend -->
    <figcaption class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      <span class="inline-flex items-center gap-2">
        <span class="inline-block w-5 h-[3px] bg-accent-700 rounded" aria-hidden="true" />
        <span class="text-primary-900">This year (forecast)</span>
      </span>
      <span class="inline-flex items-center gap-2">
        <span
          class="inline-block w-5 h-3 bg-primary-300/40 border border-primary-300/40 rounded-sm"
          aria-hidden="true"
        />
        <span class="text-primary-900">Past years 25–75%</span>
      </span>
      <span class="inline-flex items-center gap-2">
        <span
          class="inline-block w-5 h-[2px] bg-primary-700 rounded"
          style="background-image: linear-gradient(to right, #0e7490 50%, transparent 50%); background-size: 6px 100%;"
          aria-hidden="true"
        />
        <span class="text-primary-900">Past years mean</span>
      </span>
    </figcaption>

    <!-- Tabular fallback — readable + screen-reader-friendly -->
    <details class="mt-6 group">
      <summary
        class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold cursor-pointer hover:text-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded inline-block"
      >
        Show numbers
      </summary>
      <div class="mt-3 overflow-x-auto">
        <table class="text-sm tabular-nums">
          <caption class="sr-only">{{ chartTitle }}</caption>
          <thead>
            <tr class="text-left">
              <th
                scope="col"
                class="px-3 py-2 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
              >
                Date
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
              >
                This year
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
              >
                Past mean
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-xs uppercase tracking-[0.14em] text-primary-700 font-semibold"
              >
                Past p25–p75
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-primary-200/60">
            <tr v-for="p in points" :key="`row-${p.i}`">
              <td class="px-3 py-2 text-primary-900 whitespace-nowrap">{{ fmtTick(p.date) }}</td>
              <td class="px-3 py-2 text-primary-900">
                {{ p.forecast === null ? '—' : `${Math.round(p.forecast)} kn` }}
              </td>
              <td class="px-3 py-2 text-primary-900">
                {{ p.mean === null ? '—' : `${Math.round(p.mean)} kn` }}
              </td>
              <td class="px-3 py-2 text-primary-900">
                {{
                  p.p25 === null || p.p75 === null
                    ? '—'
                    : `${Math.round(p.p25)}–${Math.round(p.p75)} kn`
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </figure>
</template>
