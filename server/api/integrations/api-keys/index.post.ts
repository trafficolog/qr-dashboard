import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { apiKeyService, API_KEY_PERMISSIONS } from '../../../services/api-key.service'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(100),
  permissions: z.array(z.enum(API_KEY_PERMISSIONS)).min(1, 'Выберите хотя бы одно право'),
  allowedIps: z.array(z.string().trim().min(1).max(64)).max(50).default([]),
  expiresAt: z.string().datetime({ offset: true }),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const result = await apiKeyService.create(user.id, {
    name: body.name,
    permissions: body.permissions,
    allowedIps: body.allowedIps,
    expiresAt: new Date(body.expiresAt),
  })
  setResponseStatus(event, 201)
  return apiSuccess(result)
})
