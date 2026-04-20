import { randomBytes } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { apiKeys } from '../db/schema'
import { hashToken } from '../utils/hash'
import { recordAudit } from '../utils/audit'

const KEY_PREFIX = 'sqr_live_'

export const apiKeyService = {
  /**
   * Список API-ключей пользователя (без раскрытия самого ключа).
   */
  async list(userId: string) {
    return db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, userId),
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: (k, { desc }) => desc(k.createdAt),
    })
  },

  /**
   * Создать новый API-ключ.
   * Ключ отображается ОДИН раз в ответе — в БД хранится только хеш.
   */
  async create(userId: string, name: string) {
    const rawHex = randomBytes(32).toString('hex') // 64 hex chars
    const fullKey = `${KEY_PREFIX}${rawHex}` // sqr_live_<64> = 73 chars
    const keyHash = hashToken(fullKey)
    // Display prefix: "sqr_live" (8 chars) — identifies key type in list
    const keyPrefix = fullKey.slice(0, 8)

    const [record] = await db
      .insert(apiKeys)
      .values({ userId, name, keyHash, keyPrefix })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })

    recordAudit(
      {
        userId,
        action: 'api_key.create',
        entityType: 'api_key',
        entityId: record!.id,
      },
      { details: { name: record!.name, keyPrefix: record!.keyPrefix } },
    )

    return {
      ...record!,
      // Full key shown ONLY at creation
      key: fullKey,
    }
  },

  /**
   * Верификация ключа из Authorization: Bearer header.
   * Возвращает запись ключа с пользователем или null.
   */
  async verify(fullKey: string) {
    if (!fullKey.startsWith(KEY_PREFIX)) return null

    const hash = hashToken(fullKey)

    const record = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, hash),
        // Ключ не истёк (если expiresAt установлен)
        // Drizzle: если expiresAt IS NULL → считаем как бессрочный
      ),
      with: {
        user: true,
      },
    })

    if (!record) return null

    // Проверить срок действия вручную
    if (record.expiresAt && record.expiresAt < new Date()) return null

    return record
  },

  /**
   * Обновить lastUsedAt (fire-and-forget).
   */
  async touchLastUsed(id: string) {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id))
  },

  /**
   * Удалить ключ (только владелец).
   */
  async delete(id: string, userId: string) {
    const existing = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)),
      columns: { id: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'API-ключ не найден' })
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id))

    recordAudit(
      {
        userId,
        action: 'api_key.delete',
        entityType: 'api_key',
        entityId: id,
      },
      { details: { id } },
    )
  },
}
