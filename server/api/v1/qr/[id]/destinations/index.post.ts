import { z } from 'zod'
import { requireAuth } from '../../../../../utils/auth'
import { destinationService } from '../../../../../services/destination.service'
import { toV1Destination } from '../../../contracts'

const bodySchema = z.object({
  url: z.string().url('Некорректный URL'),
  label: z.string().max(100).optional(),
  weight: z.number().int().min(1).max(100),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const qrCodeId = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const dest = await destinationService.create(qrCodeId, body, user)
  return apiSuccess(toV1Destination(dest))
})
