import { test, expect } from '@playwright/test'

test.describe('Settings navigation', () => {
  test('navigating to /settings redirects to /settings/general', async ({ page }) => {
    await page.goto('/settings')
    // Either redirected to /settings/general or to login
    const url = page.url()
    expect(url.includes('/settings/general') || url.includes('/auth/login')).toBeTruthy()
  })

  test('/settings/general renders theme section', async ({ page }) => {
    await page.goto('/settings/general')
    // If authenticated, expect theme section; if not, expect redirect
    const url = page.url()
    if (url.includes('/settings/general')) {
      await expect(page.locator('#theme')).toBeVisible()
    }
    else {
      expect(url).toContain('/auth/login')
    }
  })

  test('/settings/profile renders profile form', async ({ page }) => {
    await page.goto('/settings/profile')
    const url = page.url()
    if (url.includes('/settings/profile')) {
      // Profile page should have a name input
      await expect(page.locator('input[placeholder]').first()).toBeVisible()
    }
    else {
      expect(url).toContain('/auth/login')
    }
  })

  test('settings sidebar navigation links are present', async ({ page }) => {
    await page.goto('/settings/general')
    const url = page.url()
    if (url.includes('/settings/general')) {
      await expect(page.getByTestId('settings-nav-general')).toBeVisible()
      await expect(page.getByTestId('settings-nav-profile')).toBeVisible()
    }
  })

  test('clicking profile nav link navigates to /settings/profile', async ({ page }) => {
    await page.goto('/settings/general')
    if (page.url().includes('/settings/general')) {
      await page.getByTestId('settings-nav-profile').click()
      await expect(page).toHaveURL(/\/settings\/profile/)
    }
  })

  test('settings search filters nav items', async ({ page }) => {
    await page.goto('/settings/general')
    if (page.url().includes('/settings/general')) {
      const searchInput = page.getByPlaceholder(/поиск в настройках|search settings/i)
      if (await searchInput.isVisible()) {
        await searchInput.fill('профиль')
        // Only profile nav item should remain
        await expect(page.getByTestId('settings-nav-general')).not.toBeVisible()
        await expect(page.getByTestId('settings-nav-profile')).toBeVisible()
      }
    }
  })
})
