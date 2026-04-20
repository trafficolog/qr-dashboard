import { authService } from '../../services/auth.service'
import { recordAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session_token')
  const user = event.context.user
  if (token) {
    await authService.logout(token)
  }

  recordAudit(
    {
      userId: user?.id ?? null,
      action: 'auth.logout',
      entityType: 'session',
      entityId: user?.id ?? null,
    },
  )

  deleteCookie(event, 'session_token', { path: '/' })

  return apiSuccess({ success: true })
})
