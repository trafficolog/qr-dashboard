import { z } from 'zod'
import { requireAuth } from '../../../../../utils/auth'
import { destinationService } from '../../../../../services/destination.service'

const bodySchema = z.object({
  url: z.string().url('Некорректный URL').optional(),
  label: z.string().max(100).nullable().optional(),
  weight: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
})

function toV1Destination(dest: {
  id: string
  qrCodeId: string
  url: string
  label: string | null
  weight: number
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}) {
  return {
    id: dest.id,
    qr_code_id: dest.qrCodeId,
    url: dest.url,
    label: dest.label,
    weight: dest.weight,
    is_active: dest.isActive,
    created_at: dest.createdAt,
    updated_at: dest.updatedAt ?? dest.createdAt,
  }
}

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
