import { test, expect } from '@playwright/test'

const baseHost = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001').hostname

test.describe('QR quick actions visibility flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }

    await page.context().addCookies([
      {
        name: 'session_token',
        value: process.env.PLAYWRIGHT_AUTH_COOKIE!,
        domain: baseHost,
        path: '/',
      },
    ])
  })

  test('updates visibility to public and refetches list', async ({ page }) => {
    let listFetchCount = 0
    let visibilityPayload: { visibility?: string } | null = null

    await page.route('**/api/departments/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 'dep-1', name: 'Маркетинг' }],
        }),
      })
    })

    await page.route('**/api/qr/*/visibility', async (route) => {
      visibilityPayload = route.request().postDataJSON() as { visibility?: string }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: 'qr-1', visibility: 'public', departmentId: null } }),
      })
    })

    await page.route('**/api/qr**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      listFetchCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'qr-1',
              shortCode: 'quick-actions',
              title: 'QR Quick Action',
              destinationUrl: 'https://example.com/quick-actions',
              status: 'active',
              totalScans: 12,
              createdAt: '2026-01-01T00:00:00.000Z',
              visibility: listFetchCount >= 2 ? 'public' : 'private',
              departmentId: null,
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      })
    })

    await page.goto('/qr')

    await page.getByLabel('Открыть дополнительные действия для QR-кода QR Quick Action').click()
    await page.getByRole('menuitem', { name: 'Сделать публичным' }).click()

    await expect.poll(() => visibilityPayload?.visibility).toBe('public')
    await expect.poll(() => listFetchCount).toBeGreaterThan(1)
  })

  test('department action is disabled when user has no departments', async ({ page }) => {
    await page.route('**/api/departments/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    })

    await page.route('**/api/qr**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'qr-2',
              shortCode: 'no-deps',
              title: 'QR No Departments',
              destinationUrl: 'https://example.com/no-departments',
              status: 'active',
              totalScans: 5,
              createdAt: '2026-01-01T00:00:00.000Z',
              visibility: 'private',
              departmentId: null,
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      })
    })

    await page.goto('/qr')

    await page.getByLabel('Открыть дополнительные действия для QR-кода QR No Departments').click()
    const shareWithDepartmentAction = page.getByRole('menuitem', { name: 'Поделиться с отделом' })

    await expect(shareWithDepartmentAction).toBeVisible()
    await expect(shareWithDepartmentAction).toHaveAttribute('aria-disabled', 'true')
  })
})
