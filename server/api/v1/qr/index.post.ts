import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { qrService } from '../../../services/qr.service'

const visibilitySchema = z.enum(['private', 'department', 'public'])
const departmentIdSchema = z.string().uuid().nullable().optional()

const bodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  destination_url: z.string().url(),
  description: z.string().max(1000).optional(),
  type: z.enum(['dynamic', 'static']).default('dynamic'),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  folder_id: z.string().uuid().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  expires_at: z.string().datetime({ offset: true }).optional(),
  visibility: visibilitySchema.optional(),
  department_id: departmentIdSchema,
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const utmParams: Record<string, string> = {}
  if (body.utm_source) utmParams.utm_source = body.utm_source
  if (body.utm_medium) utmParams.utm_medium = body.utm_medium
  if (body.utm_campaign) utmParams.utm_campaign = body.utm_campaign
  if (body.utm_content) utmParams.utm_content = body.utm_content

  const createPayload: Parameters<typeof qrService.createQr>[0] = {
    title: body.title,
    destinationUrl: body.destination_url,
    description: body.description,
    type: body.type,
    utmParams: Object.keys(utmParams).length ? utmParams : undefined,
    folderId: body.folder_id,
    tagIds: body.tag_ids,
    expiresAt: body.expires_at,
    visibility: body.visibility,
    departmentId: body.department_id,
  }

  const qr = await qrService.createQr(createPayload, user)

  setResponseStatus(event, 201)
  return apiSuccess(qr)
})
