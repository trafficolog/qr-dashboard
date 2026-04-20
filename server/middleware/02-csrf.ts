import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db'
import { sessions } from '../db/schema'
import { hashToken } from '../utils/hash'
import { throwSecurityError } from '../utils/security-error'

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
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.missing_origin_or_referer',
      message: 'CSRF validation failed: missing Origin/Referer header',
    })
  }

  if (originHeader) {
    try {
      if (new URL(originHeader).origin !== appOrigin) {
        throwSecurityError(event, {
          statusCode: 403,
          code: 'csrf.origin_mismatch',
          message: 'CSRF validation failed: invalid Origin header',
          details: { appOrigin },
        })
      }
      return
    }
    catch {
      throwSecurityError(event, {
        statusCode: 403,
        code: 'csrf.origin_mismatch',
        message: 'CSRF validation failed: invalid Origin header',
        details: { appOrigin },
      })
    }
  }

  try {
    if (new URL(refererHeader!).origin !== appOrigin) {
      throwSecurityError(event, {
        statusCode: 403,
        code: 'csrf.referer_mismatch',
        message: 'CSRF validation failed: invalid Referer header',
        details: { appOrigin },
      })
    }
  }
  catch {
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.referer_mismatch',
      message: 'CSRF validation failed: invalid Referer header',
      details: { appOrigin },
    })
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
    throwSecurityError(event, {
      statusCode: 401,
      code: 'auth.unauthorized',
      message: 'Не авторизован',
    })
  }

  const tokenHash = hashToken(token)
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, tokenHash),
      gt(sessions.expiresAt, new Date()),
    ),
  })

  if (!session) {
    throwSecurityError(event, {
      statusCode: 401,
      code: 'auth.session_expired',
      message: 'Сессия истекла',
    })
  }

  const csrfHeaderName = runtimeConfig.public.csrfHeaderName.toLowerCase()
  const csrfHeader = getHeader(event, csrfHeaderName)
  if (!csrfHeader) {
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.missing_token',
      message: 'CSRF validation failed: missing CSRF token header',
    })
  }

  const expected = Buffer.from(session.csrfToken)
  const actual = Buffer.from(csrfHeader)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.invalid_token',
      message: 'CSRF validation failed: invalid CSRF token',
    })
  }
})
