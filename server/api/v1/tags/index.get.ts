import { requireAuth } from '../../../utils/auth'
import { tagService } from '../../../services/tag.service'
import { toV1Tag } from '../contracts'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const data = await tagService.list()
  return apiSuccess(data.map(toV1Tag))
})
