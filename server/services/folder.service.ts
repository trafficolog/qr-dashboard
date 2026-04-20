import { eq, and, count } from 'drizzle-orm'
import { db } from '../db'
import { folders, qrCodes } from '../db/schema'
import { recordAudit } from '../utils/audit'
import type { User } from '~/shared/types/auth'

interface CreateFolderData {
  name: string
  parentId?: string | null
  color?: string | null
}

interface UpdateFolderData {
  name?: string
  parentId?: string | null
  color?: string | null
}

function checkAccess(folder: { createdBy: string }, user: User) {
  if (user.role === 'admin') return
  if (folder.createdBy !== user.id) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этой папке' })
  }
}

async function validateParentAccess(parentId: string | null | undefined, user: User) {
  if (!parentId) return

  const parentFolder = await db.query.folders.findFirst({
    where: eq(folders.id, parentId),
  })

  if (!parentFolder) {
    throw createError({ statusCode: 422, message: 'Родительская папка не найдена' })
  }

  checkAccess(parentFolder, user)
}

async function validateNoParentCycle(folderId: string, parentId: string | null | undefined) {
  if (!parentId) return

  if (parentId === folderId) {
    throw createError({
      statusCode: 422,
      message: 'Нельзя сделать папку дочерней самой себе',
    })
  }

  const visited = new Set<string>()
  let currentParentId: string | null = parentId

  while (currentParentId) {
    if (currentParentId === folderId) {
      throw createError({
        statusCode: 422,
        message: 'Нельзя переместить папку в собственную вложенную папку (обнаружен цикл)',
      })
    }

    if (visited.has(currentParentId)) {
      throw createError({
        statusCode: 422,
        message: 'Обнаружен цикл в цепочке родительских папок',
      })
    }

    visited.add(currentParentId)

    const parentFolder: { parentId: string | null } | undefined = await db.query.folders.findFirst({
      where: eq(folders.id, currentParentId),
      columns: { parentId: true },
    })

    if (!parentFolder) return

    currentParentId = parentFolder.parentId
  }
}

export const folderService = {
  async list(user: User) {
    const baseWhere = user.role === 'admin' ? undefined : eq(folders.createdBy, user.id)

    const rows = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentId: folders.parentId,
        color: folders.color,
        createdBy: folders.createdBy,
        createdAt: folders.createdAt,
        qrCount: count(qrCodes.id),
      })
      .from(folders)
      .leftJoin(qrCodes, eq(qrCodes.folderId, folders.id))
      .where(baseWhere)
      .groupBy(folders.id)
      .orderBy(folders.name)

    return rows
  },

  async getById(id: string, user: User) {
    const folder = await db.query.folders.findFirst({
      where: eq(folders.id, id),
    })

    if (!folder) {
      throw createError({ statusCode: 404, message: 'Папка не найдена' })
    }

    checkAccess(folder, user)
    return folder
  },

  async create(data: CreateFolderData, user: User) {
    await validateParentAccess(data.parentId, user)

    const [folder] = await db
      .insert(folders)
      .values({
        name: data.name,
        parentId: data.parentId,
        color: data.color,
        createdBy: user.id,
      })
      .returning()

    recordAudit(
      {
        userId: user.id,
        action: 'folder.create',
        entityType: 'folder',
        entityId: folder!.id,
      },
      { details: { name: folder!.name, parentId: folder!.parentId } },
    )

    return folder!
  },

  async update(id: string, data: UpdateFolderData, user: User) {
    const existing = await db.query.folders.findFirst({
      where: eq(folders.id, id),
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Папка не найдена' })
    }

    checkAccess(existing, user)

    if (data.parentId !== undefined) {
      await validateNoParentCycle(id, data.parentId)
      await validateParentAccess(data.parentId, user)
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.parentId !== undefined) updateData.parentId = data.parentId
    if (data.color !== undefined) updateData.color = data.color

    const [updated] = await db
      .update(folders)
      .set(updateData)
      .where(eq(folders.id, id))
      .returning()

    recordAudit(
      {
        userId: user.id,
        action: 'folder.update',
        entityType: 'folder',
        entityId: id,
      },
      { details: { changedFields: Object.keys(updateData) } },
    )

    return updated!
  },

  async delete(id: string, user: User) {
    const existing = await db.query.folders.findFirst({
      where: eq(folders.id, id),
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Папка не найдена' })
    }

    checkAccess(existing, user)

    // Re-link direct child folders to the parent of the folder being deleted
    await db
      .update(folders)
      .set({ parentId: existing.parentId })
      .where(eq(folders.parentId, id))

    // Move QR-codes to root (set folderId = null)
    await db
      .update(qrCodes)
      .set({ folderId: null })
      .where(and(eq(qrCodes.folderId, id)))

    await db.delete(folders).where(eq(folders.id, id))

    recordAudit(
      {
        userId: user.id,
        action: 'folder.delete',
        entityType: 'folder',
        entityId: id,
      },
      { details: { name: existing.name, parentId: existing.parentId } },
    )

    return { success: true }
  },
}
