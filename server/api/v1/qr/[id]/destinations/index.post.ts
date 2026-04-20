import { z } from 'zod'
import { requireAuth } from '../../../../../utils/auth'
import { destinationService } from '../../../../../services/destination.service'

const bodySchema = z.object({
  url: z.string().url('Некорректный URL'),
  label: z.string().max(100).optional(),
  weight: z.number().int().min(1).max(100),
})

function toV1Destination(dest: {
  id: string
  qrCodeId: string
  url: string
  label: string | null
  weight: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: dest.id,
    qr_code_id: dest.qrCodeId,
    url: dest.url,
    label: dest.label,
    weight: dest.weight,
    is_active: dest.isActive,
    created_at: dest.createdAt,
    updated_at: dest.updatedAt,
  }
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const qrCodeId = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const dest = await destinationService.create(qrCodeId, body, user)
  return apiSuccess(toV1Destination(dest))
})
