import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

const publicPages = [
  '/auth/login',
  '/not-found',
  '/expired',
]

const privatePages = [
  '/dashboard',
  '/qr',
  '/qr/create',
  '/settings/profile',
  '/analytics',
]

const themes = [
  { name: 'light', colorScheme: 'light' as const },
  { name: 'dark', colorScheme: 'dark' as const },
]

async function expectNoBlockingA11yViolations(page: Page, path: string, colorScheme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme })
  await page.goto(path)
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  const blockingViolations = results.violations.filter((violation) => {
    const isHighImpact = violation.impact === 'serious' || violation.impact === 'critical'
    const isContrastViolation = violation.id === 'color-contrast'
    return isHighImpact || isContrastViolation
  })

  expect(blockingViolations).toEqual([])
}

test.describe('Accessibility smoke (axe)', () => {
  for (const path of publicPages) {
    for (const theme of themes) {
      test(`public ${path} (${theme.name}) has no blocking a11y violations`, async ({ page }) => {
        await expectNoBlockingA11yViolations(page, path, theme.colorScheme)
      })
    }
  }

  for (const path of privatePages) {
    for (const theme of themes) {
      test(`private ${path} (${theme.name}) has no blocking a11y violations`, async ({ page, context }) => {
        if (!isAuthBootstrapAvailable()) {
          test.skip()
        }

        await applyAuthCookie(context)
        await expectNoBlockingA11yViolations(page, path, theme.colorScheme)
      })
    }
  }
})
