import { requireAuth } from '../../utils/auth'
import { tagService } from '../../services/tag.service'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const data = await tagService.list()
  return apiSuccess(data)
})
