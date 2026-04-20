import { eq, count, ilike } from 'drizzle-orm'
import { db } from '../db'
import { tags, qrTags } from '../db/schema'

interface CreateTagData {
  name: string
  color?: string
}

export const tagService = {
  async list() {
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
        qrCount: count(qrTags.qrCodeId),
      })
      .from(tags)
      .leftJoin(qrTags, eq(qrTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(tags.name)

    return rows
  },

  async create(data: CreateTagData) {
    const normalized = data.name.trim()

    if (!normalized) {
      throw createError({ statusCode: 422, message: 'Название тега не может быть пустым' })
    }

    // Check duplicate name (case-insensitive)
    const existing = await db.query.tags.findFirst({
      where: ilike(tags.name, normalized),
    })

    if (existing) {
      throw createError({ statusCode: 409, message: `Тег «${existing.name}» уже существует` })
    }

    const [tag] = await db
      .insert(tags)
      .values({
        name: normalized,
        color: data.color,
      })
      .returning()

    return tag!
  },
}
