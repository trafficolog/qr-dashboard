import { requireAuth } from '../../../utils/auth'
import { qrService } from '../../../services/qr.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const qr = await qrService.getQrById(id, user)
  return apiSuccess(qr)
})
