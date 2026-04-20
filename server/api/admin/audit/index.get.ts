import { and, eq, gte, lte, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db'
import { auditActionEnum, auditLog } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  action: z.enum(auditActionEnum.enumValues).optional(),
  entityType: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = await getValidatedQuery(event, querySchema.parse)
  const offset = (query.page - 1) * query.limit

  const conditions: SQL[] = []
  if (query.userId) conditions.push(eq(auditLog.userId, query.userId))
  if (query.action) conditions.push(eq(auditLog.action, query.action))
  if (query.entityType) conditions.push(eq(auditLog.entityType, query.entityType))
  if (query.dateFrom) conditions.push(gte(auditLog.createdAt, query.dateFrom))
  if (query.dateTo) conditions.push(lte(auditLog.createdAt, query.dateTo))

  const whereClause = conditions.length ? and(...conditions) : undefined

  const [countResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(auditLog)
    .where(whereClause)

  const data = await db.query.auditLog.findMany({
    where: whereClause,
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: query.limit,
    offset,
  })

  const total = countResult?.count ?? 0

  return apiSuccess(data, {
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  })
})
