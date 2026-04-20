import { requireAuth } from '../../../utils/auth'
import { folderService } from '../../../services/folder.service'

function toV1Folder(folder: {
  id: string
  name: string
  parentId: string | null
  color: string | null
  createdBy: string
  createdAt: Date
  qrCount: number
}) {
  return {
    id: folder.id,
    name: folder.name,
    parent_id: folder.parentId,
    color: folder.color,
    created_by: folder.createdBy,
    created_at: folder.createdAt,
    qr_count: folder.qrCount,
  }
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const data = await folderService.list(user)
  return apiSuccess(data.map(toV1Folder))
})
