import { requireAuth } from '../../../utils/auth'
import { tagService } from '../../../services/tag.service'

function toV1Tag(tag: { id: string, name: string, color: string | null, createdAt: Date, qrCount: number }) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    created_at: tag.createdAt,
    qr_count: tag.qrCount,
  }
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const data = await tagService.list()
  return apiSuccess(data.map(toV1Tag))
})
