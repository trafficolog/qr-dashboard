import { LRUCache } from 'lru-cache'
import type { H3Event } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '../db'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Separate limiters for different windows
const limiters = new Map<string, LRUCache<string, RateLimitEntry>>()

function getLimiter(windowMs: number): LRUCache<string, RateLimitEntry> {
  const key = String(windowMs)
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new LRUCache<string, RateLimitEntry>({
      max: 10000,
      ttl: windowMs,
    })
    limiters.set(key, limiter)
  }
  return limiter
}

function checkRateLimit(
  limiter: LRUCache<string, RateLimitEntry>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const entry = limiter.get(key)

  if (!entry || now > entry.resetAt) {
    limiter.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}

function setRateLimitHeaders(
  event: H3Event,
  options: { limit: number, remaining: number, resetAtMs: number },
) {
  const retryAfter = Math.max(1, Math.ceil((options.resetAtMs - Date.now()) / 1000))
  setResponseHeader(event, 'Retry-After', retryAfter)
  setResponseHeader(event, 'X-RateLimit-Limit', options.limit)
  setResponseHeader(event, 'X-RateLimit-Remaining', Math.max(0, options.remaining))
  setResponseHeader(event, 'X-RateLimit-Reset', Math.ceil(options.resetAtMs / 1000))
}

async function incrementPersistentRateLimit(
  scope: string,
  key: string,
  windowMs: number,
) {
  const nowMs = Date.now()
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs
  const resetAtMs = windowStartMs + windowMs
  const id = `${scope}:${key}:${windowStartMs}`

  const result = await db.execute(sql<{
    count: number
    resetAt: Date
  }>`
    INSERT INTO rate_limit_counters (id, scope, key, window_start, reset_at, count, updated_at)
    VALUES (${id}, ${scope}, ${key}, to_timestamp(${windowStartMs}::double precision / 1000.0), to_timestamp(${resetAtMs}::double precision / 1000.0), 1, now())
    ON CONFLICT (id) DO UPDATE
      SET count = rate_limit_counters.count + 1,
          updated_at = now()
    RETURNING count, reset_at
  `)

  const row = result.rows[0] as { count: number | string, resetAt?: Date | string } | undefined
  return {
    count: row ? Number(row.count) : 1,
    resetAtMs: row?.resetAt ? new Date(row.resetAt).getTime() : resetAtMs,
  }
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Rate limit для auth/login: 5 req / 15 min per IP
  if (path === '/api/auth/login' && event.method === 'POST') {
    const ip = getClientIp(event)
    const windowMs = 15 * 60 * 1000
    const limiter = getLimiter(windowMs)
    const key = `auth:${ip}`

    if (!checkRateLimit(limiter, key, 5, windowMs)) {
      const entry = limiter.get(key)
      setRateLimitHeaders(event, {
        limit: 5,
        remaining: 0,
        resetAtMs: entry?.resetAt ?? (Date.now() + windowMs),
      })
      throw createError({
        statusCode: 429,
        message: 'Слишком много запросов. Попробуйте через 15 минут',
      })
    }
  }

  // Rate limit для redirect: 60 req / min per IP
  if (path.startsWith('/r/')) {
    const ip = getClientIp(event)
    const windowMs = 60 * 1000
    const limiter = getLimiter(windowMs)
    const key = `redirect:${ip}`

    if (!checkRateLimit(limiter, key, 60, windowMs)) {
      const entry = limiter.get(key)
      setRateLimitHeaders(event, {
        limit: 60,
        remaining: 0,
        resetAtMs: entry?.resetAt ?? (Date.now() + windowMs),
      })
      throw createError({
        statusCode: 429,
        message: 'Too many requests',
      })
    }
  }

  // Rate limit для API v1: 100 req / min per API key (по apiKeyId из контекста)
  // auth.ts (a < r) выполняется раньше и устанавливает event.context.apiKeyId
  if (path.startsWith('/api/v1/') && event.context.apiKeyId) {
    const windowMs = 60 * 1000
    const limiter = getLimiter(windowMs)
    const key = `v1:${event.context.apiKeyId}`
    const entry = limiter.get(key)

    if (entry && Date.now() <= entry.resetAt) {
      if (!checkRateLimit(limiter, key, 100, windowMs)) {
        setRateLimitHeaders(event, {
          limit: 100,
          remaining: 0,
          resetAtMs: entry.resetAt,
        })
        throw createError({
          statusCode: 429,
          message: 'Rate limit exceeded. Maximum 100 requests per minute.',
        })
      }
      const updatedEntry = limiter.get(key)!
      setRateLimitHeaders(event, {
        limit: 100,
        remaining: 100 - updatedEntry.count,
        resetAtMs: updatedEntry.resetAt,
      })
      return
    }

    const persistent = await incrementPersistentRateLimit(
      'v1',
      String(event.context.apiKeyId),
      windowMs,
    )
    limiter.set(key, {
      count: persistent.count,
      resetAt: persistent.resetAtMs,
    })

    if (persistent.count > 100) {
      setRateLimitHeaders(event, {
        limit: 100,
        remaining: 0,
        resetAtMs: persistent.resetAtMs,
      })
      throw createError({
        statusCode: 429,
        message: 'Rate limit exceeded. Maximum 100 requests per minute.',
      })
    }

    setRateLimitHeaders(event, {
      limit: 100,
      remaining: 100 - persistent.count,
      resetAtMs: persistent.resetAtMs,
    })
  }
})
