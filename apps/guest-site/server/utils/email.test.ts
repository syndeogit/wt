import { describe, expect, it } from 'vitest'
import type { BookingEmailInput } from './email'
import { renderHtmlBody, renderTextBody } from './email'

const base: BookingEmailInput = {
  to: 'guest@example.com',
  bookingRef: 'WT-KA-20260501-XYZA',
  centreName: 'ION Karpathos',
  centreRegion: 'South Aegean',
  centreCountry: 'Greece',
  productName: 'Wing week — 5 days',
  productDurationLabel: '5 days · coaching + rental',
  arrival: '2026-05-01',
  departure: '2026-05-06',
  amountCents: 78000,
  currency: 'EUR',
  firstName: 'Andy',
  lastName: 'Test',
  hotelName: null,
  hotelNightlyCents: null,
  hotelTotalCents: null,
  addOns: [],
}

describe('renderTextBody', () => {
  it('snapshot — no extras', () => {
    expect(renderTextBody(base)).toMatchSnapshot()
  })

  it('snapshot — hotel only', () => {
    expect(renderTextBody({
      ...base,
      hotelName: 'Karpathos Beach Hotel',
      hotelNightlyCents: 9500,
      hotelTotalCents: 47500,
    })).toMatchSnapshot()
  })

  it('snapshot — add-ons only', () => {
    expect(renderTextBody({
      ...base,
      addOns: [{ name: 'Windsurf kit', perDayCents: 6500, nights: 5, totalCents: 32500 }],
    })).toMatchSnapshot()
  })

  it('snapshot — hotel + add-ons', () => {
    expect(renderTextBody({
      ...base,
      hotelName: 'Karpathos Beach Hotel',
      hotelNightlyCents: 9500,
      hotelTotalCents: 47500,
      addOns: [{ name: 'Windsurf kit', perDayCents: 6500, nights: 5, totalCents: 32500 }],
    })).toMatchSnapshot()
  })
})

describe('renderHtmlBody', () => {
  it('snapshot — hotel + add-ons', () => {
    expect(renderHtmlBody({
      ...base,
      hotelName: 'Karpathos Beach Hotel',
      hotelNightlyCents: 9500,
      hotelTotalCents: 47500,
      addOns: [{ name: 'Windsurf kit', perDayCents: 6500, nights: 5, totalCents: 32500 }],
    })).toMatchSnapshot()
  })
})
