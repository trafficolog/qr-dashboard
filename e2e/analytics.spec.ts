import { test, expect } from '@playwright/test'
 
test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }
    await page.context().addCookies([
      {
        name: 'session',
        value: process.env.PLAYWRIGHT_AUTH_COOKIE!,
        domain: new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001').hostname,
        path: '/',
      },
    ])
  })
 
  test('renders analytics page with charts', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByRole('heading', { name: /аналитика|analytics/i })).toBeVisible()
  })
 
  test('has date range selector', async ({ page }) => {
    await page.goto('/analytics')
    // Date range control should be present
    await expect(page.locator('[data-testid="date-range"], select, [role="combobox"]').first()).toBeVisible()
  })
})