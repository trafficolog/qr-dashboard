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

  test('analytics endpoints smoke-check return { data }', async ({ page }) => {
    const endpoints = [
      '/api/analytics/geo',
      '/api/analytics/devices',
      '/api/analytics/time-distribution',
    ]

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint)
      expect(response.ok(), `${endpoint} should return successful response`).toBeTruthy()

      const body = await response.json() as { data?: unknown }
      expect(body).toHaveProperty('data')
    }
  })
})
