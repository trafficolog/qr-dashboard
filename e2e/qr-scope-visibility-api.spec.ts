import { test, expect, type APIRequestContext } from '@playwright/test'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

async function getCurrentUserId(request: APIRequestContext) {
  const me = await request.get('/api/auth/me')
  expect(me.ok()).toBeTruthy()
  const payload = await me.json() as { data?: { id?: string } }
  expect(payload.data?.id).toBeTruthy()
  return payload.data!.id!
}

test.describe('QR API scope visibility', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
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
    const adminContext = await browser.newContext()
    await applyAuthCookie(adminContext, { role: 'admin' })
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
