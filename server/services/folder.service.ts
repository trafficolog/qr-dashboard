import { eq, and, count } from 'drizzle-orm'
import { db } from '../db'
import { folders, qrCodes } from '../db/schema'
import type { User } from '~~/types/auth'

interface CreateFolderData {
  name: string
  parentId?: string
  color?: string
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
    const [folder] = await db
      .insert(folders)
      .values({
        name: data.name,
        parentId: data.parentId,
        color: data.color,
        createdBy: user.id,
      })
      .returning()

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

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.parentId !== undefined) updateData.parentId = data.parentId
    if (data.color !== undefined) updateData.color = data.color

    const [updated] = await db
      .update(folders)
      .set(updateData)
      .where(eq(folders.id, id))
      .returning()

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

    // Move QR-codes to root (set folderId = null)
    await db
      .update(qrCodes)
      .set({ folderId: null })
      .where(and(eq(qrCodes.folderId, id)))

    await db.delete(folders).where(eq(folders.id, id))
    return { success: true }
  },
}
