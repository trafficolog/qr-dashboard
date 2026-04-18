import { z } from 'zod'
import { requireAuth } from '../../../../utils/auth'
import { destinationService } from '../../../../services/destination.service'

const bodySchema = z.object({
  url: z.string().url('Некорректный URL').optional(),
  label: z.string().max(100).nullable().optional(),
  weight: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const qrCodeId = getRouterParam(event, 'id')!
  const destId = getRouterParam(event, 'destId')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const dest = await destinationService.update(qrCodeId, destId, body, user)
  return apiSuccess(dest)
})
