import { requireAuth } from '../../../utils/auth'
import { apiKeyService } from '../../../services/api-key.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  await apiKeyService.delete(id, user.id)
  return apiSuccess({ id })
})
