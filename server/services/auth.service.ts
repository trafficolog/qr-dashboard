import { eq, and, gt, isNull, desc, count } from 'drizzle-orm'
import { randomInt, randomBytes } from 'node:crypto'
import { db } from '../db'
import { otpCodes, allowedDomains, users, sessions } from '../db/schema'
import { hashToken } from '../utils/hash'
import { emailService } from './email.service'

export const authService = {
  /**
   * Отправка OTP-кода на email
   * 1. Проверяет домен в allowed_domains
   * 2. Rate limit: ≤5 OTP за 15 мин на email
   * 3. Генерирует 6-значный код
   * 4. Сохраняет в otp_codes (TTL 10 мин)
   * 5. Отправляет email
   */
  async sendOtp(email: string) {
    // 1. Проверить домен
    const domain = email.split('@')[1]
    if (!domain) {
      throw createError({ statusCode: 400, message: 'Некорректный email' })
    }

    const allowed = await db.query.allowedDomains.findFirst({
      where: and(
        eq(allowedDomains.domain, domain),
        eq(allowedDomains.isActive, true),
      ),
    })

    if (!allowed) {
      throw createError({
        statusCode: 403,
        message: 'Домен email не разрешён для входа',
      })
    }

    // 2. Rate limit: не более 5 OTP за 15 мин
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
    const recentCodes = await db
      .select({ count: count() })
      .from(otpCodes)
      .where(and(
        eq(otpCodes.email, email),
        gt(otpCodes.createdAt, fifteenMinAgo),
      ))

    if (recentCodes[0]!.count >= 5) {
      throw createError({
        statusCode: 429,
        message: 'Слишком много запросов. Попробуйте через 15 минут',
      })
    }

    // 3. Генерация 6-значного OTP
    const code = String(randomInt(100000, 999999))

    // 4. Сохранение
    await db.insert(otpCodes).values({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    // 5. Отправка email
    await emailService.sendOtpEmail(email, code)

    return { success: true, expiresIn: 600 }
  },

  /**
   * Верификация OTP-кода
   * 1. Ищет последний активный OTP для email
   * 2. Проверяет attempts < 5
   * 3. Сравнивает код
   * 4. Создаёт/находит пользователя
   * 5. Создаёт сессию (token → hash в БД)
   */
  async verifyOtp(email: string, code: string) {
    // 1. Найти последний активный OTP
    const otp = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.email, email),
        gt(otpCodes.expiresAt, new Date()),
        isNull(otpCodes.usedAt),
      ),
      orderBy: desc(otpCodes.createdAt),
    })

    if (!otp) {
      throw createError({
        statusCode: 400,
        message: 'Код не найден или истёк. Запросите новый',
      })
    }

    // 2. Проверить attempts
    if (otp.attempts >= 5) {
      throw createError({
        statusCode: 429,
        message: 'Превышено количество попыток. Запросите новый код',
      })
    }

    // 3. Сравнить код
    if (otp.code !== code) {
      await db
        .update(otpCodes)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(otpCodes.id, otp.id))

      const remaining = 4 - otp.attempts
      throw createError({
        statusCode: 400,
        message: remaining > 0
          ? `Неверный код. Осталось попыток: ${remaining}`
          : 'Неверный код. Попытки исчерпаны, запросите новый',
      })
    }

    // 4. Пометить как использованный
    await db
      .update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, otp.id))

    // 5. Найти или создать пользователя
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      // Первый пользователь → admin, остальные → editor
      const userCount = await db.select({ count: count() }).from(users)
      const role = userCount[0]!.count === 0 ? 'admin' : 'editor'

      const [newUser] = await db
        .insert(users)
        .values({ email, role })
        .returning()
      user = newUser!
    }

    // Обновить lastLoginAt
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id))

    // 6. Создать сессию
    const plainToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(plainToken)

    await db.insert(sessions).values({
      userId: user.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
    })

    return {
      sessionToken: plainToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    }
  },

  /**
   * Верификация сессии по token
   * Продлевает сессию если до expiry < 7 дней
   */
  async verifySession(token: string) {
    const tokenHash = hashToken(token)

    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, tokenHash),
        gt(sessions.expiresAt, new Date()),
      ),
      with: { user: true },
    })

    if (!session) return null

    // Продлить сессию если до истечения осталось < 7 дней
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    if (session.expiresAt < sevenDaysFromNow) {
      await db
        .update(sessions)
        .set({
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(sessions.id, session.id))
    }

    return session.user
  },

  /**
   * Завершение сессии
   */
  async logout(token: string) {
    const tokenHash = hashToken(token)
    await db.delete(sessions).where(eq(sessions.token, tokenHash))
  },
}
