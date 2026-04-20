import type { H3Event } from 'h3'
import { apiKeyService } from '../services/api-key.service'
import { recordAudit } from '../utils/audit'
import { getClientIp } from '../utils/ip'
import { logSecurityRejection } from '../utils/security-observability'

function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0
}

function matchesCidr(clientIp: string, cidr: string): boolean {
  const [baseIp, bitsRaw] = cidr.split('/')
  if (!baseIp || !bitsRaw) return false

  const bits = Number(bitsRaw)
  if (!Number.isInteger(bits)) return false

  const normalizedClient = normalizeIp(clientIp)
  const normalizedBase = normalizeIp(baseIp)

  const clientParts = normalizedClient.split('.')
  const baseParts = normalizedBase.split('.')
  if (clientParts.length !== 4 || baseParts.length !== 4 || bits < 0 || bits > 32) return false

  const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0
  return (ipv4ToInt(normalizedClient) & mask) === (ipv4ToInt(normalizedBase) & mask)
}

function isIpAllowed(clientIp: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return true

  const normalizedClient = normalizeIp(clientIp)

  return allowedIps.some((entry) => {
    const normalizedEntry = normalizeIp(entry.trim())
    if (!normalizedEntry) return false

    if (normalizedEntry.includes('/')) {
      return matchesCidr(normalizedClient, normalizedEntry)
    }

    return normalizedClient === normalizedEntry
  })
}

function extractBearerApiKey(event: H3Event): string | null {
  const authHeader = getHeader(event, 'Authorization') ?? ''
  const [scheme, token] = authHeader.split(/\s+/, 2)

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  const trimmed = token.trim()
  return trimmed.length > 0 ? trimmed : null
}

export type McpContext = {
  user: NonNullable<Awaited<ReturnType<typeof apiKeyService.verify>>>['user']
  apiKey: Pick<NonNullable<Awaited<ReturnType<typeof apiKeyService.verify>>>, 'id' | 'name' | 'permissions'>
}

export async function authenticateMcpRequest(event: H3Event): Promise<McpContext> {
  const path = getRequestURL(event).pathname
  const bearerKey = extractBearerApiKey(event)

  if (!bearerKey) {
    throw createError({ statusCode: 401, message: 'Missing Authorization: Bearer API key' })
  }

  const record = await apiKeyService.verify(bearerKey)
  if (!record) {
    throw createError({ statusCode: 401, message: 'Invalid API key' })
  }

  if (!record.permissions.includes('mcp:access')) {
    logSecurityRejection({
      event,
      eventCode: 'SEC_API_KEY_SCOPE_DENIED',
      statusCode: 403,
      reason: 'API key scope does not allow MCP access',
      context: {
        requiredPermission: 'mcp:access',
        apiKeyId: String(record.id),
      },
    })
    recordAudit(
      {
        userId: record.user.id,
        action: 'api_key.scope_denied',
        entityType: 'api_key',
        entityId: String(record.id),
      },
      {
        details: {
          path,
          method: getMethod(event),
          requiredPermission: 'mcp:access',
          permissions: record.permissions,
        },
      },
    )
    throw createError({ statusCode: 403, message: 'API key lacks mcp:access permission' })
  }

  const clientIp = getClientIp(event)
  if (!isIpAllowed(clientIp, record.allowedIps)) {
    throw createError({ statusCode: 403, message: 'IP address is not allowed for this API key' })
  }

  event.context.user = record.user
  event.context.apiKeyId = record.id
  apiKeyService.touchLastUsed(record.id).catch(() => {})

  return {
    user: record.user,
    apiKey: {
      id: record.id,
      name: record.name,
      permissions: record.permissions,
    },
  }
}
