import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { analyticsService } from '../../../services/analytics.service'
import { db } from '../../../db'
import { qrCodes } from '../../../db/schema'

const querySchema = z.object({
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const query = await getValidatedQuery(event, querySchema.parse)

  // Проверить существование и доступ
  const qr = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
    columns: { id: true, createdBy: true },
  })

  if (!qr) {
    throw createError({ statusCode: 404, message: 'QR-код не найден' })
  }

  if (user.role !== 'admin' && qr.createdBy !== user.id) {
    throw createError({ statusCode: 403, message: 'Нет доступа' })
  }

  const to = query.dateTo ? new Date(query.dateTo) : new Date()
  const from = query.dateFrom
    ? new Date(query.dateFrom)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  const data = await analyticsService.getQrAnalytics(id, { from, to })
  return apiSuccess(data)
})
