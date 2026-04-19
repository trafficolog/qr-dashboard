import { eq, and, or, like, inArray, gte, lte, desc, asc, count, type InferInsertModel } from 'drizzle-orm'
import { db } from '../db'
import { qrCodes, qrTags, userDepartments } from '../db/schema'
import { generateShortCode } from '../utils/nanoid'
import { invalidateQrCache } from '../utils/qr-cache'
import { resolveVisibilityAccess } from './qr-visibility-access'
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
  folderId?: string | null
  tagIds?: string[]
  expiresAt?: string
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

interface VisibilityChangeInput {
  visibility?: 'private' | 'public' | 'department'
  departmentId?: string | null
}

interface ResolvedVisibilityChange {
  visibility: 'private' | 'public' | 'department'
  departmentId: string | null
}

// --- Helpers ---

async function ensureEditAccess(qr: QrAccessEntity, user: User) {
  if (!(await canManageQr(qr, user))) {
    throw createError({ statusCode: 403, message: 'Нет прав на редактирование QR-кода' })
  }
}

async function ensureDeleteAccess(qr: QrAccessEntity, user: User) {
  if (!(await canManageQr(qr, user))) {
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

function buildNextVisibilityState(qr: QrAccessEntity, payload: VisibilityChangeInput): ResolvedVisibilityChange {
  const nextVisibility = payload.visibility ?? qr.visibility

  if (payload.visibility && payload.visibility !== 'department' && payload.departmentId === undefined) {
    return {
      visibility: nextVisibility,
      departmentId: null,
    }
  }

  return {
    visibility: nextVisibility,
    departmentId: payload.departmentId !== undefined ? payload.departmentId : qr.departmentId,
  }
}

async function resolveVisibilityChange(
  qr: QrAccessEntity,
  payload: VisibilityChangeInput,
  user: User,
  cache?: MembershipCache,
): Promise<ResolvedVisibilityChange> {
  const next = buildNextVisibilityState(qr, payload)

  ensureVisibilityDepartmentPair(next.visibility, next.departmentId)
  await ensureVisibilityUpdateAccess(qr, user, next.visibility, next.departmentId, cache)

  if (next.visibility === 'department') {
    const membership = await getMembershipWithCache(user, cache)
    if (!next.departmentId || !membership.departmentIds.includes(next.departmentId)) {
      throw createError({ statusCode: 403, message: 'Нет доступа к указанному отделу' })
    }
  }

  return next
}

function ensureVisibilityDepartmentPair(
  visibility: 'private' | 'public' | 'department',
  departmentId: string | null,
) {
  if (visibility === 'department' && !departmentId) {
    throw createError({ statusCode: 400, message: 'Для department visibility требуется departmentId' })
  }

  if (visibility !== 'department' && departmentId) {
    throw createError({ statusCode: 400, message: 'departmentId допустим только для department visibility' })
  }
}

async function getUserDepartmentMembership(userId: string): Promise<DepartmentMembership> {
  const memberships = await db
    .select({
      departmentId: userDepartments.departmentId,
      role: userDepartments.role,
    })
    .from(userDepartments)
    .where(eq(userDepartments.userId, userId))

  return {
    departmentIds: memberships.map(row => row.departmentId),
    headDepartmentIds: memberships.filter(row => row.role === 'head').map(row => row.departmentId),
  }
}

async function getMembershipWithCache(user: User, cache?: MembershipCache): Promise<DepartmentMembership> {
  if (cache?.memberships) {
    return cache.memberships
  }

  const memberships = await getUserDepartmentMembership(user.id)
  if (cache) {
    cache.memberships = memberships
  }

  return memberships
}

async function canManageQr(qr: QrAccessEntity, user: User, cache?: MembershipCache): Promise<boolean> {
  if (user.role === 'admin' || qr.createdBy === user.id) {
    return true
  }

  if (qr.visibility !== 'department' || !qr.departmentId) {
    return false
  }

  const memberships = await getMembershipWithCache(user, cache)
  return memberships.headDepartmentIds.includes(qr.departmentId)
}

async function ensureReadAccess(qr: QrAccessEntity, user: User, cache?: MembershipCache) {
  if (user.role === 'admin' || qr.createdBy === user.id || qr.visibility === 'public') {
    return
  }

  if (qr.visibility === 'department' && qr.departmentId) {
    const memberships = await getMembershipWithCache(user, cache)
    if (memberships.departmentIds.includes(qr.departmentId)) {
      return
    }
  }

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
        destinationUrl: data.destinationUrl,
        style,
        utmParams: data.utmParams,
        folderId: data.folderId ?? null,
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

    if (user.role !== 'admin' || filters.scope) {
      const membership = user.role === 'admin'
        ? { departmentIds: [] }
        : await getUserDepartmentMembership(user.id)

      const access = resolveVisibilityAccess({
        scope: filters.scope,
        userRole: user.role,
        userDepartmentIds: membership.departmentIds,
        requestedDepartmentId: filters.departmentId,
      })

      if (access.denyAll) {
        return { data: [], total: 0, page, limit, totalPages: 0 }
      }

      const accessConditions = []
      if (access.includeMine) {
        accessConditions.push(eq(qrCodes.createdBy, user.id))
      }
      if (access.includePublic) {
        accessConditions.push(eq(qrCodes.visibility, 'public'))
      }
      if (access.allowedDepartmentIds === null) {
        accessConditions.push(eq(qrCodes.visibility, 'department'))
      }
      else if (access.allowedDepartmentIds.length > 0) {
        accessConditions.push(
          and(
            eq(qrCodes.visibility, 'department'),
            inArray(qrCodes.departmentId, access.allowedDepartmentIds),
          ),
        )
      }

      if (accessConditions.length > 0) {
        conditions.push(or(...accessConditions)!)
      }
      else {
        return { data: [], total: 0, page, limit, totalPages: 0 }
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

    await ensureEditAccess(existing, user)
    const shouldUpdateVisibility = data.visibility !== undefined || data.departmentId !== undefined
    const resolvedVisibility = shouldUpdateVisibility
      ? await resolveVisibilityChange(existing, { visibility: data.visibility, departmentId: data.departmentId }, user)
      : null

    // Static QR: нельзя менять URL
    if (existing.type === 'static' && data.destinationUrl && data.destinationUrl !== existing.destinationUrl) {
      throw createError({
        statusCode: 400,
        message: 'Невозможно изменить URL статического QR-кода',
      })
    }

    // Build update object
    const updateData: Partial<InferInsertModel<typeof qrCodes>> = { updatedAt: new Date() }

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
    if (resolvedVisibility) {
      updateData.visibility = resolvedVisibility.visibility
      updateData.departmentId = resolvedVisibility.departmentId
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

  async updateVisibility(id: string, data: VisibilityChangeInput, user: User) {
    const existing = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id),
      columns: { id: true, createdBy: true, visibility: true, departmentId: true, shortCode: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'QR-код не найден' })
    }

    await ensureEditAccess(existing, user)
    const next = await resolveVisibilityChange(existing, data, user)

    await db
      .update(qrCodes)
      .set({
        visibility: next.visibility,
        departmentId: next.departmentId,
        updatedAt: new Date(),
      })
      .where(eq(qrCodes.id, id))

    invalidateQrCache(existing.shortCode)
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

    await ensureDeleteAccess(existing, user)

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
      columns: { id: true, createdBy: true, visibility: true, departmentId: true },
    })

    if (existing.length !== ids.length) {
      throw createError({
        statusCode: 404,
        message: 'Некоторые QR-коды не найдены',
      })
    }

    for (const qr of existing) {
      await ensureDeleteAccess(qr, user)
    }

    await db.delete(qrCodes).where(inArray(qrCodes.id, ids))
    return { success: true, deleted: ids.length }
  },

  async bulkUpdateVisibility(ids: string[], data: VisibilityChangeInput, user: User) {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({
          id: qrCodes.id,
          createdBy: qrCodes.createdBy,
          visibility: qrCodes.visibility,
          departmentId: qrCodes.departmentId,
          shortCode: qrCodes.shortCode,
        })
        .from(qrCodes)
        .where(inArray(qrCodes.id, ids))

      if (existing.length !== ids.length) {
        throw createError({
          statusCode: 404,
          message: 'Некоторые QR-коды не найдены',
        })
      }

      const cache: MembershipCache = {}
      for (const qr of existing) {
        await ensureEditAccess(qr, user)
        await resolveVisibilityChange(qr, data, user, cache)
      }

      const next = await resolveVisibilityChange(existing[0]!, data, user, cache)

      await tx
        .update(qrCodes)
        .set({
          visibility: next.visibility,
          departmentId: next.departmentId,
          updatedAt: new Date(),
        })
        .where(inArray(qrCodes.id, ids))

      for (const qr of existing) {
        invalidateQrCache(qr.shortCode)
      }
    })

    return { success: true, updated: ids.length }
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
