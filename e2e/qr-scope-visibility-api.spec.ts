import { test, expect, type APIRequestContext, type BrowserContext } from '@playwright/test'

const baseHost = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001').hostname

async function setSessionCookie(context: BrowserContext, token: string) {
  await context.addCookies([
    {
      name: 'session_token',
      value: token,
      domain: baseHost,
      path: '/',
    },
  ])
}

async function getCurrentUserId(request: APIRequestContext) {
  const me = await request.get('/api/auth/me')
  expect(me.ok()).toBeTruthy()
  const payload = await me.json() as { data?: { id?: string } }
  expect(payload.data?.id).toBeTruthy()
  return payload.data!.id!
}

test.describe('QR API scope visibility', () => {
  test.beforeEach(async ({ context }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }

    await setSessionCookie(context, process.env.PLAYWRIGHT_AUTH_COOKIE!)
  })

  test('scope=mine returns only my QRs (private scenario)', async ({ request }) => {
    const userId = await getCurrentUserId(request)
    const response = await request.get('/api/qr?scope=mine&limit=100')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json() as { data: Array<{ createdBy: string }> }
    for (const item of payload.data) {
      expect(item.createdBy).toBe(userId)
    }
  })

  test('scope=public returns only public QRs', async ({ request }) => {
    const response = await request.get('/api/qr?scope=public&limit=100')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json() as { data: Array<{ visibility: string }> }
    for (const item of payload.data) {
      expect(item.visibility).toBe('public')
    }
  })

  test('scope=department without departmentId returns department QRs only', async ({ request }) => {
    const response = await request.get('/api/qr?scope=department&limit=100')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json() as { data: Array<{ visibility: string }> }
    for (const item of payload.data) {
      expect(item.visibility).toBe('department')
    }
  })

  test('admin scope=department without departmentId returns department QRs', async ({ browser }) => {
    if (!process.env.PLAYWRIGHT_ADMIN_AUTH_COOKIE) {
      test.skip()
    }

    const adminContext = await browser.newContext()
    await setSessionCookie(adminContext, process.env.PLAYWRIGHT_ADMIN_AUTH_COOKIE!)
    const adminRequest = adminContext.request

    const response = await adminRequest.get('/api/qr?scope=department&limit=100')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json() as { data: Array<{ visibility: string }> }
    for (const item of payload.data) {
      expect(item.visibility).toBe('department')
    }

    await adminContext.close()
  })
})
