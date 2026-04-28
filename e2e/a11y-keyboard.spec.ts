import { expect, test, type Page } from '@playwright/test'

async function openLogin(page: Page) {
  try {
    await page.goto('/auth/login')
  }
  catch {
    await page.goto('/auth/login')
  }
}

test.describe('A11y keyboard smoke', () => {
  test('login page exposes theme toggle to keyboard navigation', async ({ page }) => {
    await openLogin(page)

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
    await openLogin(page)

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

  test('login submit button remains disabled for invalid keyboard-entered email', async ({ page }) => {
    await openLogin(page)

    const emailInput = page.locator('input[type="email"]')
    const submitButton = page.getByRole('button', { name: /получить код|get code/i })

    await expect(emailInput).toBeVisible()
    await emailInput.fill('not-an-email')

    await expect(submitButton).toBeDisabled()
  })
})
