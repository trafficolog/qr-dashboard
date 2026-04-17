import { requireAuth } from '../../../utils/auth'
import { apiKeyService } from '../../../services/api-key.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const keys = await apiKeyService.list(user.id)
  return apiSuccess(keys)
})
