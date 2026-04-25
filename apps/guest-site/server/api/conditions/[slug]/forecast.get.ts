// GET /api/conditions/[slug]/forecast?days=14 — multi-day daily forecast.
// Backed by Open-Meteo. 10-minute SWR cache. Caps at 16 days (Open-Meteo's limit).

interface OpenMeteoDailyResponse {
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    wind_speed_10m_max: number[]
    wind_gusts_10m_max: number[]
    wind_direction_10m_dominant: number[]
    sunrise: string[]
    sunset: string[]
  }
}

export interface ForecastDay {
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

export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

    const q = getQuery(event)
    const requested = Number(q.days)
    const days =
      Number.isFinite(requested) && requested > 0 && requested <= 16
        ? Math.floor(requested)
        : 14

    const centre = await fetchCentreBySlug(event, slug)
    if (!centre) throw createError({ statusCode: 404, statusMessage: 'Centre not found' })
    if (centre.latitude === null || centre.longitude === null) {
      throw createError({
        statusCode: 404,
        statusMessage: `Coordinates not configured for centre "${slug}"`,
      })
    }
    const tz = centre.timezone || 'UTC'

    const base = useRuntimeConfig(event).public.openMeteoBase as string
    const params = new URLSearchParams({
      latitude: String(centre.latitude),
      longitude: String(centre.longitude),
      timezone: tz,
      wind_speed_unit: 'kn',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunrise,sunset',
      forecast_days: String(days),
    })

    const data = await $fetch<OpenMeteoDailyResponse>(`${base}/forecast?${params.toString()}`)

    const out: ForecastDay[] = []
    for (let i = 0; i < data.daily.time.length; i++) {
      out.push({
        date: data.daily.time[i]!,
        weatherCode: data.daily.weather_code[i]!,
        tempMaxC: data.daily.temperature_2m_max[i]!,
        tempMinC: data.daily.temperature_2m_min[i]!,
        windMaxKn: data.daily.wind_speed_10m_max[i]!,
        gustMaxKn: data.daily.wind_gusts_10m_max[i]!,
        directionDeg: data.daily.wind_direction_10m_dominant[i]!,
        sunrise: data.daily.sunrise[i]!,
        sunset: data.daily.sunset[i]!,
      })
    }

    return {
      centre: { slug, lat: centre.latitude, lon: centre.longitude, tz },
      days: out,
    }
  },
  { maxAge: 600, swr: true, name: 'conditions-forecast' },
)
