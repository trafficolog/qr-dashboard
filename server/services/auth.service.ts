import { createHmac, randomInt, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { eq, and, gt, isNull, desc, asc, count, sql } from 'drizzle-orm'
import { db } from '../db'
import { otpCodes, allowedDomains, users, sessions, authEmailLocks } from '../db/schema'
import { hashToken, hashOtpWithPepper } from '../utils/hash'
import { throwSecurityError } from '../utils/security-error'
import { emailService } from './email.service'

const runtimeConfig = useRuntimeConfig()
const otpPepper = runtimeConfig.otpPepper?.trim()
const adminEmail = runtimeConfig.adminEmail?.trim().toLowerCase()

if (!otpPepper) {
  throw new Error('OTP_PEPPER is required to start auth service')
}

function generateCsrfToken() {
  const secret = process.env.CSRF_SECRET || 'default-csrf-secret'
  const nonce = randomBytes(32).toString('hex')
  return createHmac('sha256', secret).update(nonce).digest('hex')
}

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
      throwSecurityError(undefined, {
        statusCode: 400,
        code: 'auth.email_invalid',
        message: 'Некорректный email',
      })
    }

    // Если список допустимых доменов пуст — разрешаем все домены (открытый режим).
    // Как только администратор добавляет хотя бы один активный домен,
    // включается режим белого списка.
    const activeDomainCount = await db
      .select({ count: count() })
      .from(allowedDomains)
      .where(eq(allowedDomains.isActive, true))

    const hasWhitelist = activeDomainCount[0]!.count > 0

    if (hasWhitelist) {
      const allowed = await db.query.allowedDomains.findFirst({
        where: and(
          eq(allowedDomains.domain, domain),
          eq(allowedDomains.isActive, true),
        ),
      })

      if (!allowed) {
        throwSecurityError(undefined, {
          statusCode: 403,
          code: 'auth.domain_not_allowed',
          message: 'Домен email не разрешён для входа',
        })
      }
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
      throwSecurityError(undefined, {
        statusCode: 429,
        code: 'auth.otp_rate_limited',
        message: 'Слишком много запросов. Попробуйте через 15 минут',
        retryAfter: 15 * 60,
      })
    }

    // 3. Генерация 6-значного OTP
    const code = String(randomInt(100000, 999999))

    // 4. Сохранение
    await db.insert(otpCodes).values({
      email,
      code: hashOtpWithPepper(code),
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
  async verifyOtp(email: string, code: string, event?: H3Event) {
    const now = new Date()
    const emailLower = email.toLowerCase()

    const activeEmailLock = await db.query.authEmailLocks.findFirst({
      where: and(
        eq(authEmailLocks.email, emailLower),
        gt(authEmailLocks.lockedUntil, now),
      ),
    })

    if (activeEmailLock) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((activeEmailLock.lockedUntil.getTime() - now.getTime()) / 1000),
      )

      if (event) {
        setResponseHeader(event, 'Retry-After', retryAfterSeconds)
        setResponseHeader(event, 'X-RateLimit-Limit', 5)
        setResponseHeader(event, 'X-RateLimit-Remaining', 0)
        setResponseHeader(event, 'X-RateLimit-Reset', Math.ceil(activeEmailLock.lockedUntil.getTime() / 1000))
      }

      throwSecurityError(event, {
        statusCode: 429,
        code: 'auth.otp_locked',
        message: 'Email временно заблокирован после неудачных попыток. Повторите позже',
        retryAfter: retryAfterSeconds,
      })
    }

    // 1. Найти последний активный OTP
    const otp = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.email, email),
        gt(otpCodes.expiresAt, now),
        isNull(otpCodes.usedAt),
      ),
      orderBy: desc(otpCodes.createdAt),
    })

    if (!otp) {
      throwSecurityError(undefined, {
        statusCode: 400,
        code: 'auth.otp_not_found',
        message: 'Код не найден или истёк. Запросите новый',
      })
    }

    // 2. Проверить attempts
    if (otp.attempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000)
      const retryAfterSeconds = 30 * 60

      await db.execute(sql`
        INSERT INTO auth_email_locks (email, locked_until, updated_at)
        VALUES (${emailLower}, ${lockUntil}, now())
        ON CONFLICT (email) DO UPDATE
        SET locked_until = EXCLUDED.locked_until,
            updated_at = now()
      `)

      if (event) {
        setResponseHeader(event, 'Retry-After', retryAfterSeconds)
        setResponseHeader(event, 'X-RateLimit-Limit', 5)
        setResponseHeader(event, 'X-RateLimit-Remaining', 0)
        setResponseHeader(event, 'X-RateLimit-Reset', Math.ceil(lockUntil.getTime() / 1000))
      }

      throwSecurityError(event, {
        statusCode: 429,
        code: 'auth.otp_locked',
        message: 'Попытки исчерпаны. Email временно заблокирован на 30 минут',
        retryAfter: retryAfterSeconds,
      })
    }

    // 3. Сравнить код
    if (otp.code !== hashOtpWithPepper(code)) {
      const nextAttempts = otp.attempts + 1
      await db
        .update(otpCodes)
        .set({ attempts: nextAttempts })
        .where(eq(otpCodes.id, otp.id))

      const remaining = 4 - otp.attempts
      if (nextAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000)
        const retryAfterSeconds = 30 * 60

        await db.execute(sql`
          INSERT INTO auth_email_locks (email, locked_until, updated_at)
          VALUES (${emailLower}, ${lockUntil}, now())
          ON CONFLICT (email) DO UPDATE
          SET locked_until = EXCLUDED.locked_until,
              updated_at = now()
        `)

        if (event) {
          setResponseHeader(event, 'Retry-After', retryAfterSeconds)
          setResponseHeader(event, 'X-RateLimit-Limit', 5)
          setResponseHeader(event, 'X-RateLimit-Remaining', 0)
          setResponseHeader(event, 'X-RateLimit-Reset', Math.ceil(lockUntil.getTime() / 1000))
        }

        throwSecurityError(event, {
          statusCode: 429,
          code: 'auth.otp_locked',
          message: 'Неверный код. Попытки исчерпаны, email временно заблокирован на 30 минут',
          retryAfter: retryAfterSeconds,
        })
      }

      throwSecurityError(undefined, {
        statusCode: 400,
        code: 'auth.otp_invalid',
        message: remaining > 0
          ? `Неверный код. Осталось попыток: ${remaining}`
          : 'Неверный код. Попытки исчерпаны, запросите новый',
        details: { remainingAttempts: Math.max(0, remaining) },
      })
    }

    // 4. Пометить как использованный
    await db
      .update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, otp.id))

    await db
      .delete(authEmailLocks)
      .where(eq(authEmailLocks.email, emailLower))

    // 5. Найти или создать пользователя
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      const userCount = await db.select({ count: count() }).from(users)

      let role: 'admin' | 'editor' | 'viewer' = 'viewer'
      if (userCount[0]!.count === 0) {
        if (!adminEmail) {
          throwSecurityError(undefined, {
            statusCode: 503,
            code: 'auth.bootstrap_admin_email_missing',
            message: 'ADMIN_EMAIL не задан. Первичный вход недоступен',
          })
        }

        if (email.toLowerCase() !== adminEmail) {
          throwSecurityError(undefined, {
            statusCode: 403,
            code: 'auth.bootstrap_email_mismatch',
            message: 'Первый пользователь должен совпадать с ADMIN_EMAIL',
            details: { adminEmail },
          })
        }

        role = 'admin'
      }

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
    const csrfToken = generateCsrfToken()

    await db.insert(sessions).values({
      userId: user.id,
      token: tokenHash,
      csrfToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
    })

    const nowForActiveSessions = new Date()
    const activeSessions = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(
        eq(sessions.userId, user.id),
        gt(sessions.expiresAt, nowForActiveSessions),
      ))

    if (activeSessions[0]!.count > 10) {
      const oldestActiveSession = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.userId, user.id),
          gt(sessions.expiresAt, nowForActiveSessions),
        ),
        orderBy: [
          asc(sessions.createdAt),
          asc(sessions.id),
        ],
      })

      if (oldestActiveSession) {
        await db
          .delete(sessions)
          .where(eq(sessions.id, oldestActiveSession.id))
      }
    }

    return {
      sessionToken: plainToken,
      csrfToken,
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

    return {
      user: session.user,
      csrfToken: session.csrfToken,
    }
  },

  /**
   * Завершение сессии
   */
  async logout(token: string) {
    const tokenHash = hashToken(token)
    await db.delete(sessions).where(eq(sessions.token, tokenHash))
  },
}
