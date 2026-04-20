import { z } from 'zod'
import { authService } from '../../services/auth.service'
import { recordAudit } from '../../utils/audit'

const verifySchema = z.object({
  email: z.string().email('Некорректный email'),
  code: z.string().length(6, 'Код должен содержать 6 цифр'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse)
  const { sessionToken, user, csrfToken } = await authService.verifyOtp(body.email, body.code, event)

  // Установить httpOnly cookie
  setCookie(event, 'session_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 дней в секундах
    path: '/',
  })

  recordAudit(
    {
      userId: user.id,
      action: 'auth.verify',
      entityType: 'session',
      entityId: user.id,
    },
    { details: { email: body.email } },
  )

  return apiSuccess({ user, csrfToken })
})
