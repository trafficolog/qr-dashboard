import { requireAuth } from '../../utils/auth'
import { folderService } from '../../services/folder.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const data = await folderService.list(user)
  return apiSuccess(data)
})
