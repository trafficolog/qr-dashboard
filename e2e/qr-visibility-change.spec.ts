import { test, expect, type BrowserContext } from '@playwright/test'

const baseHost = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001').hostname

async function setSessionCookie(context: BrowserContext, token: string) {
  await context.addCookies([
    {
      name: 'session',
      value: token,
      domain: baseHost,
      path: '/',
    },
  ])
}

test.describe('QR visibility change', () => {
  test.beforeEach(async ({ context }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }

    await setSessionCookie(context, process.env.PLAYWRIGHT_AUTH_COOKIE!)
  })

  test('updates private QR to department visibility with departmentId', async ({ request }) => {
    const departmentsResponse = await request.get('/api/departments/my')
    expect(departmentsResponse.ok()).toBeTruthy()
    const departmentsPayload = await departmentsResponse.json() as { data: Array<{ id: string, name: string }> }
    if (departmentsPayload.data.length === 0) {
      test.skip()
    }

    const listResponse = await request.get('/api/qr?scope=mine&visibility=private&limit=100')
    expect(listResponse.ok()).toBeTruthy()
    const listPayload = await listResponse.json() as { data: Array<{ id: string }> }
    if (listPayload.data.length === 0) {
      test.skip()
    }

    const targetQrId = listPayload.data[0]!.id
    const targetDepartmentId = departmentsPayload.data[0]!.id

    const updateResponse = await request.put(`/api/qr/${targetQrId}`, {
      data: {
        visibility: 'department',
        departmentId: targetDepartmentId,
      },
    })
    expect(updateResponse.ok()).toBeTruthy()

    const updatePayload = await updateResponse.json() as { data: { visibility: string, departmentId: string | null } }
    expect(updatePayload.data.visibility).toBe('department')
    expect(updatePayload.data.departmentId).toBe(targetDepartmentId)
  })
})
