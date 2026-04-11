import { qrService } from '../../../services/qr.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID обязателен' })
  }

  const qr = await qrService.duplicateQr(id, user)

  setResponseStatus(event, 201)
  return apiSuccess(qr)
})
