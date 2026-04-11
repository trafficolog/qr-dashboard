import { z } from 'zod'
import { authService } from '../../services/auth.service'

const verifySchema = z.object({
  email: z.string().email('Некорректный email'),
  code: z.string().length(6, 'Код должен содержать 6 цифр'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse)
  const { sessionToken, user } = await authService.verifyOtp(body.email, body.code)

  // Установить httpOnly cookie
  setCookie(event, 'session_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 дней в секундах
    path: '/',
  })

  return apiSuccess({ user })
})
