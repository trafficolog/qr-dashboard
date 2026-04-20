import { requireAuth } from '../../../utils/auth'
import { folderService } from '../../../services/folder.service'
import { toV1Folder } from '../contracts'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const data = await folderService.list(user)
  return apiSuccess(data.map(toV1Folder))
})
