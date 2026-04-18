import { test, expect } from '@playwright/test'

test.describe('QR API payload validation', () => {
  test.beforeEach(async ({ context }) => {
    if (!process.env.PLAYWRIGHT_AUTH_COOKIE) {
      test.skip()
    }

    await context.addCookies([
      {
        name: 'session',
        value: process.env.PLAYWRIGHT_AUTH_COOKIE!,
        domain: new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001').hostname,
        path: '/',
      },
    ])
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
