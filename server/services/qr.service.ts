import { eq, and, or, like, inArray, gte, lte, desc, asc, count } from 'drizzle-orm'
import { db } from '../db'
import { qrCodes, qrTags } from '../db/schema'
import { generateShortCode } from '../utils/nanoid'
import type { User } from '~~/types/auth'

// --- Types ---

interface CreateQrData {
  title: string
  destinationUrl: string
  type?: 'dynamic' | 'static'
  description?: string
  style?: Record<string, unknown>
  utmParams?: Record<string, string>
  folderId?: string
  tagIds?: string[]
  expiresAt?: string
}

interface UpdateQrData {
  title?: string
  destinationUrl?: string
  description?: string | null
  status?: 'active' | 'paused' | 'expired' | 'archived'
  style?: Record<string, unknown>
  utmParams?: Record<string, string>
  folderId?: string | null
  tagIds?: string[]
  expiresAt?: string | null
}

interface QrFilters {
  search?: string
  status?: string
  folderId?: string
  tagIds?: string[]
  dateFrom?: string
  dateTo?: string
}

interface QrPagination {
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// --- Helpers ---

function checkAccess(qr: { createdBy: string, visibility?: 'private' | 'department' | 'public' }, user: User) {
  if (user.role === 'admin') return
  if (qr.createdBy === user.id) return
  if (qr.visibility === 'public') return

  throw createError({ statusCode: 403, message: 'Нет доступа к этому QR-коду' })
}

const DEFAULT_STYLE = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  moduleStyle: 'square',
  cornerStyle: 'square',
  errorCorrectionLevel: 'M',
}

// --- Service ---

