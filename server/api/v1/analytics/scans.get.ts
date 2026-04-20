import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { analyticsService } from '../../../services/analytics.service'

const querySchema = z.object({
  qr_code_id: z.string().uuid().optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  compare_previous: z.coerce.boolean().optional(),
  scope: z.enum(['mine', 'department', 'public', 'company']).optional(),
  department_id: z.string().uuid().optional(),
})

function mapPoint(point: { date: string, totalScans: number, uniqueScans: number }) {
  return {
    date: point.date,
    total_scans: point.totalScans,
    unique_scans: point.uniqueScans,
  }
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const to = query.date_to ? new Date(query.date_to) : new Date()
  const from = query.date_from
    ? new Date(query.date_from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  const current = await analyticsService.getScansTimeSeries(user, { from, to }, query.qr_code_id, {
    scope: query.scope,
    departmentId: query.department_id,
  })

  if (query.compare_previous) {
    const periodMs = to.getTime() - from.getTime()
    const prevTo = from
    const prevFrom = new Date(from.getTime() - periodMs)

    const previous = await analyticsService.getScansTimeSeries(user, { from: prevFrom, to: prevTo }, query.qr_code_id, {
      scope: query.scope,
      departmentId: query.department_id,
    })

    return apiSuccess({
      current: current.map(mapPoint),
      previous: previous.map(mapPoint),
    })
  }

  return apiSuccess(current.map(mapPoint))
})
