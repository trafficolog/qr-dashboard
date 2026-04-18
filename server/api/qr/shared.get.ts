import { requireAuth } from '../../utils/auth'
import { qrService } from '../../services/qr.service'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const list = await qrService.getSharedQrList()
  return apiSuccess(list)
})
