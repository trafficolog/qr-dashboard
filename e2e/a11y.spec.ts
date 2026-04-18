import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = [
  '/dashboard',
  '/qr',
  '/qr/create',
  '/settings/profile',
  '/analytics',
]

for (const path of pages) {
  test(`${path} has no critical a11y violations`, async ({ page }) => {
    if (process.env.PLAYWRIGHT_AUTH_COOKIE) {
      await page.context().addCookies([
        {
          name: 'session',
          value: process.env.PLAYWRIGHT_AUTH_COOKIE,
          domain: new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001').hostname,
          path: '/',
        },
      ])
    }

    await page.goto(path)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    expect(results.violations).toEqual([])
  })
}
