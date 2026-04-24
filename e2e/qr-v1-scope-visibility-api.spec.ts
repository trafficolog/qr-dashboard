import { test, expect, type BrowserContext } from '@playwright/test'

const baseHost = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001').hostname
const foreignDepartmentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

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

test.describe('QR API v1 scope visibility', () => {
  test.beforeEach(async ({ context }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }

    await setSessionCookie(context, process.env.PLAYWRIGHT_AUTH_COOKIE!)
  })

  test('scope=public returns only public QRs', async ({ request }) => {
    const response = await request.get('/api/v1/qr?scope=public&limit=100')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json() as { data: Array<{ visibility: string }> }
    for (const item of payload.data) {
      expect(item.visibility).toBe('public')
    }
  })

  test('scope=department + department_id enforces ACL and returns only requested department', async ({ request }) => {
    const departmentsResponse = await request.get('/api/departments/my')
    expect(departmentsResponse.ok()).toBeTruthy()

    const departmentsPayload = await departmentsResponse.json() as {
      data: Array<{ id: string }>
    }

    const ownDepartmentId = departmentsPayload.data[0]?.id
    if (!ownDepartmentId) {
      test.skip()
      return
    }

    const allowedResponse = await request.get(`/api/v1/qr?scope=department&department_id=${ownDepartmentId}&limit=100`)
    expect(allowedResponse.ok()).toBeTruthy()

    const allowedPayload = await allowedResponse.json() as {
      data: Array<{ visibility: string, departmentId: string | null }>
    }

    for (const item of allowedPayload.data) {
      expect(item.visibility).toBe('department')
      expect(item.departmentId).toBe(ownDepartmentId)
    }

    const deniedResponse = await request.get(`/api/v1/qr?scope=department&department_id=${foreignDepartmentId}&limit=100`)
    expect(deniedResponse.ok()).toBeTruthy()

    const deniedPayload = await deniedResponse.json() as { data: Array<unknown> }
    expect(deniedPayload.data).toEqual([])
  })

  test('non-admin scope=all returns empty result set', async ({ request }) => {
    const response = await request.get('/api/v1/qr?scope=all&limit=100')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json() as { data: Array<unknown>, meta?: { total?: number } }
    expect(payload.data).toEqual([])
    expect(payload.meta?.total).toBe(0)
  })
})
