import { test, expect, type APIRequestContext } from '@playwright/test'
import { applyAuthCookie, requireAuthCookie } from './helpers/auth'

function cookieHeader() {
  return { Cookie: `session=${requireAuthCookie()}` }
}

async function createTestQr(request: APIRequestContext, title: string) {
  const response = await request.post('/api/qr', {
    headers: cookieHeader(),
    data: {
      title,
      destinationUrl: `https://example.com/${title}`,
      type: 'dynamic',
      visibility: 'private',
    },
  })

  expect(response.ok(), 'Failed to create QR test data').toBeTruthy()
  const payload = await response.json() as { data: { id: string } }
  return payload.data.id
}

async function deleteTestQr(request: APIRequestContext, id: string) {
  await request.delete(`/api/qr/${id}`, {
    headers: cookieHeader(),
  })
}

test.describe('Toast Undo — QR delete', () => {
  test.beforeEach(async ({ context }) => {
    await applyAuthCookie(context)
  })

  test('deletes QR, shows Undo and restores item count', async ({ page, request }) => {
    const title = `e2e-undo-${Date.now()}`
    const qrId = await createTestQr(request, title)

    try {
      await page.goto('/qr')
      await expect(page).toHaveURL(/\/qr/)

      const rowByTitle = page.locator('tr', { has: page.getByRole('link', { name: title, exact: true }) })
      await expect(rowByTitle).toHaveCount(1)

      const moreActionsButton = page.getByRole('button', {
        name: new RegExp(`Открыть дополнительные действия для QR-кода ${title}`),
      })
      await expect(moreActionsButton).toBeVisible()
      await moreActionsButton.click()

      await page.getByRole('menuitem', { name: 'Удалить' }).click()

      await expect(rowByTitle).toHaveCount(0)

      const undoButton = page.getByRole('button', { name: /отменить|undo/i })
      await expect(undoButton).toBeVisible()
      await undoButton.click()

      await expect(rowByTitle).toHaveCount(1)
    }
    finally {
      await deleteTestQr(request, qrId)
    }
  })
})
