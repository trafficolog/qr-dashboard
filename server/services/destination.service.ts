import { eq, and, sum } from 'drizzle-orm'
import { db } from '../db'
import { qrDestinations, qrCodes } from '../db/schema'
import { invalidateQrCache } from '../utils/qr-cache'
import type { User } from '#shared/types/auth'

interface CreateDestinationData {
  url: string
  label?: string
  weight: number
}

interface UpdateDestinationData {
  url?: string
  label?: string | null
  weight?: number
  isActive?: boolean
}

// Ensure owner or admin
async function checkQrAccess(qrCodeId: string, user: User) {
  const qr = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, qrCodeId),
    columns: { id: true, createdBy: true, shortCode: true },
  })

  if (!qr) {
    throw createError({ statusCode: 404, message: 'QR-код не найден' })
  }

  if (user.role !== 'admin' && qr.createdBy !== user.id) {
    throw createError({ statusCode: 403, message: 'Нет доступа' })
  }

  return qr
}

// After any change recalculate and validate total active weight
async function getActiveWeightSum(qrCodeId: string): Promise<number> {
  const rows = await db
    .select({ total: sum(qrDestinations.weight) })
    .from(qrDestinations)
    .where(
      and(
        eq(qrDestinations.qrCodeId, qrCodeId),
        eq(qrDestinations.isActive, true),
      ),
    )
  return Number(rows[0]?.total ?? 0)
}

export const destinationService = {
  async list(qrCodeId: string, user: User) {
    await checkQrAccess(qrCodeId, user)

    const destinations = await db.query.qrDestinations.findMany({
      where: eq(qrDestinations.qrCodeId, qrCodeId),
      orderBy: qrDestinations.createdAt,
    })

    return destinations.map(dest => ({ ...dest, updatedAt: dest.createdAt }))
  },

  async create(qrCodeId: string, data: CreateDestinationData, user: User) {
    const qr = await checkQrAccess(qrCodeId, user)

    // Count existing
    const existing = await db.query.qrDestinations.findMany({
      where: eq(qrDestinations.qrCodeId, qrCodeId),
      columns: { id: true },
    })

    if (existing.length >= 10) {
      throw createError({ statusCode: 400, message: 'Максимум 10 вариантов на один QR-код' })
    }

    const [dest] = await db
      .insert(qrDestinations)
      .values({
        qrCodeId,
        url: data.url,
        label: data.label,
        weight: data.weight,
      })
      .returning()

    invalidateQrCache(qr.shortCode)
    return { ...dest!, updatedAt: dest!.createdAt }
  },

  async update(qrCodeId: string, destId: string, data: UpdateDestinationData, user: User) {
    const qr = await checkQrAccess(qrCodeId, user)

    const existing = await db.query.qrDestinations.findFirst({
      where: and(
        eq(qrDestinations.id, destId),
        eq(qrDestinations.qrCodeId, qrCodeId),
      ),
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Вариант не найден' })
    }

    const updateData: Record<string, unknown> = {}
    if (data.url !== undefined) updateData.url = data.url
    if (data.label !== undefined) updateData.label = data.label
    if (data.weight !== undefined) updateData.weight = data.weight
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const [updated] = await db
      .update(qrDestinations)
      .set(updateData)
      .where(eq(qrDestinations.id, destId))
      .returning()

    invalidateQrCache(qr.shortCode)
    return { ...updated!, updatedAt: updated!.createdAt }
  },

  async delete(qrCodeId: string, destId: string, user: User) {
    const qr = await checkQrAccess(qrCodeId, user)

    const existing = await db.query.qrDestinations.findFirst({
      where: and(
        eq(qrDestinations.id, destId),
        eq(qrDestinations.qrCodeId, qrCodeId),
      ),
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Вариант не найден' })
    }

    await db.delete(qrDestinations).where(eq(qrDestinations.id, destId))
    invalidateQrCache(qr.shortCode)
    return { success: true }
  },

  getActiveWeightSum,
}
