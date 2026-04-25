// GET /api/conditions/[slug] — current + next-6h conditions for a centre.
// Backed by Open-Meteo (free, no key, rate-limited). Cached 10 minutes.
//
// Coordinates are hardcoded per slug for now; when a real "lat/lng on
// wt_centres" arrives we'll read from Directus instead.

interface CentreCoords {
  lat: number
  lon: number
  tz: string
}

const CENTRE_COORDS: Record<string, CentreCoords> = {
  // ION Karpathos — Devil's Bay / Anemos beach
  karpathos: { lat: 35.61, lon: 27.1, tz: 'Europe/Athens' },
}

interface OpenMeteoResponse {
  current: {
    time: string
    temperature_2m: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
    weather_code: number
  }
  hourly: {
    time: string[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    wind_gusts_10m: number[]
    weather_code: number[]
  }
}

export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
    const coords = CENTRE_COORDS[slug]
    if (!coords) throw createError({ statusCode: 404, statusMessage: 'No coordinates for this centre' })

    const base = useRuntimeConfig(event).public.openMeteoBase as string
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      timezone: coords.tz,
      wind_speed_unit: 'kn',
      current: 'temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code',
      hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code',
      forecast_days: '2',
    })

    const data = await $fetch<OpenMeteoResponse>(`${base}/forecast?${params.toString()}`)

    // Pluck the next 6 hours from the hourly arrays starting at the current hour.
    const nowMs = Date.now()
    const startIdx = data.hourly.time.findIndex((t) => new Date(t).getTime() >= nowMs)
    const next: {
      time: string
      windKn: number
      gustKn: number
      directionDeg: number
      weatherCode: number
    }[] = []
    if (startIdx >= 0) {
      for (let i = startIdx; i < startIdx + 6 && i < data.hourly.time.length; i++) {
        next.push({
          time: data.hourly.time[i]!,
          windKn: data.hourly.wind_speed_10m[i]!,
          gustKn: data.hourly.wind_gusts_10m[i]!,
          directionDeg: data.hourly.wind_direction_10m[i]!,
          weatherCode: data.hourly.weather_code[i]!,
        })
      }
    }

    return {
      centre: { slug, lat: coords.lat, lon: coords.lon, tz: coords.tz },
      current: {
        tempC: data.current.temperature_2m,
        windKn: data.current.wind_speed_10m,
        gustKn: data.current.wind_gusts_10m,
        directionDeg: data.current.wind_direction_10m,
        weatherCode: data.current.weather_code,
        observedAt: data.current.time,
      },
      next,
    }
  },
  { maxAge: 600, swr: true, name: 'conditions' },
)
