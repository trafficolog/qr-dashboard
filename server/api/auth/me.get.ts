import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session_token')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Не авторизован' })
  }

  const session = await authService.verifySession(token)
  if (!session) {
    deleteCookie(event, 'session_token', { path: '/' })
    throw createError({ statusCode: 401, message: 'Сессия истекла' })
  }

  return apiSuccess({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    avatarUrl: session.user.avatarUrl,
    csrfToken: session.csrfToken,
  })
})
