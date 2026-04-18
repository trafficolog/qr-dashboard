import { z } from 'zod'
import { qrService } from '../../services/qr.service'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'totalScans']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
  visibility: z.enum(['private', 'department', 'public']).optional(),
  departmentId: z.string().uuid().optional(),
  scope: z.enum(['mine', 'department', 'public', 'all']).optional(),
  folderId: z.string().uuid().optional(),
  tags: z.string().optional(), // comma-separated tag IDs
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const filters = {
    search: query.search,
    status: query.status,
    visibility: query.visibility,
    departmentId: query.departmentId,
    scope: query.scope,
    folderId: query.folderId,
    tagIds: query.tags?.split(',').filter(Boolean),
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  }

  const pagination = {
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  }

  const result = await qrService.getQrList(filters, pagination, user)

  return apiSuccess(result.data, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  })
})
