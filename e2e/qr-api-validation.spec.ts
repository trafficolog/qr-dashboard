import { test, expect } from '@playwright/test'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

test.describe('QR API payload validation', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
  })

  test('rejects department visibility payload with invalid department_id', async ({ request }) => {
    const response = await request.post('/api/v1/qr', {
      data: {
        title: 'Department QR',
        destination_url: 'https://example.com',
        visibility: 'department',
        department_id: 'not-a-uuid',
      },
    })

    expect(response.status()).toBe(400)
  })
})
