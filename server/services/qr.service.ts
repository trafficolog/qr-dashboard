import { eq, and, or, like, inArray, gte, lte, desc, asc, count } from 'drizzle-orm'
import { db } from '../db'
import { qrCodes, qrTags, userDepartments } from '../db/schema'
import { generateShortCode } from '../utils/nanoid'
import type { User } from '~~/types/auth'

// --- Types ---

interface CreateQrData {
  title: string
  destinationUrl: string
  type?: 'dynamic' | 'static'
  visibility?: 'private' | 'department' | 'public'
  departmentId?: string | null
  description?: string
  style?: Record<string, unknown>
  utmParams?: Record<string, string>
  folderId?: string
  tagIds?: string[]
  expiresAt?: string
  visibility?: 'private' | 'public' | 'department'
  departmentId?: string | null
}

interface UpdateQrData {
  title?: string
  destinationUrl?: string
  description?: string | null
  status?: 'active' | 'paused' | 'expired' | 'archived'
  visibility?: 'private' | 'department' | 'public'
  departmentId?: string | null
  style?: Record<string, unknown>
  utmParams?: Record<string, string>
  folderId?: string | null
  tagIds?: string[]
  expiresAt?: string | null
  visibility?: 'private' | 'public' | 'department'
  departmentId?: string | null
}

interface QrFilters {
  search?: string
  status?: string
  visibility?: 'private' | 'department' | 'public'
  departmentId?: string
  scope?: 'mine' | 'department' | 'public' | 'all'
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

interface QrAccessEntity {
  createdBy: string
  visibility: 'private' | 'public' | 'department'
  departmentId: string | null
}

interface DepartmentMembership {
  departmentIds: string[]
  headDepartmentIds: string[]
}

interface MembershipCache {
  memberships?: DepartmentMembership
}

// --- Helpers ---

async function getUserDepartmentMembership(userId: string): Promise<DepartmentMembership> {
  const memberships = await db
    .select({ departmentId: userDepartments.departmentId, role: userDepartments.role })
    .from(userDepartments)
    .where(eq(userDepartments.userId, userId))

  return {
    departmentIds: [...new Set(memberships.map(m => m.departmentId))],
    headDepartmentIds: [...new Set(memberships.filter(m => m.role === 'head').map(m => m.departmentId))],
  }
}

async function getMembershipWithCache(user: User, cache?: MembershipCache): Promise<DepartmentMembership> {
  if (cache?.memberships) return cache.memberships

  const memberships = await getUserDepartmentMembership(user.id)
  if (cache) {
    cache.memberships = memberships
  }

  return memberships
}

function ensureVisibilityDepartmentPair(visibility: 'private' | 'public' | 'department', departmentId?: string | null) {
  if (visibility === 'department' && !departmentId) {
    throw createError({ statusCode: 400, message: 'Для visibility=department необходимо указать departmentId' })
  }

  if (visibility !== 'department' && departmentId) {
    throw createError({ statusCode: 400, message: 'departmentId можно указывать только для visibility=department' })
  }
}

function canManageQr(qr: QrAccessEntity, user: User) {
  return user.role === 'admin' || qr.createdBy === user.id
}

async function canReadQr(qr: QrAccessEntity, user: User, cache?: MembershipCache) {
  if (user.role === 'admin') return true
  if (qr.createdBy === user.id) return true
  if (qr.visibility === 'public') return true

  if (qr.visibility === 'department' && qr.departmentId) {
    const memberships = await getMembershipWithCache(user, cache)
    return memberships.departmentIds.includes(qr.departmentId)
  }

  return false
}

async function ensureReadAccess(qr: QrAccessEntity, user: User, cache?: MembershipCache) {
  const allowed = await canReadQr(qr, user, cache)
  if (!allowed) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этому QR-коду' })
  }
}

function ensureEditAccess(qr: QrAccessEntity, user: User) {
  if (!canManageQr(qr, user)) {
    throw createError({ statusCode: 403, message: 'Нет прав на редактирование QR-кода' })
  }
}

function ensureDeleteAccess(qr: QrAccessEntity, user: User) {
  if (!canManageQr(qr, user)) {
    throw createError({ statusCode: 403, message: 'Нет прав на удаление QR-кода' })
  }
}

