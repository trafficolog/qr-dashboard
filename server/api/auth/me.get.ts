import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session_token')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Не авторизован' })
  }

  const user = await authService.verifySession(token)
  if (!user) {
    deleteCookie(event, 'session_token', { path: '/' })
    throw createError({ statusCode: 401, message: 'Сессия истекла' })
  }

  return apiSuccess({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
  })
})
