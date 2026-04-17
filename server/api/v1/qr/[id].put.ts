import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { qrService } from '../../../services/qr.service'

const bodySchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  destination_url: z.string().url().optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)

  const qr = await qrService.updateQr(
    id,
    {
      title: body.title,
      destinationUrl: body.destination_url,
      description: body.description,
      status: body.status,
      folderId: body.folder_id,
      tagIds: body.tag_ids,
      expiresAt: body.expires_at,
    },
    user,
  )

  return apiSuccess(qr)
})
