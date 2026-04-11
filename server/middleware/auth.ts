import { authService } from '../services/auth.service'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/verify',
  '/api/_', // Nuxt internal
]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Пропускаем публичные пути
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return

  // Пропускаем redirect-эндпоинт
  if (path.startsWith('/r/')) return

  // Пропускаем не-API маршруты (SSR-страницы проверяются клиентским middleware)
  if (!path.startsWith('/api/')) return

  // Проверяем cookie
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
