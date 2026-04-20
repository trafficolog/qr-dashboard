import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { destinationDomains } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещён' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID не указан' })
  }

  const [deleted] = await db
    .delete(destinationDomains)
    .where(eq(destinationDomains.id, id))
    .returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Домен не найден' })
  }

  return apiSuccess({ id: deleted.id })
})
