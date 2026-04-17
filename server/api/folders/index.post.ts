import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { folderService } from '../../services/folder.service'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(100),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const result = await folderService.create(body, user)
  setResponseStatus(event, 201)
  return apiSuccess(result)
})
