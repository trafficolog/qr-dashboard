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
    await page.goto(path)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
}
