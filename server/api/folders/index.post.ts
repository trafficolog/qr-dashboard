import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { folderService } from '../../services/folder.service'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(100),
  parentId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
  color: z.union([z.string().regex(/^#[0-9a-f]{6}$/i), z.literal('')]).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const normalizeOptional = (value?: string | null) => {
    if (value === undefined || value === null) return value
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  const normalizedBody = {
    ...body,
    parentId: normalizeOptional(body.parentId),
    color: normalizeOptional(body.color),
  }
  const result = await folderService.create(normalizedBody, user)
  setResponseStatus(event, 201)
  return apiSuccess(result)
})
