const DEFAULT_API_BODY_LIMIT_BYTES = 1024 * 1024
const BULK_API_BODY_LIMIT_BYTES = 5 * 1024 * 1024

function getRouteBodyLimit(pathname: string): number | null {
  if (!pathname.startsWith('/api/')) {
    return null
  }

  if (pathname === '/api/qr/bulk') {
    return BULK_API_BODY_LIMIT_BYTES
  }

  return DEFAULT_API_BODY_LIMIT_BYTES
}

export default defineEventHandler((event) => {
  const method = getMethod(event)
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    return
  }

  const pathname = getRequestURL(event).pathname
  const limit = getRouteBodyLimit(pathname)
  if (!limit) {
    return
  }

  const contentLength = Number.parseInt(getHeader(event, 'content-length') || '', 10)
  if (Number.isFinite(contentLength) && contentLength > limit) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: 'Payload Too Large',
    })
  }
})
