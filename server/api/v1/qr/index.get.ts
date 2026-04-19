import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { qrService } from '../../../services/qr.service'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
  visibility: z.enum(['private', 'department', 'public']).optional(),
  scope: z.enum(['mine', 'department', 'public', 'all']).optional(),
  department_id: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'title', 'totalScans']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const result = await qrService.getQrList(
    {
      search: query.search,
      status: query.status,
      visibility: query.visibility,
      scope: query.scope,
      departmentId: query.department_id,
      folderId: query.folderId,
    },
    { page: query.page, limit: query.limit, sortBy: query.sortBy, sortOrder: query.sortOrder },
    user,
  )

  return apiSuccess(result.data, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  })
})
