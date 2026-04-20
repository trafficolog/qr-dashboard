import type { H3Event } from 'h3'

function getProxyConfig() {
  const runtimeConfig = useRuntimeConfig()

  return {
    proxySchemeEnabled: runtimeConfig.proxySchemeEnabled === true,
    trustedProxies: new Set(
      (runtimeConfig.trustedProxies || '')
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean)
        .map(normalizeIp),
    ),
  }
}

function normalizeIp(ip: string): string {
  const normalized = ip.trim()
  return normalized.startsWith('::ffff:')
    ? normalized.slice('::ffff:'.length)
    : normalized
}

function isTrustedProxy(remoteAddress: string, trustedProxies: Set<string>): boolean {
  return trustedProxies.has(normalizeIp(remoteAddress))
}

export function getClientIp(event: H3Event): string {
  const { proxySchemeEnabled, trustedProxies } = getProxyConfig()
  const remoteAddress = event.node.req.socket.remoteAddress || '0.0.0.0'

  if (!proxySchemeEnabled || !isTrustedProxy(remoteAddress, trustedProxies)) {
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
