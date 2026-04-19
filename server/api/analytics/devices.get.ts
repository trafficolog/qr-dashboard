import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { analyticsService } from '../../services/analytics.service'

const querySchema = z.object({
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  scope: z.enum(['mine', 'department', 'public', 'company']).optional(),
  departmentId: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const to = query.dateTo ? new Date(query.dateTo) : new Date()
  const from = query.dateFrom
    ? new Date(query.dateFrom)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  const data = await analyticsService.getDeviceBreakdown(user, { from, to }, {
    scope: query.scope,
    departmentId: query.departmentId,
  })

  return apiSuccess(data)
})
