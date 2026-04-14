import { requireAuth } from '../../utils/auth'
import { folderService } from '../../services/folder.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const folder = await folderService.getById(id, user)
  return apiSuccess(folder)
})
