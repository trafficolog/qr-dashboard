import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '~~/types/auth'

vi.mock('../db', () => {
  const findFirst = vi.fn()
  const returning = vi.fn()
  const where = vi.fn(() => ({ returning }))
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))

  return {
    db: {
      query: {
        folders: {
          findFirst,
        },
      },
      update,
    },
    __mocks: {
      findFirst,
      update,
      set,
      where,
      returning,
    },
  }
})

import { folderService } from './folder.service'
import { __mocks } from '../db'

;(globalThis as { createError?: (input: { statusCode: number, message: string }) => Error & { statusCode: number } }).createError = ({
  statusCode,
  message,
}) => Object.assign(new Error(message), { statusCode })

const user: User = {
  id: 'user-1',
  email: 'user-1@example.com',
  role: 'editor',
}

describe('folderService.update parent cycle validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 422 when parentId equals folder id', async () => {
    __mocks.findFirst.mockResolvedValueOnce({
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
    __mocks.findFirst
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
