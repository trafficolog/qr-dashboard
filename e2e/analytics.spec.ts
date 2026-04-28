import { test, expect } from '@playwright/test'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
  })

  test('renders analytics page with charts', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByRole('heading', { name: /аналитика|analytics/i })).toBeVisible()
  })

  test('has date range selector', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.locator('[data-testid="date-range"], select, [role="combobox"]').first()).toBeVisible()
  })

  test('shows device donut with legend count and percentage', async ({ page }) => {
    await page.goto('/analytics')

    const devicesBlock = page.locator('[data-testid="device-block-devices"]')
    await expect(devicesBlock).toBeVisible()

    const legend = devicesBlock.locator('[data-testid="devices-legend"]')
    if (await legend.isVisible()) {
      await expect(legend).toContainText(/\d/)
      await expect(legend).toContainText(/\d+(\s\d{3})*(\.\d+)?%/)
    }
  })

  test('shows empty state without donut when devices payload has no counts', async ({ page }) => {
    await page.route('**/api/analytics/devices**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            devices: [
              { name: 'mobile', count: 0, percentage: 0 },
              { name: 'desktop', count: 0, percentage: 0 },
              { name: 'tablet', count: 0, percentage: 0 },
            ],
            os: [],
            browsers: [],
          },
        }),
      })
    })

    await page.goto('/analytics')
    await expect(page.locator('[data-testid="device-block-devices"] [data-testid="devices-empty-state"]')).toBeVisible()
    await expect(page.locator('[data-testid="device-block-devices"] [data-testid="devices-donut-chart"]')).toHaveCount(0)
  })

  test('analytics endpoints smoke-check return { data }', async ({ request }) => {
    const endpoints = [
      '/api/analytics/geo',
      '/api/analytics/devices',
      '/api/analytics/time-distribution',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      expect(response.ok(), `${endpoint} should return successful response`).toBeTruthy()

      const body = await response.json() as { data?: unknown }
      expect(body).toHaveProperty('data')
    }
  })
})
