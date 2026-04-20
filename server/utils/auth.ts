import type { H3Event } from 'h3'
import type { User } from '~/shared/types/auth'

export function requireAuth(event: H3Event): User {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Не авторизован' })
  }
  return user as User
}

export function requireAdmin(event: H3Event): User {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Недостаточно прав' })
  }
  return user
}
