import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to /auth/login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('login page renders email input and submit button', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /получить код|get code/i })).toBeVisible()
  })

  test('shows error for invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill('not-an-email')
    await page.getByRole('button', { name: /получить код|get code/i }).click()
    // Expect an inline error or the form not to advance
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('redirects to /auth/login when session cookie is invalidated', async ({ page, context }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

    await context.addCookies([
      {
        name: 'session_token',
        value: 'invalid-or-revoked-token',
        url: baseUrl,
        path: '/',
      },
    ])

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
