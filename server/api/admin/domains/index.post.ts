import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { allowedDomains } from '../../../db/schema'
import { validateBody } from '../../../utils/zod-errors'

const createDomainSchema = z.object({
  domain: z
    .string()
    .min(1, 'forms.errors.required')
    .max(255, 'forms.errors.maxLength')
    .regex(/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i, 'forms.errors.domain'),
  isActive: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещён' })
  }

  const body = await validateBody(event, createDomainSchema)

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
