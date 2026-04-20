import { desc } from 'drizzle-orm'
import { db } from '../../../db'
import { destinationDomains } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещён' })
  }

  const domains = await db
    .select()
    .from(destinationDomains)
    .orderBy(desc(destinationDomains.createdAt))

  return apiSuccess(domains)
})
