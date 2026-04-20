import type { H3Event } from 'h3'

const runtimeConfig = useRuntimeConfig()

const trustedProxies = new Set(
  (runtimeConfig.trustedProxies || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)
    .map(normalizeIp),
)

function normalizeIp(ip: string): string {
  const normalized = ip.trim()
  return normalized.startsWith('::ffff:')
    ? normalized.slice('::ffff:'.length)
    : normalized
}

function isTrustedProxy(remoteAddress: string): boolean {
  return trustedProxies.has(normalizeIp(remoteAddress))
}

export function getClientIp(event: H3Event): string {
  const remoteAddress = event.node.req.socket.remoteAddress || '0.0.0.0'

  if (!isTrustedProxy(remoteAddress)) {
    return remoteAddress
  }

  const xForwardedFor = getRequestHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]!.trim()
  }

  const xRealIp = getRequestHeader(event, 'x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }

  return remoteAddress
}
