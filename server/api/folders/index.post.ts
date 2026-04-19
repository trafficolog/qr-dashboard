import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { folderService } from '../../services/folder.service'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(100),
  parentId: z.preprocess(
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

  const normalizedBody = {
    ...body,
    parentId: body.parentId ?? null,
    color: body.color ?? null,
  }
  const result = await folderService.create(normalizedBody, user)
  setResponseStatus(event, 201)
  return apiSuccess(result)
})
