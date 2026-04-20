import { z } from 'zod'
import { db } from '../../db'
import { qrService } from '../../services/qr.service'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Выберите хотя бы один QR-код'),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bulkDeleteSchema.parse)

  const result = await db.transaction(async tx => qrService.bulkDeleteQr(body.ids, user, tx))
  return apiSuccess(result)
})
