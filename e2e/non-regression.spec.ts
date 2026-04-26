// Slice H + Slice N: encode every behavioural anti-pattern from
// docs/mvp-plan.md:114-123 as a Playwright test. Tests are file-anchored to
// stable Directus fixtures or Supabase seed bookings so content drift doesn't
// false-positive.

import { expect, test } from '@playwright/test'

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
