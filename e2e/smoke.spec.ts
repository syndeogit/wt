import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('guest site serves the welcome page', async ({ page }) => {
  await page.goto('/')
  const html = await page.content()
  expect(html.length).toBeGreaterThan(0)
})

// Slice H — accessibility audit. Fails the build on any critical or serious
// WCAG 2.1 AA violation across the public guest pages. Admin pages aren't
// covered yet; they live behind auth and don't ship to end-users.
const publicPaths = [
  { path: '/', name: 'home' },
  { path: '/destinations', name: 'destinations' },
  { path: '/karpathos', name: 'karpathos' },
  { path: '/karpathos/conditions', name: 'karpathos/conditions' },
  { path: '/wing', name: 'wing' },
  { path: '/journal', name: 'journal' },
  { path: '/book', name: 'book picker' },
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/forgot-password', name: 'forgot-password' },
]

for (const { path, name } of publicPaths) {
  test(`a11y: ${name} (${path})`, async ({ page }) => {
    await page.goto(path)
    // domcontentloaded — networkidle never settles when third-party widgets
    // (e.g. Facebook embed on /journal) keep polling.
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Third-party embeds (e.g. Facebook Page Plugin on /journal) are not
      // ours to fix; only test our own markup.
      .exclude('iframe')
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    if (critical.length) {
      // eslint-disable-next-line no-console
      console.log(
        `axe ${name}: ${critical.length} serious/critical`,
        critical.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
      )
    }
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
  })
}
