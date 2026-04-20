import { randomBytes } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { apiKeys } from '../db/schema'
import { hashToken } from '../utils/hash'
import { recordAudit } from '../utils/audit'

const KEY_PREFIX = 'sqr_live_'
const MAX_KEYS_PER_USER = 5

export const API_KEY_PERMISSIONS = ['qr:read', 'qr:write', 'qr:stats:read', 'mcp:access'] as const

const createPayloadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  permissions: z.array(z.enum(API_KEY_PERMISSIONS)).min(1).max(API_KEY_PERMISSIONS.length),
  allowedIps: z.array(z.string().trim().min(1).max(64)).max(50).default([]),
  expiresAt: z.coerce.date(),
})

type CreateApiKeyPayload = z.infer<typeof createPayloadSchema>

export const apiKeyService = {
  /**
   * Список API-ключей пользователя (без раскрытия самого ключа).
   */
  async list(userId: string) {
    const records = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, userId),
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        allowedIps: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: (k, { desc }) => desc(k.createdAt),
    })

    return records.map(({ keyPrefix, ...record }) => ({ ...record, prefix: keyPrefix }))
  },

  /**
   * Создать новый API-ключ.
   * Ключ отображается ОДИН раз в ответе — в БД хранится только хеш.
   */
  async create(userId: string, payload: CreateApiKeyPayload) {
    const parsedPayload = createPayloadSchema.parse(payload)

    if (parsedPayload.expiresAt <= new Date()) {
      throw createError({ statusCode: 400, message: 'Дата истечения должна быть в будущем' })
    }

    const [usage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))

    if (Number(usage?.count || 0) >= MAX_KEYS_PER_USER) {
      throw createError({ statusCode: 400, message: `Можно создать не более ${MAX_KEYS_PER_USER} API-ключей` })
    }

    const rawHex = randomBytes(32).toString('hex') // 64 hex chars
    const fullKey = `${KEY_PREFIX}${rawHex}` // sqr_live_<64> = 73 chars
    const keyHash = hashToken(fullKey)
    // Display prefix: "sqr_live" (8 chars) — identifies key type in list
    const keyPrefix = fullKey.slice(0, 8)

    const [record] = await db
      .insert(apiKeys)
      .values({
        userId,
        name: parsedPayload.name,
        keyHash,
        keyPrefix,
        permissions: parsedPayload.permissions,
        allowedIps: parsedPayload.allowedIps,
        expiresAt: parsedPayload.expiresAt,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        allowedIps: apiKeys.allowedIps,
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
      {
        details: {
          name: record!.name,
          keyPrefix: record!.prefix,
          permissions: record!.permissions,
          allowedIps: record!.allowedIps,
          expiresAt: record!.expiresAt,
        },
      },
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
      where: and(eq(apiKeys.keyHash, hash)),
      with: {
        user: true,
      },
    })

    if (!record) return null

    if (record.expiresAt < new Date()) return null

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
