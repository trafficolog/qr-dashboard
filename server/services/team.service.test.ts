import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { sessions } from '../db/schema'
import { teamService } from './team.service'
import type { User } from '#shared/types/auth'

const drizzleMocks = vi.hoisted(() => ({
  eqMock: vi.fn((left, right) => ({ left, right })),
  countMock: vi.fn(() => 'count_expr'),
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: drizzleMocks.eqMock,
    count: drizzleMocks.countMock,
    sql: vi.fn(),
  }
})

const dbMocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  returning: vi.fn(),
  updateWhere: vi.fn(),
  updateSet: vi.fn(),
  update: vi.fn(),
  deleteWhere: vi.fn(),
  deleteFn: vi.fn(),
}))

dbMocks.updateWhere.mockImplementation(() => ({ returning: dbMocks.returning }))
dbMocks.updateSet.mockImplementation(() => ({ where: dbMocks.updateWhere }))
dbMocks.update.mockImplementation(() => ({ set: dbMocks.updateSet }))
dbMocks.deleteFn.mockImplementation(() => ({ where: dbMocks.deleteWhere }))

vi.mock('../db', () => ({
  db: {
    query: {
      users: {
        findFirst: dbMocks.findFirst,
      },
    },
    update: dbMocks.update,
    delete: dbMocks.deleteFn,
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn() })),
    })),
  },
}))

const auditMocks = vi.hoisted(() => ({
  recordAudit: vi.fn(),
}))
vi.mock('../utils/audit', () => ({ recordAudit: auditMocks.recordAudit }))

const originalCreateError = (globalThis as { createError?: unknown }).createError

const adminUser: User = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  name: null,
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('teamService.updateRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as { createError?: (input: { statusCode: number, message: string }) => Error & { statusCode: number } }).createError = ({
      statusCode,
      message,
    }) => Object.assign(new Error(message), { statusCode })
  })

  afterAll(() => {
    ;(globalThis as { createError?: unknown }).createError = originalCreateError
  })

  it('invalidates only target user sessions and writes team.role_change audit event', async () => {
    dbMocks.findFirst.mockResolvedValueOnce({
      id: 'user-2',
      role: 'editor',
      email: 'user-2@example.com',
    })

    dbMocks.returning.mockResolvedValueOnce([
      {
        id: 'user-2',
        role: 'viewer',
      },
    ])

    dbMocks.deleteWhere.mockResolvedValueOnce(undefined)

    const updated = await teamService.updateRole('user-2', 'viewer', adminUser)

    expect(updated.role).toBe('viewer')
    expect(dbMocks.deleteWhere).toHaveBeenCalledTimes(1)

    const deleteCondition = dbMocks.deleteWhere.mock.calls[0]?.[0]
    expect(deleteCondition).toMatchObject({
      left: sessions.userId,
      right: 'user-2',
    })
    expect(deleteCondition?.right).not.toBe(adminUser.id)

    expect(auditMocks.recordAudit).toHaveBeenCalledWith(
      {
        userId: adminUser.id,
        action: 'team.role_change',
        entityType: 'user',
        entityId: 'user-2',
      },
      { details: { oldRole: 'editor', newRole: 'viewer' } },
    )
  })
})
