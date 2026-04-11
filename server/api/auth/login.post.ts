import { z } from 'zod'
import { authService } from '../../services/auth.service'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const result = await authService.sendOtp(body.email)
  return apiSuccess(result)
})
