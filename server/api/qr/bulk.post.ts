import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { bulkService } from '../../services/bulk.service'

const MAX_ROWS = 500

const rowSchema = z.object({
  title: z.string().trim().min(1).max(255),
  destination_url: z.string().url(),
  description: z.string().max(1000).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  expires_at: z.string().optional(),
  folder: z.string().max(100).optional(),
  tags: z.string().max(500).optional(),
})

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_ROWS),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  // Server-side validation
  const { valid, errors: validationErrors } = bulkService.validateRows(body.rows)

  if (valid.length === 0) {
    throw createError({
      statusCode: 422,
      message: 'Нет корректных строк для создания',
      data: { errors: validationErrors },
    })
  }

  const result = await bulkService.bulkCreate(valid, user)

  return apiSuccess({
    created: result.created,
    failed: result.failed + validationErrors.length,
    total: body.rows.length,
    errors: [...validationErrors, ...result.errors],
  })
})
