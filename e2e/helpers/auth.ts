import { expect, type BrowserContext } from '@playwright/test'

export function requireAuthCookie(): string {
  const cookie = process.env.PLAYWRIGHT_AUTH_COOKIE
  expect(cookie, 'PLAYWRIGHT_AUTH_COOKIE must be set for authenticated e2e scenarios').toBeTruthy()
  return cookie as string
}

export async function applyAuthCookie(context: BrowserContext) {
  const sessionCookie = requireAuthCookie()
  const domain = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001').hostname

  await context.addCookies([
    {
      name: 'session',
      value: sessionCookie,
      domain,
      path: '/',
    },
  ])
}
