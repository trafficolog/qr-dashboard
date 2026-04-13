import { desc } from 'drizzle-orm'
import { db } from '../../../db'
import { allowedDomains } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещён' })
  }

  const domains = await db
    .select()
    .from(allowedDomains)
    .orderBy(desc(allowedDomains.createdAt))

  return apiSuccess(domains)
})
