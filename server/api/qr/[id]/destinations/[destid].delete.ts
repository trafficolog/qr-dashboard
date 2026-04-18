import { requireAuth } from '../../../../utils/auth'
import { destinationService } from '../../../../services/destination.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const qrCodeId = getRouterParam(event, 'id')!
  const destId = getRouterParam(event, 'destId')!
  const result = await destinationService.delete(qrCodeId, destId, user)
  return apiSuccess(result)
})
