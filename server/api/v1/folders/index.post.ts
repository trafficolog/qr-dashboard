import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { folderService } from '../../../services/folder.service'
import { toV1Folder } from '../contracts'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(100),
  parent_id: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().uuid().optional().nullable(),
  ),
  color: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().regex(/^#[0-9a-f]{6}$/i).optional().nullable(),
  ),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const result = await folderService.create({
    name: body.name,
    parentId: body.parent_id ?? null,
    color: body.color ?? null,
  }, user)

  setResponseStatus(event, 201)
  return apiSuccess(toV1Folder(result))
})
