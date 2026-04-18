import { z } from 'zod'
import { qrService } from '../../services/qr.service'

const createSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(255),
  destinationUrl: z.string().url('Некорректный URL'),
  type: z.enum(['dynamic', 'static']).default('dynamic'),
  visibility: z.enum(['private', 'department', 'public']).default('private'),
  departmentId: z.string().uuid().optional().nullable(),
  description: z.string().max(1000).optional(),
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
  folderId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  expiresAt: z.string().datetime().optional(),
  visibility: z.enum(['private', 'public', 'department']).optional(),
  departmentId: z.string().uuid().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, createSchema.parse)

  const qr = await qrService.createQr(body, user)

  setResponseStatus(event, 201)
  return apiSuccess(qr)
})
