import { LRUCache } from 'lru-cache'

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

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Rate limit для auth/login: 5 req / 15 min per IP
  if (path === '/api/auth/login' && event.method === 'POST') {
    const ip = getClientIp(event)
    const windowMs = 15 * 60 * 1000
    const limiter = getLimiter(windowMs)

    if (!checkRateLimit(limiter, `auth:${ip}`, 5, windowMs)) {
      setResponseHeader(event, 'Retry-After', '900')
      throw createError({
        statusCode: 429,
        message: 'Слишком много запросов. Попробуйте через 15 минут',
      })
    }
  }

  // Rate limit для redirect: 1000 req / min глобально
  if (path.startsWith('/r/')) {
    const windowMs = 60 * 1000
    const limiter = getLimiter(windowMs)

    if (!checkRateLimit(limiter, 'redirect:global', 1000, windowMs)) {
      setResponseHeader(event, 'Retry-After', '60')
      throw createError({
        statusCode: 429,
        message: 'Too many requests',
      })
    }
  }
})
