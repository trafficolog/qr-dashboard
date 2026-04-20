import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { folderService } from '../../../services/folder.service'
import { toV1Folder } from '../contracts'

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
})

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
