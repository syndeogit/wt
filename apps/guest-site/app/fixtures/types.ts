// Fixture types. Mirrors the eventual Supabase schema shape — when we
// replace fixtures with real queries these types stay put.

export type UUID = string
export type ISODate = string
export type Currency = 'EUR'

export interface Centre {
  id: UUID
  slug: string
  name: string
  tagline: string
  description: string
  country: string
  region: string
  heroImage: string
  gallery: string[]
}

export type ProductKind = 'lesson' | 'rental' | 'package'

export type DisciplineLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Product {
  id: UUID
  centreId: UUID
  kind: ProductKind
  name: string
  summary: string
  description: string
  priceCents: number
  currency: Currency
  durationMinutes: number | null
  durationLabel: string
  minLevel: DisciplineLevel
  image: string
  includes: string[]
}

export interface Hotel {
  id: UUID
  centreId: UUID
  name: string
  summary: string
  image: string
  nightlyFromCents: number
  currency: Currency
}
