import { expect, test } from '@playwright/test'

test.describe('A11y keyboard smoke', () => {
  test('login page exposes theme toggle to keyboard navigation', async ({ page }) => {
    await page.goto('/auth/login')

    const themeToggle = page.getByRole('button', { name: /тема|theme/i })
    await expect(themeToggle).toBeVisible()

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
      if (await themeToggle.evaluate(el => el === document.activeElement)) {
        break
      }
    }

    await expect(themeToggle).toBeFocused()
  })

  test('login email input is keyboard-focusable', async ({ page }) => {
    await page.goto('/auth/login')

    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      if (await emailInput.evaluate(el => el === document.activeElement)) {
        break
      }
    }

    await expect(emailInput).toBeFocused()
  })
})
