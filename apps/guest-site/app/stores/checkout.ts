import { defineStore } from 'pinia'
import type { Hotel, ISODate, Product } from '~/fixtures/types'

export type CheckoutStep =
  | 'browsing'
  | 'dates'
  | 'gear'
  | 'accommodation'
  | 'profile'
  | 'payment'
  | 'confirmed'

export interface CheckoutState {
  centreSlug: string | null
  step: CheckoutStep
  checkIn: ISODate | null
  checkOut: ISODate | null
  selectedProducts: Product[]
  selectedAddOnIds: string[]
  selectedHotel: Hotel | null
  riderProfile: {
    firstName: string
    lastName: string
    email: string
    disciplines: string[]
    level: string | null
  } | null
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed'
}

const emptyState = (): CheckoutState => ({
  centreSlug: null,
  step: 'browsing',
  checkIn: null,
  checkOut: null,
  selectedProducts: [],
  selectedAddOnIds: [],
  selectedHotel: null,
  riderProfile: null,
  paymentStatus: 'idle',
})

export const useCheckoutStore = defineStore('checkout', {
  state: emptyState,

  getters: {
    hasSelection: (s) => s.selectedProducts.length > 0,
    subtotalCents: (s) => s.selectedProducts.reduce((sum, p) => sum + p.priceCents, 0),
    productIds: (s) => s.selectedProducts.map((p) => p.id),
  },

  actions: {
    setCentre(slug: string) {
      this.centreSlug = slug
    },

    setDates(checkIn: ISODate | null, checkOut: ISODate | null) {
      this.checkIn = checkIn
      this.checkOut = checkOut
    },

    toggleProduct(product: Product) {
      const i = this.selectedProducts.findIndex((p) => p.id === product.id)
      if (i >= 0) this.selectedProducts.splice(i, 1)
      else this.selectedProducts.push(product)
    },

    selectHotel(hotel: Hotel | null) {
      this.selectedHotel = hotel
    },

    toggleAddOn(id: string) {
      const i = this.selectedAddOnIds.indexOf(id)
      if (i >= 0) this.selectedAddOnIds.splice(i, 1)
      else this.selectedAddOnIds.push(id)
    },

    setRiderProfile(profile: CheckoutState['riderProfile']) {
      this.riderProfile = profile
    },

    advanceTo(step: CheckoutStep) {
      this.step = step
    },

    reset() {
      Object.assign(this, emptyState())
    },

    /**
     * Serialise minimal state to URL query params so refresh preserves booking.
     * Covers centre + dates + product IDs — the rest is derived from API calls.
     */
    toQuery(): Record<string, string> {
      const q: Record<string, string> = {}
      if (this.centreSlug) q.centre = this.centreSlug
      if (this.checkIn) q.from = this.checkIn
      if (this.checkOut) q.to = this.checkOut
      if (this.selectedProducts.length) q.products = this.productIds.join(',')
      if (this.selectedAddOnIds.length) q.addons = this.selectedAddOnIds.join(',')
      if (this.step !== 'browsing') q.step = this.step
      return q
    },

    /**
     * Hydrate from URL query. Products are re-fetched from the API using IDs.
     * Caller is responsible for passing the resolved Product[] back in via
     * setSelectedProductsFromIds once fetched.
     */
    fromQuery(query: Record<string, string | undefined>) {
      if (typeof query.centre === 'string') this.centreSlug = query.centre
      if (typeof query.from === 'string') this.checkIn = query.from
      if (typeof query.to === 'string') this.checkOut = query.to
      if (typeof query.addons === 'string') {
        this.selectedAddOnIds = query.addons.split(',').filter(Boolean)
      }
      if (typeof query.step === 'string') {
        const step = query.step as CheckoutStep
        const valid: CheckoutStep[] = [
          'browsing',
          'dates',
          'gear',
          'accommodation',
          'profile',
          'payment',
          'confirmed',
        ]
        if (valid.includes(step)) this.step = step
      }
    },

    setSelectedProductsFromIds(ids: string[], catalogue: Product[]) {
      this.selectedProducts = ids
        .map((id) => catalogue.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)
    },
  },
})
