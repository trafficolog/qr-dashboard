import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { allowedDomains } from '../../../db/schema'
import { validateBody } from '../../../utils/zod-errors'

const patchDomainSchema = z.object({
  isActive: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещён' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID не указан' })
  }

  const body = await validateBody(event, patchDomainSchema)

  const [updated] = await db
    .update(allowedDomains)
    .set({ isActive: body.isActive })
    .where(eq(allowedDomains.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Домен не найден' })
  }

  return apiSuccess(updated)
})
