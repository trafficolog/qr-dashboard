import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { apiKeyService } from '../../../services/api-key.service'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(100),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const result = await apiKeyService.create(user.id, body.name)
  setResponseStatus(event, 201)
  return apiSuccess(result)
})
