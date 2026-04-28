import { expect, test, type Page } from '@playwright/test'

async function openLogin(page: Page) {
  try {
    await page.goto('/auth/login')
  }
  catch {
    await page.goto('/auth/login')
  }
}

async function focusByTab(page: Page, isTargetFocused: () => Promise<boolean>, maxTabs = 8) {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab')
    if (await isTargetFocused()) {
      return
    }
  }
}

test.describe('A11y keyboard smoke', () => {
  test('login page exposes theme toggle to keyboard navigation', async ({ page }) => {
    await openLogin(page)

    const themeToggle = page.getByRole('button', { name: /тема|theme/i })
    await expect(themeToggle).toBeVisible()

    await focusByTab(page, () => themeToggle.evaluate(el => el === document.activeElement), 3)

    await expect(themeToggle).toBeFocused()
  })

  test('login submit button remains disabled for invalid keyboard-entered email', async ({ page }) => {
    await openLogin(page)

    const emailInput = page.locator('input[type="email"]')
    const submitButton = page.getByRole('button', { name: /получить код|get code/i })

    await expect(emailInput).toBeVisible()
    await emailInput.fill('not-an-email')

    await expect(submitButton).toBeDisabled()
  })

  test('not-found page keeps login CTA keyboard-focusable', async ({ page }) => {
    await page.goto('/not-found')

    const loginButton = page.getByRole('button').nth(1)
    await expect(loginButton).toBeVisible()

    await focusByTab(page, () => loginButton.evaluate(el => el === document.activeElement), 10)
    await expect(loginButton).toBeFocused()
  })

  test('expired page keeps home CTA keyboard-focusable', async ({ page }) => {
    await page.goto('/expired')

    const homeButton = page.getByRole('button', { name: /домой|home/i })
    await expect(homeButton).toBeVisible()

    await focusByTab(page, () => homeButton.evaluate(el => el === document.activeElement), 10)
    await expect(homeButton).toBeFocused()
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
