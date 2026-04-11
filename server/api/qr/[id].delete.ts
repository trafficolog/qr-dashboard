import { qrService } from '../../services/qr.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID обязателен' })
  }

  const result = await qrService.deleteQr(id, user)
  return apiSuccess(result)
})
