import { authService } from '../services/auth.service'
import { apiKeyService } from '../services/api-key.service'
import { getClientIp } from '../utils/ip'
import { logSecurityRejection } from '../utils/security-observability'
import { throwSecurityError } from '../utils/security-error'

type ApiPermission = 'qr:read' | 'qr:write' | 'qr:stats:read'

type PermissionRule = {
  method: string
  pattern: RegExp
  permission: ApiPermission
}

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/verify',
  '/api/_', // Nuxt internal
]

const API_PERMISSION_RULES: PermissionRule[] = [
  { method: 'GET', pattern: /^\/api\/v1\/qr$/, permission: 'qr:read' },
  { method: 'GET', pattern: /^\/api\/v1\/qr\/[^/]+$/, permission: 'qr:read' },
  { method: 'GET', pattern: /^\/api\/v1\/qr\/[^/]+\/stats$/, permission: 'qr:stats:read' },
  { method: 'POST', pattern: /^\/api\/v1\/qr$/, permission: 'qr:write' },
  { method: 'PUT', pattern: /^\/api\/v1\/qr\/[^/]+$/, permission: 'qr:write' },
  { method: 'DELETE', pattern: /^\/api\/v1\/qr\/[^/]+$/, permission: 'qr:write' },
]

function getRequiredPermission(method: string, path: string): ApiPermission | null {
  const matchedRule = API_PERMISSION_RULES.find(rule => rule.method === method && rule.pattern.test(path))
  return matchedRule?.permission ?? null
}

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

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Пропускаем публичные пути
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) return

  // Пропускаем redirect-эндпоинт
  if (path.startsWith('/r/')) return

  // Пропускаем не-API маршруты (SSR-страницы проверяются клиентским middleware)
  if (!path.startsWith('/api/')) return

  // --- API v1: поддержка Authorization: Bearer sqr_live_... ---
  if (path.startsWith('/api/v1/')) {
    const authHeader = getHeader(event, 'Authorization') ?? ''
    const bearerKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null

    if (bearerKey) {
      const record = await apiKeyService.verify(bearerKey)
      if (!record) {
        throwSecurityError(event, {
          statusCode: 401,
          code: 'api_key.invalid',
          message: 'Недействительный API-ключ',
        })
      }

      const requiredPermission = getRequiredPermission(event.method, path)
      if (requiredPermission && !record.permissions.includes(requiredPermission)) {
        logSecurityRejection({
          event,
          eventCode: 'SEC_API_KEY_SCOPE_DENIED',
          statusCode: 403,
          reason: 'API key scope does not allow this operation',
          context: {
            requiredPermission,
            apiKeyId: String(record.id),
          },
        })
        throwSecurityError(event, {
          statusCode: 403,
          code: 'api_key.scope_denied',
          message: 'Недостаточно прав API-ключа',
          details: { requiredPermission },
        })
      }

      const clientIp = getClientIp(event)
      if (!isIpAllowed(clientIp, record.allowedIps)) {
        logSecurityRejection({
          event,
          eventCode: 'SEC_API_KEY_IP_DENIED',
          statusCode: 403,
          reason: 'Client IP is not allowed for API key',
          context: {
            apiKeyId: String(record.id),
          },
        })
        throwSecurityError(event, {
          statusCode: 403,
          code: 'api_key.ip_denied',
          message: 'IP-адрес не разрешён для этого API-ключа',
          details: { clientIp },
        })
      }

      event.context.user = record.user
      event.context.apiKeyId = record.id
      // Обновляем lastUsedAt без блокировки
      apiKeyService.touchLastUsed(record.id).catch(() => {})
      return
    }
    // Нет Bearer — fall through к cookie-auth
  }

  // --- Cookie-based session auth ---
  const token = getCookie(event, 'session_token')
  if (!token) {
    throwSecurityError(event, {
      statusCode: 401,
      code: 'auth.unauthorized',
      message: 'Не авторизован',
    })
  }

  const session = await authService.verifySession(token)
  if (!session) {
    throwSecurityError(event, {
      statusCode: 401,
      code: 'auth.session_expired',
      message: 'Сессия истекла',
    })
  }

  // Прикрепляем пользователя к контексту
  event.context.user = session.user
})
