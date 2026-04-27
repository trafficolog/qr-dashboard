import { test, expect } from '@playwright/test'
import { applyAuthCookie, hasAuthCookie } from './helpers/auth'

test.describe('Global Search (Cmd+K)', () => {
  test.beforeEach(async ({ context, page }) => {
    if (!hasAuthCookie()) {
      test.skip()
    }

    await applyAuthCookie(context)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('opens modal by shortcut, finds settings result and navigates by Enter', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+k')

    const input = page.getByTestId('global-search-input')
    await expect(input).toBeVisible()

    await input.fill('Настройки — Профиль')
    const settingsResult = page.getByText('Настройки — Профиль', { exact: true })
    await expect(settingsResult).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/settings\/profile/)
  })

  test('search trigger button is visible in header', async ({ page }) => {
    await expect(page.getByTestId('header-search-trigger')).toBeVisible()
  })
})
