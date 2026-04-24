import { expect, test, type BrowserContext } from '@playwright/test'

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

test.describe('Departments delete API', () => {
  test.beforeEach(async ({ context }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }

    await setSessionCookie(context, process.env.PLAYWRIGHT_AUTH_COOKIE!)
  })

  test('deleting department reassigns bound department QR to private', async ({ request }) => {
    const uniq = `${Date.now()}-${Math.floor(Math.random() * 10000)}`

    const departmentResponse = await request.post('/api/admin/departments', {
      data: {
        name: `Delete Policy ${uniq}`,
        slug: `delete-policy-${uniq}`,
      },
    })
    expect(departmentResponse.ok()).toBeTruthy()
    const departmentPayload = await departmentResponse.json() as { data: { id: string } }
    const departmentId = departmentPayload.data.id

    const qrResponse = await request.post('/api/qr', {
      data: {
        title: `Department QR ${uniq}`,
        destinationUrl: 'https://example.com/delete-policy',
        visibility: 'department',
        departmentId,
      },
    })
    expect(qrResponse.ok()).toBeTruthy()
    const qrPayload = await qrResponse.json() as { data: { id: string } }
    const qrId = qrPayload.data.id

    const deleteResponse = await request.delete(`/api/admin/departments/${departmentId}`)
    expect(deleteResponse.ok()).toBeTruthy()

    const qrAfterDeleteResponse = await request.get(`/api/qr/${qrId}`)
    expect(qrAfterDeleteResponse.ok()).toBeTruthy()
    const qrAfterDeletePayload = await qrAfterDeleteResponse.json() as {
      data: { visibility: string, departmentId: string | null }
    }

    expect(qrAfterDeletePayload.data.visibility).toBe('private')
    expect(qrAfterDeletePayload.data.departmentId).toBeNull()
  })
})
