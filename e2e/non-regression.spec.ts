// Slice H + Slice N: encode every behavioural anti-pattern from
// docs/mvp-plan.md:114-123 as a Playwright test. Tests are file-anchored to
// stable Directus fixtures or Supabase seed bookings so content drift doesn't
// false-positive.
//
// Some tests require:
//   E2E_TEST_EMAIL + E2E_TEST_PASSWORD env vars (seeded Supabase test user)
//   FIXTURE_PRODUCT_ID below (a Karpathos lesson product UUID from Directus)
//
// To resolve FIXTURE_PRODUCT_ID:
//   curl -s "$NUXT_PUBLIC_DIRECTUS_URL/items/wt_products?filter[centre][slug][_eq]=karpathos&filter[kind][_eq]=lesson&fields=id&limit=1" | jq -r '.data[0].id'

import type { BrowserContext, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const FIXTURE_PRODUCT_ID = process.env.E2E_FIXTURE_PRODUCT_ID ?? ''
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const AUTH_AVAILABLE = Boolean(TEST_EMAIL && TEST_PASSWORD && FIXTURE_PRODUCT_ID)

async function signInTestUser(page: Page, _context: BrowserContext) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test('real-prices-shown — destination page never shows "From €" on product cards', async ({ page }) => {
  await page.goto('/karpathos')
  await page.waitForLoadState('domcontentloaded')

  // Scope assertion to product card price elements only — prose can legitimately
  // say "from €" elsewhere on the page.
  const priceTexts = await page.locator('[data-testid^="product-price"]').allTextContents()
  expect(priceTexts.length, 'expected at least one product card on /karpathos').toBeGreaterThan(0)
  for (const t of priceTexts) {
    expect(t.toLowerCase().trim()).not.toMatch(/^from\s*€/)
  }
})

test('anonymous-browse-allowed — public pages do not redirect to /login', async ({ page }) => {
  for (const path of ['/karpathos', '/karpathos/conditions', '/wing']) {
    await page.goto(path)
    await page.waitForLoadState('domcontentloaded')
    expect(page.url(), `expected ${path} to render anonymously, not redirect`).not.toContain('/login')
    await expect(page.locator('h1').first()).toBeVisible()
  }
})

test('profile-after-selection — /book/[slug] does not ask for personal data', async ({ page }) => {
  await page.goto('/book/karpathos')
  await page.waitForLoadState('domcontentloaded')
  // Should be a date picker page, not a profile form
  await expect(page.locator('input[autocomplete="given-name"]')).toHaveCount(0)
  await expect(page.locator('input[autocomplete="family-name"]')).toHaveCount(0)
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
})

test('url-state-survives-refresh — selections persist on /confirm', async ({ page, context }) => {
  test.skip(!AUTH_AVAILABLE, 'requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD + E2E_FIXTURE_PRODUCT_ID')

  await signInTestUser(page, context)
  await page.goto(`/book/karpathos/confirm?products=${FIXTURE_PRODUCT_ID}&from=2026-06-01&to=2026-06-06`)
  await page.waitForLoadState('domcontentloaded')

  // Pick first non-empty hotel (if any are present)
  const hotelRadios = page.locator('input[name="hotel"]')
  const hotelCount = await hotelRadios.count()
  const targetHotel = hotelCount > 1 ? hotelRadios.nth(1) : null
  if (targetHotel) {
    await targetHotel.check()
  }

  // Pick first add-on (if any are present)
  const addOnCheckbox = page
    .locator('section[aria-labelledby="addons-heading"] input[type="checkbox"]')
    .first()
  const addOnCount = await addOnCheckbox.count()
  if (addOnCount) {
    await addOnCheckbox.check()
  }

  await page.reload()
  await page.waitForLoadState('domcontentloaded')

  if (targetHotel) {
    expect(await page.locator('input[name="hotel"]').nth(1).isChecked()).toBe(true)
  }
  if (addOnCount) {
    expect(
      await page
        .locator('section[aria-labelledby="addons-heading"] input[type="checkbox"]')
        .first()
        .isChecked(),
    ).toBe(true)
  }
})

test('no-pre-selected-upsells — /confirm has no auto-selected hotel/add-on/badge', async ({ page, context }) => {
  test.skip(!AUTH_AVAILABLE, 'requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD + E2E_FIXTURE_PRODUCT_ID')

  await signInTestUser(page, context)
  await page.goto(`/book/karpathos/confirm?products=${FIXTURE_PRODUCT_ID}&from=2026-06-01&to=2026-06-06`)
  await page.waitForLoadState('domcontentloaded')

  // The "I'll sort my own" empty radio is checked by default — that's fine, it's the no-op option.
  // No PAID hotel should be checked.
  const checkedHotelValue = await page.locator('input[name="hotel"]:checked').getAttribute('value')
  expect(checkedHotelValue, 'expected no paid hotel pre-selected').toBe('')

  // No add-on checkbox is checked
  const checkedAddOns = await page
    .locator('section[aria-labelledby="addons-heading"] input[type="checkbox"]:checked')
    .count()
  expect(checkedAddOns).toBe(0)

  // No "For your level" badge auto-renders before profile is set (anonymous test
  // user has no soft profile in this fresh context)
  const badgeCount = await page.locator('[data-testid="badge-level-match"]').count()
  expect(badgeCount).toBe(0)
})
