// GET /api/conditions/[slug]/history?from=YYYY-MM-DD&to=YYYY-MM-DD&years=4
//
// Pulls the same calendar window (from..to) across the past N years from
// Open-Meteo's archive API, aligns by day-offset within the window, and
// returns each year's raw series plus a per-day aggregate (mean / p25 / p75).
// The chart on /[slug]/conditions overlays this year's forecast on the
// historical band — "typically 12-18kn this week, this year tracking 14-22kn".
//
// Cached 24h: archive data is immutable.

const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive'
const dateOnly = /^\d{4}-\d{2}-\d{2}$/
const MAX_WINDOW_DAYS = 31
const MAX_YEARS = 6

interface OpenMeteoArchiveResponse {
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    wind_speed_10m_max: number[]
    wind_gusts_10m_max: number[]
    wind_direction_10m_dominant: number[]
  }
}

interface HistoryDay {
  dayOffset: number
  date: string
  windMaxKn: number
  gustMaxKn: number
  directionDeg: number
  tempMaxC: number
  tempMinC: number
  weatherCode: number
}

interface HistoryYearSeries {
  year: number
  days: HistoryDay[]
}

interface HistoryAggregate {
  dayOffset: number
  date: string // labelled with the current-window date
  meanWindMaxKn: number | null
  p25WindMaxKn: number | null
  p75WindMaxKn: number | null
  meanGustMaxKn: number | null
}

function shiftYear(iso: string, deltaYears: number): string {
  const [y, m, d] = iso.split('-')
  return `${Number(y) + deltaYears}-${m}-${d}`
}

function dayOffset(iso: string, anchor: string): number {
  const ms = new Date(iso).getTime() - new Date(anchor).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null
  const idx = (sorted.length - 1) * q
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]!
  const t = idx - lo
  return sorted[lo]! * (1 - t) + sorted[hi]! * t
}

function mean(values: number[]): number | null {
  if (!values.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

    const q = getQuery(event)
    const from = typeof q.from === 'string' ? q.from : ''
    const to = typeof q.to === 'string' ? q.to : ''
    if (!dateOnly.test(from) || !dateOnly.test(to)) {
      throw createError({ statusCode: 400, statusMessage: 'from and to must be YYYY-MM-DD' })
    }
    if (to < from) {
      throw createError({ statusCode: 400, statusMessage: 'to must be on or after from' })
    }

    const windowDays = dayOffset(to, from) + 1
    if (windowDays > MAX_WINDOW_DAYS) {
      throw createError({
        statusCode: 400,
        statusMessage: `Window too long (${windowDays} days, max ${MAX_WINDOW_DAYS})`,
      })
    }

    const requestedYears = Number(q.years)
    const years =
      Number.isFinite(requestedYears) && requestedYears > 0 && requestedYears <= MAX_YEARS
        ? Math.floor(requestedYears)
        : 4

    const centre = await fetchCentreBySlug(event, slug)
    if (!centre) throw createError({ statusCode: 404, statusMessage: 'Centre not found' })
    if (centre.latitude === null || centre.longitude === null) {
      throw createError({
        statusCode: 404,
        statusMessage: `Coordinates not configured for centre "${slug}"`,
      })
    }
    const tz = centre.timezone || 'UTC'

    // Fetch each year in parallel
    const fetches = Array.from({ length: years }, (_, i) => {
      const delta = -(i + 1)
      const yearFrom = shiftYear(from, delta)
      const yearTo = shiftYear(to, delta)
      const params = new URLSearchParams({
        latitude: String(centre.latitude),
        longitude: String(centre.longitude),
        timezone: tz,
        wind_speed_unit: 'kn',
        start_date: yearFrom,
        end_date: yearTo,
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant',
      })
      return $fetch<OpenMeteoArchiveResponse>(`${ARCHIVE_BASE}?${params.toString()}`)
        .then((data) => ({
          year: new Date(yearFrom).getUTCFullYear(),
          anchor: yearFrom,
          data,
        }))
        .catch(() => null) // years missing data are dropped
    })
    const settled = (await Promise.all(fetches)).filter(
      (s): s is { year: number; anchor: string; data: OpenMeteoArchiveResponse } => s !== null,
    )

    // Build series, oldest year first.
    settled.sort((a, b) => a.year - b.year)
    const series: HistoryYearSeries[] = settled.map(({ year, anchor, data }) => {
      const days: HistoryDay[] = []
      for (let i = 0; i < data.daily.time.length; i++) {
        const date = data.daily.time[i]!
        days.push({
          dayOffset: dayOffset(date, anchor),
          date,
          windMaxKn: data.daily.wind_speed_10m_max[i] ?? NaN,
          gustMaxKn: data.daily.wind_gusts_10m_max[i] ?? NaN,
          directionDeg: data.daily.wind_direction_10m_dominant[i] ?? NaN,
          tempMaxC: data.daily.temperature_2m_max[i] ?? NaN,
          tempMinC: data.daily.temperature_2m_min[i] ?? NaN,
          weatherCode: data.daily.weather_code[i] ?? NaN,
        })
      }
      return { year, days }
    })

    // Aggregate per day-offset across years.
    const aggregate: HistoryAggregate[] = []
    for (let off = 0; off < windowDays; off++) {
      const winds: number[] = []
      const gusts: number[] = []
      for (const s of series) {
        const day = s.days.find((d) => d.dayOffset === off)
        if (day && Number.isFinite(day.windMaxKn)) winds.push(day.windMaxKn)
        if (day && Number.isFinite(day.gustMaxKn)) gusts.push(day.gustMaxKn)
      }
      const sortedW = [...winds].sort((a, b) => a - b)
      const sortedG = [...gusts].sort((a, b) => a - b)
      aggregate.push({
        dayOffset: off,
        date: shiftYear(from, 0).replace(
          /^(\d{4})-(\d{2})-(\d{2})$/,
          (_, y, m, d) => {
            const dt = new Date(`${y}-${m}-${d}T00:00:00Z`)
            dt.setUTCDate(dt.getUTCDate() + off)
            return dt.toISOString().slice(0, 10)
          },
        ),
        meanWindMaxKn: mean(winds),
        p25WindMaxKn: quantile(sortedW, 0.25),
        p75WindMaxKn: quantile(sortedW, 0.75),
        meanGustMaxKn: mean(gusts),
      })
    }

    return {
      centre: { slug, lat: centre.latitude, lon: centre.longitude, tz },
      window: { from, to, days: windowDays },
      series,
      aggregate,
    }
  },
  { maxAge: 86400, swr: true, name: 'conditions-history' },
)
