import { requireAuth } from '../../../utils/auth'
import { qrService } from '../../../services/qr.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  await qrService.deleteQr(id, user)
  setResponseStatus(event, 204)
  return null
})
