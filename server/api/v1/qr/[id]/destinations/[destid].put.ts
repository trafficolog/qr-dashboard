import { z } from 'zod'
import { requireAuth } from '../../../../../utils/auth'
import { destinationService } from '../../../../../services/destination.service'
import { toV1Destination } from '../../../contracts'

const bodySchema = z.object({
  url: z.string().url('Некорректный URL').optional(),
  label: z.string().max(100).nullable().optional(),
  weight: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const qrCodeId = getRouterParam(event, 'id')!
  const destId = getRouterParam(event, 'destid')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const dest = await destinationService.update(qrCodeId, destId, {
    url: body.url,
    label: body.label,
    weight: body.weight,
    isActive: body.is_active,
  }, user)
  return apiSuccess(toV1Destination(dest))
})
