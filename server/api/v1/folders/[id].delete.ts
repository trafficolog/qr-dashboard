import { requireAuth } from '../../../utils/auth'
import { folderService } from '../../../services/folder.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const result = await folderService.delete(id, user)
  return apiSuccess(result)
})