async function ensureVisibilityUpdateAccess(
  qr: QrAccessEntity,
  user: User,
  nextVisibility: 'private' | 'public' | 'department',
  nextDepartmentId: string | null,
  cache?: MembershipCache,
) {
  if (user.role === 'admin' || qr.createdBy === user.id) {
    return
  }

  if (nextVisibility === qr.visibility && nextDepartmentId === qr.departmentId) {
    return
  }

  const memberships = await getMembershipWithCache(user, cache)

  const isHeadOfCurrentDepartment = qr.departmentId ? memberships.headDepartmentIds.includes(qr.departmentId) : false
  const allowedForHead = qr.visibility === 'department' && (
    (nextVisibility === 'private' && isHeadOfCurrentDepartment)
    || (nextVisibility === 'department' && nextDepartmentId === qr.departmentId && isHeadOfCurrentDepartment)
  )

  if (!allowedForHead) {
    throw createError({ statusCode: 403, message: 'Недостаточно прав для изменения visibility' })
  }
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
    const visibility = data.visibility ?? 'private'
    const departmentId = data.departmentId ?? null

    ensureVisibilityDepartmentPair(visibility, departmentId)

    if (visibility === 'department') {
      const membership = await getUserDepartmentMembership(user.id)
      if (!departmentId || !membership.departmentIds.includes(departmentId)) {
        throw createError({ statusCode: 403, message: 'Нет доступа к указанному отделу' })
      }
    }

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
        visibility: data.visibility || 'private',
        departmentId: data.departmentId ?? null,
        destinationUrl: data.destinationUrl,
        style,
        utmParams: data.utmParams,
        folderId: data.folderId,
        createdBy: user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        visibility,
        departmentId,
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

    if (filters.scope === 'mine') {
      conditions.push(eq(qrCodes.createdBy, user.id))
    }
    else if (filters.scope === 'department') {
      if (filters.departmentId) {
        conditions.push(eq(qrCodes.visibility, 'department'))
        conditions.push(eq(qrCodes.departmentId, filters.departmentId))
      }
      else {
        conditions.push(eq(qrCodes.createdBy, user.id))
      }
    }
    else if (filters.scope === 'public') {
      conditions.push(eq(qrCodes.visibility, 'public'))
    }
    else if (user.role !== 'admin') {
      if (filters.departmentId) {
        conditions.push(
          or(
            eq(qrCodes.createdBy, user.id),
            eq(qrCodes.visibility, 'public'),
            and(
              eq(qrCodes.visibility, 'department'),
              eq(qrCodes.departmentId, filters.departmentId),
            ),
          )!,
        )
      }
      else {
        conditions.push(
          or(
            eq(qrCodes.createdBy, user.id),
            eq(qrCodes.visibility, 'public'),
          )!,
        )
      }
    }

    if (filters.status) {
      conditions.push(eq(qrCodes.status, filters.status as 'active' | 'paused' | 'expired' | 'archived'))
    }

    if (filters.visibility) {
      conditions.push(eq(qrCodes.visibility, filters.visibility))
    }

    if (filters.departmentId) {
      conditions.push(eq(qrCodes.departmentId, filters.departmentId))
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

    await ensureReadAccess(qr, user)

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

    ensureEditAccess(existing, user)

    const nextVisibility = data.visibility ?? existing.visibility
    const nextDepartmentId = data.departmentId !== undefined ? data.departmentId : existing.departmentId

    ensureVisibilityDepartmentPair(nextVisibility, nextDepartmentId)

    await ensureVisibilityUpdateAccess(existing, user, nextVisibility, nextDepartmentId)

    if (nextVisibility === 'department') {
      const membership = await getUserDepartmentMembership(user.id)
      if (!nextDepartmentId || !membership.departmentIds.includes(nextDepartmentId)) {
        throw createError({ statusCode: 403, message: 'Нет доступа к указанному отделу' })
      }
    }

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
    if (data.visibility !== undefined) updateData.visibility = data.visibility
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId
    if (data.style !== undefined) updateData.style = data.style
    if (data.utmParams !== undefined) updateData.utmParams = data.utmParams
    if (data.folderId !== undefined) updateData.folderId = data.folderId
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
    }
    if (data.visibility !== undefined) updateData.visibility = data.visibility
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId

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
      columns: { id: true, createdBy: true, shortCode: true, visibility: true, departmentId: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'QR-код не найден' })
    }

    ensureDeleteAccess(existing, user)

    await db.delete(qrCodes).where(eq(qrCodes.id, id))
    invalidateQrCache(existing.shortCode)
    return { success: true }
  },

  /**
   * Массовое удаление
   */
  async bulkDeleteQr(ids: string[], user: User) {
    // Проверить доступ ко всем
    const existing = await db.query.qrCodes.findMany({
      where: inArray(qrCodes.id, ids),
      columns: { id: true, createdBy: true, visibility: true, departmentId: true },
    })

    if (existing.length !== ids.length) {
      throw createError({
        statusCode: 404,
        message: 'Некоторые QR-коды не найдены',
      })
    }

    for (const qr of existing) {
      ensureDeleteAccess(qr, user)
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

    await ensureReadAccess(original, user)

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
      visibility: original.visibility,
      departmentId: original.departmentId,
    }

    return this.createQr(copyData, user)
  },
}
