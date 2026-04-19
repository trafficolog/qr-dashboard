import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { folderService } from '../../services/folder.service'

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const folder = await folderService.update(id, body, user)
  return apiSuccess(folder)
})
