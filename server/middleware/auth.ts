import { authService } from '../services/auth.service'
import { apiKeyService } from '../services/api-key.service'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/verify',
  '/api/_', // Nuxt internal
]

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
        throw createError({ statusCode: 401, message: 'Недействительный API-ключ' })
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
    throw createError({ statusCode: 401, message: 'Не авторизован' })
  }

  const user = await authService.verifySession(token)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Сессия истекла' })
  }

  // Прикрепляем пользователя к контексту
  event.context.user = user
})
