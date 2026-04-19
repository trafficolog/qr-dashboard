import { test, expect } from '@playwright/test'
import { applyAuthCookie } from './helpers/auth'

test.describe('Settings navigation', () => {
  test.beforeEach(async ({ context }) => {
    await applyAuthCookie(context)
  })

  test('navigating to /settings redirects to /settings/general', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings\/general/)
    await expect(page.locator('#theme')).toBeVisible()
  })

  test('settings search filters menu and allows navigation via links', async ({ page }) => {
    await page.goto('/settings/general')
    await expect(page).toHaveURL(/\/settings\/general/)

    await expect(page.getByTestId('settings-nav-general')).toBeVisible()
    await expect(page.getByTestId('settings-nav-profile')).toBeVisible()

    const searchInput = page.getByPlaceholder(/поиск в настройках|search settings/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Профиль')

    await expect(page.getByTestId('settings-nav-profile')).toBeVisible()
    await expect(page.getByTestId('settings-nav-general')).toHaveCount(0)

    await page.getByTestId('settings-nav-profile').click()
    await expect(page).toHaveURL(/\/settings\/profile/)
  })
})
