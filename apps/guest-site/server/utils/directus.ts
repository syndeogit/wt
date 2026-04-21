import type { H3Event } from 'h3'
import type { Centre, Hotel, Product } from '~/fixtures/types'

interface DirectusCentre {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  country: string | null
  region: string | null
  hero_image: string | null
  gallery: string[] | null
}

interface DirectusProduct {
  id: string
  centre: string
  kind: Product['kind'] | null
  discipline: Product['discipline'] | null
  name: string
  summary: string | null
  description: string | null
  price_cents: number | null
  currency: string | null
  duration_label: string | null
  min_level: Product['minLevel'] | null
  image: string | null
  includes: string[] | null
}

interface DirectusHotel {
  id: string
  centre: string
  name: string
  summary: string | null
  image: string | null
  nightly_from_cents: number | null
  currency: string | null
}

interface DirectusList<T> {
  data: T[]
}

function directusBase(event: H3Event): string {
  const url = useRuntimeConfig(event).public.directusUrl
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_PUBLIC_DIRECTUS_URL is not configured',
    })
  }
  return url.replace(/\/$/, '')
}

async function directusGet<T>(event: H3Event, path: string): Promise<T> {
  const base = directusBase(event)
  return (await $fetch(`${base}${path}`)) as T
}

function mapCentre(c: DirectusCentre): Centre {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline ?? '',
    description: c.description ?? '',
    country: c.country ?? '',
    region: c.region ?? '',
    heroImage: c.hero_image ?? '',
    gallery: c.gallery ?? [],
  }
}

function mapProduct(p: DirectusProduct): Product {
  return {
    id: p.id,
    centreId: p.centre,
    kind: p.kind ?? 'lesson',
    discipline: p.discipline ?? 'wingfoil',
    name: p.name,
    summary: p.summary ?? '',
    description: p.description ?? '',
    priceCents: p.price_cents ?? 0,
    currency: (p.currency ?? 'EUR') as Product['currency'],
    durationMinutes: null,
    durationLabel: p.duration_label ?? '',
    minLevel: p.min_level ?? 'beginner',
    image: p.image ?? '',
    includes: p.includes ?? [],
  }
}

function mapHotel(h: DirectusHotel): Hotel {
  return {
    id: h.id,
    centreId: h.centre,
    name: h.name,
    summary: h.summary ?? '',
    image: h.image ?? '',
    nightlyFromCents: h.nightly_from_cents ?? 0,
    currency: (h.currency ?? 'EUR') as Hotel['currency'],
  }
}

export async function fetchCentres(event: H3Event): Promise<Centre[]> {
  const res = await directusGet<DirectusList<DirectusCentre>>(
    event,
    '/items/wt_centres?fields=*&sort=sort,name&filter[status][_eq]=published',
  )
  return res.data.map(mapCentre)
}

export async function fetchCentreBySlug(event: H3Event, slug: string): Promise<Centre | null> {
  const res = await directusGet<DirectusList<DirectusCentre>>(
    event,
    `/items/wt_centres?fields=*&filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&limit=1`,
  )
  const first = res.data[0]
  return first ? mapCentre(first) : null
}

export async function fetchProductsByCentreId(event: H3Event, centreId: string): Promise<Product[]> {
  const res = await directusGet<DirectusList<DirectusProduct>>(
    event,
    `/items/wt_products?fields=*&filter[centre][_eq]=${encodeURIComponent(centreId)}&filter[status][_eq]=published&sort=sort,name`,
  )
  return res.data.map(mapProduct)
}

export async function fetchHotelsByCentreId(event: H3Event, centreId: string): Promise<Hotel[]> {
  const res = await directusGet<DirectusList<DirectusHotel>>(
    event,
    `/items/wt_hotels?fields=*&filter[centre][_eq]=${encodeURIComponent(centreId)}&filter[status][_eq]=published&sort=sort,name`,
  )
  return res.data.map(mapHotel)
}
