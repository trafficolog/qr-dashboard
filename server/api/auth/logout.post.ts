import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session_token')
  if (token) {
    await authService.logout(token)
  }

  deleteCookie(event, 'session_token', { path: '/' })

  return apiSuccess({ success: true })
})
