import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db'
import { sessions } from '../db/schema'
import { hashToken } from '../utils/hash'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const EXCLUDED_PATHS = [
  '/api/v1',
  '/api/v1/',
  '/api/auth/login',
  '/api/auth/verify',
]

function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATHS.some(excludedPath => path.startsWith(excludedPath))
}

function validateOriginOrReferer(event: H3Event, appOrigin: string) {
  const originHeader = getHeader(event, 'origin')
  const refererHeader = getHeader(event, 'referer')

  if (!originHeader && !refererHeader) {
    throw createError({ statusCode: 403, message: 'CSRF validation failed: missing Origin/Referer header' })
  }

  if (originHeader) {
    try {
      if (new URL(originHeader).origin !== appOrigin) {
        throw createError({ statusCode: 403, message: 'CSRF validation failed: invalid Origin header' })
      }
      return
    }
    catch {
      throw createError({ statusCode: 403, message: 'CSRF validation failed: invalid Origin header' })
    }
  }

  try {
    if (new URL(refererHeader!).origin !== appOrigin) {
      throw createError({ statusCode: 403, message: 'CSRF validation failed: invalid Referer header' })
    }
  }
  catch {
    throw createError({ statusCode: 403, message: 'CSRF validation failed: invalid Referer header' })
  }
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return
  if (isExcludedPath(path)) return

  const method = getMethod(event)
  if (!MUTATING_METHODS.has(method)) return

  const runtimeConfig = useRuntimeConfig(event)
  const appOrigin = new URL(runtimeConfig.public.appUrl).origin
  validateOriginOrReferer(event, appOrigin)

  const token = getCookie(event, 'session_token')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Не авторизован' })
  }

  const tokenHash = hashToken(token)
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, tokenHash),
      gt(sessions.expiresAt, new Date()),
    ),
  })

  if (!session) {
    throw createError({ statusCode: 401, message: 'Сессия истекла' })
  }

  const csrfHeaderName = runtimeConfig.public.csrfHeaderName.toLowerCase()
  const csrfHeader = getHeader(event, csrfHeaderName)
  if (!csrfHeader) {
    throw createError({ statusCode: 403, message: 'CSRF validation failed: missing CSRF token header' })
  }

  const expected = Buffer.from(session.csrfToken)
  const actual = Buffer.from(csrfHeader)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw createError({ statusCode: 403, message: 'CSRF validation failed: invalid CSRF token' })
  }
})
