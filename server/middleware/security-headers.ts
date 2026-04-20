const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

const CONTENT_SECURITY_POLICY = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `connect-src 'self' ws: wss:`,
].join('; ')

function isHtmlRoute(pathname: string): boolean {
  // API/redirect endpoints и файлы ассетов не должны получать CSP.
  if (pathname.startsWith('/api/') || pathname.startsWith('/r/')) return false
  if (/\.[a-z\d]+$/i.test(pathname)) return false
  return true
}

export default defineEventHandler((event) => {
  setHeaders(event, SECURITY_HEADERS)

  const pathname = getRequestURL(event).pathname
  if (isHtmlRoute(pathname)) {
    setHeader(event, 'Content-Security-Policy', CONTENT_SECURITY_POLICY)
  }
})
