import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { analyticsService } from '../../../services/analytics.service'

const querySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  scope: z.enum(['mine', 'department', 'public', 'company']).optional(),
  department_id: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const to = query.date_to ? new Date(query.date_to) : new Date()
  const from = query.date_from
    ? new Date(query.date_from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  const data = await analyticsService.getOverview(user, { from, to }, {
    scope: query.scope,
    departmentId: query.department_id,
  })

  return apiSuccess({
    total_qr_codes: data.totalQrCodes,
    total_scans: data.totalScans,
    unique_scans: data.uniqueScans,
    scans_today: data.scansToday,
    total_qr_codes_change: data.totalQrCodesChange,
    total_scans_change: data.totalScansChange,
    unique_scans_change: data.uniqueScansChange,
    scans_today_change: data.scansTodayChange,
  })
})
