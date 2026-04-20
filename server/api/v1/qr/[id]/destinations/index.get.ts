import { requireAuth } from '../../../../../utils/auth'
import { destinationService } from '../../../../../services/destination.service'

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
  const data = await destinationService.list(qrCodeId, user)
  return apiSuccess(data.map(toV1Destination))
})
