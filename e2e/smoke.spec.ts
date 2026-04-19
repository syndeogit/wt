import { expect, test } from '@playwright/test'

test('guest site serves the welcome page', async ({ page }) => {
  await page.goto('/')
  const html = await page.content()
  expect(html.length).toBeGreaterThan(0)
})
