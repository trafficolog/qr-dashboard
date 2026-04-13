import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { allowedDomains } from '../../../db/schema'

const createDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i, 'Некорректный формат домена'),
  isActive: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещён' })
  }

  const body = await readValidatedBody(event, createDomainSchema.parse)

  const existing = await db.query.allowedDomains.findFirst({
    where: eq(allowedDomains.domain, body.domain),
  })

  if (existing) {
    throw createError({ statusCode: 409, message: 'Домен уже добавлен' })
  }

  const [created] = await db
    .insert(allowedDomains)
    .values({ domain: body.domain, isActive: body.isActive })
    .returning()

  return apiSuccess(created)
})
