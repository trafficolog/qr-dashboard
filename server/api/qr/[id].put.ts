import { z } from 'zod'
import { qrService } from '../../services/qr.service'
import { qrStyleSchema, qrUtmSchema, QR_DESCRIPTION_MAX_LENGTH, QR_TITLE_MAX_LENGTH } from '../../utils/qr-payload-schemas'

const updateSchema = z.object({
  title: z.string().min(1).max(QR_TITLE_MAX_LENGTH).optional(),
  destinationUrl: z.string().url().optional(),
  description: z.string().max(QR_DESCRIPTION_MAX_LENGTH).optional().nullable(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
  visibility: z.enum(['private', 'department', 'public']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  style: qrStyleSchema.optional(),
  utmParams: qrUtmSchema.optional(),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
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
