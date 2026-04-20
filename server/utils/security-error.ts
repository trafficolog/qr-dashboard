import type { H3Event } from 'h3'

export interface SecurityErrorDetails {
  [key: string]: unknown
}

export interface SecurityErrorOptions {
  statusCode: 400 | 401 | 403 | 404 | 429 | 503
  code: string
  message: string
  details?: SecurityErrorDetails
  retryAfter?: number
}

export function throwSecurityError(event: H3Event | undefined, options: SecurityErrorOptions): never {
  if (options.statusCode === 429 && options.retryAfter && event) {
    setResponseHeader(event, 'Retry-After', options.retryAfter)
  }

  throw createError({
    statusCode: options.statusCode,
    statusMessage: options.message,
    data: {
      error: {
        code: options.code,
        message: options.message,
        details: options.details ?? null,
        ...(options.statusCode === 429 && options.retryAfter
          ? { retryAfter: options.retryAfter }
          : {}),
      },
    },
  })
}
