import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

const pages = [
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

test.describe('Accessibility smoke (axe)', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
  })

  for (const path of pages) {
    for (const theme of themes) {
      test(`${path} (${theme.name}) has no blocking a11y violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme.colorScheme })
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
      })
    }
  }
})
