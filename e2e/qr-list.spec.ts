import { test, expect } from '@playwright/test'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

test.describe('QR Code List', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
  })

  test('displays QR code list page', async ({ page }) => {
    await page.goto('/qr')
    await expect(page.getByRole('heading', { name: /qr|коды/i })).toBeVisible()
  })

  test('has create QR button', async ({ page }) => {
    await page.goto('/qr')
    await expect(page.getByRole('link', { name: /создать qr|create qr/i })).toBeVisible()
  })

  test('has bulk create button', async ({ page }) => {
    await page.goto('/qr')
    await expect(page.getByRole('link', { name: /массовое|bulk/i })).toBeVisible()
  })
})
