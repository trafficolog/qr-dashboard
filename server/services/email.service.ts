import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// --- Provider abstraction ---

interface EmailProvider {
  send(to: string, subject: string, html: string, options?: { consolePreview?: string }): Promise<void>
}

function isSmtpConfigured() {
  const config = useRuntimeConfig()

  return Boolean(
    config.smtpHost
    && config.smtpHost !== 'smtp.example.com'
    && config.smtpUser
    && config.smtpPassword,
  )
}

class SmtpProvider implements EmailProvider {
  private transporter: Transporter

  constructor(host: string, port: number, user: string, pass: string) {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }

  async send(to: string, subject: string, html: string) {
    const config = useRuntimeConfig()
    await this.transporter.sendMail({
      from: config.smtpFrom,
      to,
      subject,
      html,
    })
  }
}

class ConsoleProvider implements EmailProvider {
  async send(to: string, subject: string, _html: string, options?: { consolePreview?: string }) {
    console.log(`\n📧 ─────────────────────────────────`)
    console.log(`   TO:      ${to}`)
    console.log(`   SUBJECT: ${subject}`)
    console.log(`   BODY:    ${options?.consolePreview ?? '[REDACTED_IN_CONSOLE_PROVIDER]'}`)
    console.log(`─────────────────────────────────────\n`)
  }
}

// --- Singleton ---

let provider: EmailProvider | null = null

function getProvider(): EmailProvider {
  if (provider) return provider

  const config = useRuntimeConfig()
  if (isSmtpConfigured()) {
    console.log('[Email] Using SMTP provider')
    provider = new SmtpProvider(
      config.smtpHost,
      config.smtpPort,
      config.smtpUser,
      config.smtpPassword,
    )
  }
  else {
    console.warn('[Email] SMTP not configured — using console provider (dev mode)')
    provider = new ConsoleProvider()
  }

  return provider
}

// --- Public API ---

export const emailService = {
  async sendOtpEmail(email: string, code: string) {
    const config = useRuntimeConfig()
    const appName = config.public.appName

    const subject = `Код входа в ${appName}`
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="color: #2E7D32; margin: 0; font-size: 22px;">${appName}</h2>
    </div>
    <p style="color: #333; font-size: 16px; margin-bottom: 8px;">Здравствуйте!</p>
    <p style="color: #333; font-size: 16px; margin-bottom: 24px;">Ваш код для входа:</p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2E7D32; background: #E8F5E9; padding: 16px 32px; border-radius: 12px; display: inline-block;">
        ${code}
      </span>
    </div>
    <p style="color: #666; font-size: 14px;">Код действителен <strong>10 минут</strong>.</p>
    <p style="color: #666; font-size: 14px;">Если вы не запрашивали код, просто проигнорируйте это письмо.</p>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
    ${appName} &bull; Это письмо отправлено автоматически
  </p>
</body>
</html>`

    try {
      await getProvider().send(email, subject, html, {
        consolePreview: `Ваш код для входа: ${code}`,
      })
    }
    catch (error) {
      console.error('[Email] Failed to send OTP:', error)
      throw createError({
        statusCode: 500,
        message: 'Не удалось отправить код. Попробуйте позже',
      })
    }
  },

  async sendInviteEmail(email: string) {
    const config = useRuntimeConfig()
    const appName = config.public.appName
    const appUrl = (config.public as Record<string, string>).appUrl || 'http://localhost:3000'

    const subject = `Вас пригласили в ${appName}`
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="color: #2E7D32; margin: 0; font-size: 22px;">${appName}</h2>
    </div>
    <p style="color: #333; font-size: 16px; margin-bottom: 8px;">Здравствуйте!</p>
    <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
      Вас пригласили в команду <strong>${appName}</strong>.
      Для входа введите свой email и получите код подтверждения.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${appUrl}/auth/login"
         style="display: inline-block; background-color: #2E7D32; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600;">
        Войти в ${appName}
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">Если вы не ожидали это приглашение, просто проигнорируйте письмо.</p>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
    ${appName} &bull; Это письмо отправлено автоматически
  </p>
</body>
</html>`

    try {
      await getProvider().send(email, subject, html)
    }
    catch (error) {
      // Non-critical: user is already created; log but don't throw
      console.error('[Email] Failed to send invite:', error)
    }
  },
}
