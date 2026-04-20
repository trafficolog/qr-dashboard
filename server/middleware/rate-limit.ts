import { LRUCache } from 'lru-cache'
import type { H3Event } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '../db'

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface IpBanEntry {
  bannedUntil: number
}

const SHORT_CODE_PATTERN = /^[2-9A-HJ-NP-Za-hjkmnp-z]{7,8}$/

const REDIRECT_LIMIT = 60
const REDIRECT_WINDOW_MS = 60 * 1000
const SUSPICIOUS_LIMIT = 15
const SUSPICIOUS_WINDOW_MS = 5 * 60 * 1000
const TEMP_BAN_MS = 15 * 60 * 1000

// Separate limiters for different windows
const limiters = new Map<string, LRUCache<string, RateLimitEntry>>()

const suspiciousAttempts = new LRUCache<string, RateLimitEntry>({
  max: 10000,
  ttl: SUSPICIOUS_WINDOW_MS,
})

const bannedIps = new LRUCache<string, IpBanEntry>({
  max: 10000,
  ttl: TEMP_BAN_MS,
})

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

function throwRateLimitError(
  event: H3Event,
  options: {
    message: string
    errorCode: 'RATE_LIMIT_EXCEEDED' | 'IP_TEMP_BANNED'
    retryAfterSeconds: number
  },
): never {
  throw createError({
    statusCode: 429,
    statusMessage: options.message,
    data: {
      error: {
        code: options.errorCode,
        message: options.message,
        statusCode: 429,
        retryAfter: options.retryAfterSeconds,
      },
    },
  })
}

function markSuspiciousRedirectAttempt(ip: string) {
  const key = `suspicious:${ip}`
  const now = Date.now()
  const existing = suspiciousAttempts.get(key)

  if (!existing || now > existing.resetAt) {
    suspiciousAttempts.set(key, {
      count: 1,
      resetAt: now + SUSPICIOUS_WINDOW_MS,
    })
    return
  }

  existing.count++
  if (existing.count >= SUSPICIOUS_LIMIT) {
    bannedIps.set(ip, {
      bannedUntil: now + TEMP_BAN_MS,
    })
    suspiciousAttempts.delete(key)
  }
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
      const resetAtMs = entry?.resetAt ?? (Date.now() + windowMs)
      setRateLimitHeaders(event, {
        limit: 5,
        remaining: 0,
        resetAtMs,
      })
      throwRateLimitError(event, {
        message: 'Слишком много запросов. Попробуйте через 15 минут.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000)),
      })
    }
  }

  // Rate limit для redirect: 60 req / min per IP + temp-ban for suspicious activity
  if (path.startsWith('/r/')) {
    const ip = getClientIp(event)
    const ban = bannedIps.get(ip)

    if (ban && Date.now() < ban.bannedUntil) {
      setRateLimitHeaders(event, {
        limit: REDIRECT_LIMIT,
        remaining: 0,
        resetAtMs: ban.bannedUntil,
      })
      throwRateLimitError(event, {
        message: 'IP временно заблокирован из-за подозрительной активности на /r/*.',
        errorCode: 'IP_TEMP_BANNED',
        retryAfterSeconds: Math.max(1, Math.ceil((ban.bannedUntil - Date.now()) / 1000)),
      })
    }

    const code = path.slice('/r/'.length)
    if (!SHORT_CODE_PATTERN.test(code)) {
      markSuspiciousRedirectAttempt(ip)
    }

    const limiter = getLimiter(REDIRECT_WINDOW_MS)
    const key = `redirect:${ip}`

    if (!checkRateLimit(limiter, key, REDIRECT_LIMIT, REDIRECT_WINDOW_MS)) {
      const entry = limiter.get(key)
      const resetAtMs = entry?.resetAt ?? (Date.now() + REDIRECT_WINDOW_MS)
      setRateLimitHeaders(event, {
        limit: REDIRECT_LIMIT,
        remaining: 0,
        resetAtMs,
      })
      throwRateLimitError(event, {
        message: 'Слишком много запросов к /r/*. Попробуйте позже.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000)),
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
        throwRateLimitError(event, {
          message: 'Rate limit exceeded. Maximum 100 requests per minute.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)),
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
      throwRateLimitError(event, {
        message: 'Rate limit exceeded. Maximum 100 requests per minute.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, Math.ceil((persistent.resetAtMs - Date.now()) / 1000)),
      })
    }

    setRateLimitHeaders(event, {
      limit: 100,
      remaining: 100 - persistent.count,
      resetAtMs: persistent.resetAtMs,
    })
  }
})
