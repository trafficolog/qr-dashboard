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

  test('shows validation state for invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill('not-an-email')

    const submitButton = page.getByRole('button', { name: /получить код|get code/i })
    await expect(submitButton).toBeDisabled()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('redirects to /auth/login when session cookie is invalidated', async ({ page, context }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001'

    await context.addCookies([
      {
        name: 'session_token',
        value: 'invalid-or-revoked-token',
        url: baseUrl,
      },
    ])

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
