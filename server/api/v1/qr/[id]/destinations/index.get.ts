import { requireAuth } from '../../../../../utils/auth'
import { destinationService } from '../../../../../services/destination.service'
import { toV1Destination } from '../../../contracts'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const qrCodeId = getRouterParam(event, 'id')!
  const data = await destinationService.list(qrCodeId, user)
  return apiSuccess(data.map(toV1Destination))
})
