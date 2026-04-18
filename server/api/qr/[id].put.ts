import { z } from 'zod'
import { qrService } from '../../services/qr.service'

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  destinationUrl: z.string().url().optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
  visibility: z.enum(['private', 'department', 'public']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  style: z.record(z.any()).optional(),
  utmParams: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_term: z.string().optional(),
      utm_content: z.string().optional(),
    })
    .optional(),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  visibility: z.enum(['private', 'public', 'department']).optional(),
  departmentId: z.string().uuid().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID обязателен' })
  }

  const body = await readValidatedBody(event, updateSchema.parse)
  const qr = await qrService.updateQr(id, body, user)
  return apiSuccess(qr)
})