export const qrService = {
  /**
   * Создание QR-кода с уникальным shortCode
   */
  async createQr(data: CreateQrData, user: User) {
    // Генерация уникального shortCode (retry до 3 раз)
    let shortCode = ''
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = generateShortCode()
      const existing = await db.query.qrCodes.findFirst({
        where: eq(qrCodes.shortCode, candidate),
        columns: { id: true },
      })
      if (!existing) {
        shortCode = candidate
        break
      }
    }

    if (!shortCode) {
      throw createError({
        statusCode: 500,
        message: 'Не удалось сгенерировать уникальный код. Попробуйте ещё раз',
      })
    }

    // Merge styles with defaults
    const style = { ...DEFAULT_STYLE, ...(data.style || {}) }

    // If logo present, force error correction H
    if ((style as Record<string, unknown>).logo) {
      style.errorCorrectionLevel = 'H'
    }

    const [qr] = await db
      .insert(qrCodes)
      .values({
        shortCode,
        title: data.title,
        description: data.description,
        type: data.type || 'dynamic',
        destinationUrl: data.destinationUrl,
        style,
        utmParams: data.utmParams,
        folderId: data.folderId,
        createdBy: user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning()

    // Привязка тегов
    if (data.tagIds?.length && qr) {
      await db.insert(qrTags).values(
        data.tagIds.map(tagId => ({
          qrCodeId: qr.id,
          tagId,
        })),
      )
    }

    // Вернуть с relations
    return this.getQrById(qr!.id, user)
  },

  /**
   * Список QR-кодов с фильтрами, пагинацией, сортировкой
   */
  async getQrList(filters: QrFilters, pagination: QrPagination, user: User) {
    const { page, limit, sortBy, sortOrder } = pagination
    const offset = (page - 1) * limit

    // Build WHERE conditions
    const conditions = []

    // Role-based access: editor sees only own QR
    if (user.role !== 'admin') {
      conditions.push(eq(qrCodes.createdBy, user.id))
    }

    if (filters.status) {
      conditions.push(eq(qrCodes.status, filters.status as 'active' | 'paused' | 'expired' | 'archived'))
    }

    if (filters.folderId) {
      conditions.push(eq(qrCodes.folderId, filters.folderId))
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      conditions.push(
        or(
          like(qrCodes.title, searchTerm),
          like(qrCodes.shortCode, searchTerm),
        )!,
      )
    }

    if (filters.dateFrom) {
      conditions.push(gte(qrCodes.createdAt, new Date(filters.dateFrom)))
    }

    if (filters.dateTo) {
      conditions.push(lte(qrCodes.createdAt, new Date(filters.dateTo)))
    }

    // Tag filter: get QR IDs that have any of the specified tags
    let tagFilterIds: string[] | null = null
    if (filters.tagIds?.length) {
      const taggedQrs = await db
        .select({ qrCodeId: qrTags.qrCodeId })
        .from(qrTags)
        .where(inArray(qrTags.tagId, filters.tagIds))

      tagFilterIds = [...new Set(taggedQrs.map(t => t.qrCodeId))]
      if (tagFilterIds.length === 0) {
        return { data: [], total: 0, page, limit, totalPages: 0 }
      }
      conditions.push(inArray(qrCodes.id, tagFilterIds))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Count total
    const [countResult] = await db
      .select({ count: count() })
      .from(qrCodes)
      .where(whereClause)

    const total = countResult!.count

    // Sort
    const sortColumn = sortBy === 'title'
      ? qrCodes.title
      : sortBy === 'totalScans'
        ? qrCodes.totalScans
        : qrCodes.createdAt

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Fetch
    const data = await db.query.qrCodes.findMany({
      where: whereClause,
      with: {
        folder: { columns: { id: true, name: true, color: true } },
        qrTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: orderFn(sortColumn),
      limit,
      offset,
    })

    // Transform: flatten tags
    const transformed = data.map(qr => ({
      ...qr,
      tags: qr.qrTags.map(qt => qt.tag),
      qrTags: undefined,
    }))

    const totalPages = Math.ceil(total / limit)

    return { data: transformed, total, page, limit, totalPages }
  },

  /**
   * Получить QR по ID с relations
   */
  async getQrById(id: string, user: User) {
    const qr = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id),
      with: {
        folder: { columns: { id: true, name: true, color: true } },
        destinations: true,
        qrTags: {
          with: { tag: true },
        },
      },
    })

    if (!qr) {
      throw createError({ statusCode: 404, message: 'QR-код не найден' })
    }

    checkAccess(qr, user)

    return {
      ...qr,
      tags: qr.qrTags.map(qt => qt.tag),
      qrTags: undefined,
    }
  },

  /**
   * Обновить QR
   */
  async updateQr(id: string, data: UpdateQrData, user: User) {
    const existing = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id),
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'QR-код не найден' })
    }

    checkAccess(existing, user)

    // Static QR: нельзя менять URL
    if (existing.type === 'static' && data.destinationUrl && data.destinationUrl !== existing.destinationUrl) {
      throw createError({
        statusCode: 400,
        message: 'Невозможно изменить URL статического QR-кода',
      })
    }

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (data.title !== undefined) updateData.title = data.title
    if (data.destinationUrl !== undefined) updateData.destinationUrl = data.destinationUrl
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.style !== undefined) updateData.style = data.style
    if (data.utmParams !== undefined) updateData.utmParams = data.utmParams
    if (data.folderId !== undefined) updateData.folderId = data.folderId
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
    }

    await db.update(qrCodes).set(updateData).where(eq(qrCodes.id, id))

    // Инвалидация LRU-кэша
    invalidateQrCache(existing.shortCode)

    // Update tags if provided
    if (data.tagIds !== undefined) {
      await db.delete(qrTags).where(eq(qrTags.qrCodeId, id))
      if (data.tagIds.length > 0) {
        await db.insert(qrTags).values(
          data.tagIds.map(tagId => ({ qrCodeId: id, tagId })),
        )
      }
    }

    return this.getQrById(id, user)
  },

  /**
   * Удалить QR (hard delete, cascade)
   */
  async deleteQr(id: string, user: User) {
    const existing = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id),
      columns: { id: true, createdBy: true, shortCode: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'QR-код не найден' })
    }

    checkAccess(existing, user)

    await db.delete(qrCodes).where(eq(qrCodes.id, id))
    invalidateQrCache(existing.shortCode)
    return { success: true }
  },

  /**
   * Публичные QR-коды компании
   */
  async getSharedQrList() {
    const shared = await db.query.qrCodes.findMany({
      where: eq(qrCodes.visibility, 'public'),
      with: {
        folder: { columns: { id: true, name: true, color: true } },
        qrTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: desc(qrCodes.createdAt),
    })

    return shared.map(qr => ({
      ...qr,
      tags: qr.qrTags.map(qt => qt.tag),
      qrTags: undefined,
    }))
  },

  /**
   * Массовое удаление
   */
  async bulkDeleteQr(ids: string[], user: User) {
    // Проверить доступ ко всем
    const existing = await db.query.qrCodes.findMany({
      where: inArray(qrCodes.id, ids),
      columns: { id: true, createdBy: true },
    })

    if (existing.length !== ids.length) {
      throw createError({
        statusCode: 404,
        message: 'Некоторые QR-коды не найдены',
      })
    }

    for (const qr of existing) {
      checkAccess(qr, user)
    }

    await db.delete(qrCodes).where(inArray(qrCodes.id, ids))
    return { success: true, deleted: ids.length }
  },

  /**
   * Дублирование QR
   */
  async duplicateQr(id: string, user: User) {
    const original = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id),
      with: {
        qrTags: true,
      },
    })

    if (!original) {
      throw createError({ statusCode: 404, message: 'QR-код не найден' })
    }

    checkAccess(original, user)

    // Create copy
    const copyData: CreateQrData = {
      title: `${original.title} (копия)`,
      destinationUrl: original.destinationUrl,
      type: original.type,
      description: original.description || undefined,
      style: original.style as Record<string, unknown>,
      utmParams: original.utmParams as Record<string, string> | undefined,
      folderId: original.folderId || undefined,
      tagIds: original.qrTags.map(qt => qt.tagId),
    }

    return this.createQr(copyData, user)
  },
}
