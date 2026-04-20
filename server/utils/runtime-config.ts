export type RuntimeConfigValidationIssue = {
  key: string
  reason: string
}

function hasValue(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function isProxySchemeEnabled(config: ReturnType<typeof useRuntimeConfig>): boolean {
  return config.proxySchemeEnabled === true
}

export function validateRuntimeConfig(config: ReturnType<typeof useRuntimeConfig>): RuntimeConfigValidationIssue[] {
  const issues: RuntimeConfigValidationIssue[] = []

  const requiredServerVars: Array<{ key: string, value: unknown }> = [
    { key: 'OTP_PEPPER', value: config.otpPepper },
    { key: 'ADMIN_EMAIL', value: config.adminEmail },
    { key: 'CSRF_SECRET', value: config.csrfSecret },
  ]

  for (const variable of requiredServerVars) {
    if (!hasValue(variable.value)) {
      issues.push({
        key: variable.key,
        reason: 'Переменная не задана или пуста.',
      })
    }
  }

  if (isProxySchemeEnabled(config) && !hasValue(config.trustedProxies)) {
    issues.push({
      key: 'TRUSTED_PROXIES',
      reason: 'Обязательна при включённой proxy-схеме (PROXY_SCHEME_ENABLED=1).',
    })
  }

  return issues
}
