import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db'
import { sessions } from '../db/schema'
import { hashToken } from '../utils/hash'
import { logSecurityRejection } from '../utils/security-observability'
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
    logSecurityRejection({
      event,
      eventCode: 'SEC_CSRF_MISSING_ORIGIN_OR_REFERER',
      statusCode: 403,
      reason: 'Missing Origin/Referer header on mutating API request',
    })
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.missing_origin_or_referer',
      message: 'CSRF validation failed: missing Origin/Referer header',
    })
  }

  if (originHeader) {
    try {
      if (new URL(originHeader).origin !== appOrigin) {
        logSecurityRejection({
          event,
          eventCode: 'SEC_CSRF_ORIGIN_MISMATCH',
          statusCode: 403,
          reason: 'Origin header does not match app origin',
        })
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
      logSecurityRejection({
        event,
        eventCode: 'SEC_CSRF_ORIGIN_INVALID',
        statusCode: 403,
        reason: 'Origin header cannot be parsed',
      })
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
      logSecurityRejection({
        event,
        eventCode: 'SEC_CSRF_REFERER_MISMATCH',
        statusCode: 403,
        reason: 'Referer header does not match app origin',
      })
      throwSecurityError(event, {
        statusCode: 403,
        code: 'csrf.referer_mismatch',
        message: 'CSRF validation failed: invalid Referer header',
        details: { appOrigin },
      })
    }
  }
  catch {
    logSecurityRejection({
      event,
      eventCode: 'SEC_CSRF_REFERER_INVALID',
      statusCode: 403,
      reason: 'Referer header cannot be parsed',
    })
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
    logSecurityRejection({
      event,
      eventCode: 'SEC_CSRF_TOKEN_MISSING',
      statusCode: 403,
      reason: 'Missing CSRF token header',
    })
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.missing_token',
      message: 'CSRF validation failed: missing CSRF token header',
    })
  }

  const expected = Buffer.from(session.csrfToken)
  const actual = Buffer.from(csrfHeader)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    logSecurityRejection({
      event,
      eventCode: 'SEC_CSRF_TOKEN_INVALID',
      statusCode: 403,
      reason: 'Invalid CSRF token',
    })
    throwSecurityError(event, {
      statusCode: 403,
      code: 'csrf.invalid_token',
      message: 'CSRF validation failed: invalid CSRF token',
    })
  }
})
