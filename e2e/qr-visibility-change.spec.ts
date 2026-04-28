import { test, expect } from '@playwright/test'
import { applyAuthCookie, isAuthBootstrapAvailable } from './helpers/auth'

test.describe('QR visibility change', () => {
  test.beforeEach(async ({ context }) => {
    if (!isAuthBootstrapAvailable()) {
      test.skip()
    }

    await applyAuthCookie(context)
  })

  test('updates private QR to department visibility with departmentId', async ({ request }) => {
    const departmentsResponse = await request.get('/api/departments/my')
    expect(departmentsResponse.ok()).toBeTruthy()
    const departmentsPayload = await departmentsResponse.json() as { data: Array<{ id: string, name: string }> }
    if (departmentsPayload.data.length === 0) {
      test.skip()
      return
    }

    const listResponse = await request.get('/api/qr?scope=mine&visibility=private&limit=100')
    expect(listResponse.ok()).toBeTruthy()
    const listPayload = await listResponse.json() as { data: Array<{ id: string }> }
    if (listPayload.data.length === 0) {
      test.skip()
      return
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
