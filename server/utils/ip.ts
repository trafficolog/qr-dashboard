import type { H3Event } from 'h3'

export function getClientIp(event: H3Event): string {
  const xForwardedFor = getRequestHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]!.trim()
  }

  const xRealIp = getRequestHeader(event, 'x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }

  return event.node.req.socket.remoteAddress || '0.0.0.0'
}
