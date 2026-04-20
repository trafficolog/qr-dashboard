interface SecurityErrorPayload {
  error?: {
    code?: string
    message?: string
    details?: Record<string, unknown> | null
    retryAfter?: number
  }
}

interface ParsedSecurityError {
  code: string | null
  message: string | null
  details: Record<string, unknown> | null
  retryAfter: number | null
}

const SECURITY_CODE_TO_I18N_KEY: Record<string, string> = {
  'auth.unauthorized': 'security.authUnauthorized',
  'auth.session_expired': 'security.authSessionExpired',
  'auth.email_invalid': 'security.authEmailInvalid',
  'auth.domain_not_allowed': 'security.authDomainNotAllowed',
  'auth.otp_rate_limited': 'security.authOtpRateLimited',
  'auth.otp_not_found': 'security.authOtpNotFound',
  'auth.otp_invalid': 'security.authOtpInvalid',
  'auth.otp_locked': 'security.authOtpLocked',
  'auth.bootstrap_admin_email_missing': 'security.authBootstrapAdminMissing',
  'auth.bootstrap_email_mismatch': 'security.authBootstrapEmailMismatch',
  'csrf.missing_origin_or_referer': 'security.csrfMissingOriginOrReferer',
  'csrf.origin_mismatch': 'security.csrfOriginMismatch',
  'csrf.referer_mismatch': 'security.csrfRefererMismatch',
  'csrf.missing_token': 'security.csrfMissingToken',
  'csrf.invalid_token': 'security.csrfInvalidToken',
  'api_key.invalid': 'security.apiKeyInvalid',
  'api_key.scope_denied': 'security.apiKeyScopeDenied',
  'api_key.ip_denied': 'security.apiKeyIpDenied',
  'rate_limit.exceeded': 'security.rateLimitExceeded',
  'rate_limit.ip_temp_banned': 'security.rateLimitIpTempBanned',
}

export function useSecurityError() {
  const { t } = useI18n()

  function parseSecurityError(error: unknown): ParsedSecurityError {
    const err = error as {
      data?: SecurityErrorPayload
      statusMessage?: string
      message?: string
    }

    const apiError = err?.data?.error

    return {
      code: apiError?.code ?? null,
      message: apiError?.message ?? err?.statusMessage ?? err?.message ?? null,
      details: (apiError?.details as Record<string, unknown> | null | undefined) ?? null,
      retryAfter: typeof apiError?.retryAfter === 'number' ? apiError.retryAfter : null,
    }
  }

  function getSecurityMessage(error: unknown, fallback: string): string {
    const parsed = parseSecurityError(error)

    if (parsed.code && SECURITY_CODE_TO_I18N_KEY[parsed.code]) {
      const retrySuffix = parsed.retryAfter
        ? ` ${t('security.retryAfterSeconds', { seconds: parsed.retryAfter })}`
        : ''

      return `${t(SECURITY_CODE_TO_I18N_KEY[parsed.code])}${retrySuffix}`
    }

    return parsed.message || fallback
  }

  return {
    parseSecurityError,
    getSecurityMessage,
  }
}
