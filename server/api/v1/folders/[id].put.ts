import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { folderService } from '../../../services/folder.service'

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
})

function toV1Folder(folder: {
  id: string
  name: string
  parentId: string | null
  color: string | null
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}) {
  return {
    id: folder.id,
    name: folder.name,
    parent_id: folder.parentId,
    color: folder.color,
    created_by: folder.createdBy,
    created_at: folder.createdAt,
    updated_at: folder.updatedAt ?? folder.createdAt,
  }
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)

  const folder = await folderService.update(id, {
    name: body.name,
    parentId: body.parent_id,
    color: body.color,
  }, user)

  return apiSuccess(toV1Folder(folder))
})
