import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { folderService } from './folder.service'
import type { User } from '~/shared/types/auth'

const dbMocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  returning: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}))

dbMocks.where.mockImplementation(() => ({ returning: dbMocks.returning }))
dbMocks.set.mockImplementation(() => ({ where: dbMocks.where }))
dbMocks.update.mockImplementation(() => ({ set: dbMocks.set }))

vi.mock('../db', () => ({
  db: {
    query: {
      folders: {
        findFirst: dbMocks.findFirst,
      },
    },
    update: dbMocks.update,
  },
}))

const originalCreateError = (globalThis as { createError?: unknown }).createError

const user: User = {
  id: 'user-1',
  email: 'user-1@example.com',
  role: 'editor',
  name: null,
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('folderService.update parent cycle validation', () => {
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

  it('returns 422 when parentId equals folder id', async () => {
    dbMocks.findFirst.mockResolvedValueOnce({
      id: 'folder-1',
      createdBy: user.id,
      parentId: null,
    })

    await expect(
      folderService.update('folder-1', { parentId: 'folder-1' }, user),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'Нельзя сделать папку дочерней самой себе',
    })
  })

  it('returns 422 when new parent chain contains current folder id', async () => {
    dbMocks.findFirst
      .mockResolvedValueOnce({
        id: 'folder-1',
        createdBy: user.id,
        parentId: null,
      })
      .mockResolvedValueOnce({
        id: 'folder-2',
        createdBy: user.id,
        parentId: 'folder-3',
      })
      .mockResolvedValueOnce({
        id: 'folder-3',
        createdBy: user.id,
        parentId: 'folder-1',
      })

    await expect(
      folderService.update('folder-1', { parentId: 'folder-2' }, user),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'Нельзя переместить папку в собственную вложенную папку (обнаружен цикл)',
    })
  })
})
