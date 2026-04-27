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

const API_DOCS_CONTENT_SECURITY_POLICY = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data: https:`,
  // Scalar API Reference uses dynamic browser runtime pieces in dev; keep this relaxation scoped to /api-docs.
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:`,
  `style-src 'self' 'unsafe-inline'`,
  `connect-src 'self' ws: wss: http: https:`,
  `worker-src 'self' blob:`,
  `child-src 'self' blob:`,
].join('; ')

function isHtmlRoute(pathname: string): boolean {
  // API/redirect endpoints и файлы ассетов не должны получать CSP.
  if (pathname.startsWith('/api/') || pathname.startsWith('/r/')) return false
  if (/\.[a-z\d]+$/i.test(pathname)) return false
  return true
}

function contentSecurityPolicyFor(pathname: string): string {
  if (pathname === '/api-docs' || pathname.startsWith('/api-docs/')) {
    return API_DOCS_CONTENT_SECURITY_POLICY
  }

  return CONTENT_SECURITY_POLICY
}

export default defineEventHandler((event) => {
  setHeaders(event, SECURITY_HEADERS)

  const pathname = getRequestURL(event).pathname
  if (isHtmlRoute(pathname)) {
    setHeader(event, 'Content-Security-Policy', contentSecurityPolicyFor(pathname))
  }
})
