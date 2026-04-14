import { test, expect } from '@playwright/test'
 
// These tests assume a logged-in session via storageState or cookie fixture.
// In CI, set PLAYWRIGHT_AUTH_COOKIE to a valid session token.
test.describe('QR Code List', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no auth cookie is provided — mark as skipped rather than fail
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