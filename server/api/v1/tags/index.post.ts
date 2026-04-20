import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { tagService } from '../../../services/tag.service'

const bodySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
})

function toV1Tag(tag: { id: string, name: string, color: string | null, createdAt: Date, updatedAt?: Date }) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    created_at: tag.createdAt,
    updated_at: tag.updatedAt ?? tag.createdAt,
  }
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const tag = await tagService.create(body)
  return apiSuccess(toV1Tag(tag))
})
