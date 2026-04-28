import { test, expect, type APIRequestContext } from '@playwright/test'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

async function getCurrentUserId(request: APIRequestContext) {
  const meResponse = await request.get('/api/auth/me')
  expect(meResponse.ok()).toBeTruthy()
  const mePayload = await meResponse.json() as { data?: { id?: string } }
  expect(mePayload.data?.id).toBeTruthy()
  return mePayload.data!.id!
}

async function createPrivateQr(request: APIRequestContext, title: string) {
  const createResponse = await request.post('/api/qr', {
    data: {
      title,
      destinationUrl: 'https://example.com/visibility-test',
      visibility: 'private',
    },
  })

  expect(createResponse.ok()).toBeTruthy()
  const payload = await createResponse.json() as { data: { id: string } }
  return payload.data.id
}

test.describe('QR visibility API', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
  })

  test('department visibility without departmentId returns 4xx', async ({ request }) => {
    const qrId = await createPrivateQr(request, 'Visibility: Missing Department')

    const response = await request.patch(`/api/qr/${qrId}/visibility`, {
      data: {
        visibility: 'department',
      },
    })

    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  test('changing visibility to foreign department returns 403', async ({ request }) => {
    const qrId = await createPrivateQr(request, 'Visibility: Foreign Department')

    const response = await request.patch(`/api/qr/${qrId}/visibility`, {
      data: {
        visibility: 'department',
        departmentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
    })

    expect(response.status()).toBe(403)
  })

  test('bulk visibility update is atomic on partial ACL failure', async ({ request }) => {
    const userId = await getCurrentUserId(request)
    const ownQrId = await createPrivateQr(request, 'Visibility: Bulk Atomic')

    const publicListResponse = await request.get('/api/qr?scope=public&limit=100')
    expect(publicListResponse.ok()).toBeTruthy()

    const publicListPayload = await publicListResponse.json() as {
      data: Array<{ id: string, createdBy: string }>
    }

    const foreignPublicQr = publicListPayload.data.find(item => item.createdBy !== userId)
    if (!foreignPublicQr) {
      test.skip()
      return
    }

    const bulkResponse = await request.patch('/api/qr/bulk-visibility', {
      data: {
        ids: [ownQrId, foreignPublicQr.id],
        visibility: 'public',
      },
    })

    expect(bulkResponse.status()).toBe(403)

    const ownQrResponse = await request.get(`/api/qr/${ownQrId}`)
    expect(ownQrResponse.ok()).toBeTruthy()

    const ownQrPayload = await ownQrResponse.json() as { data: { visibility: string } }
    expect(ownQrPayload.data.visibility).toBe('private')
  })
})
