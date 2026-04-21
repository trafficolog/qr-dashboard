import type { NodeOptions } from '@sentry/node'

interface CreateSentryNodeOptionsInput {
  dsn: string
  environment?: string
  release?: string
}

export function createSentryNodeOptions(input: CreateSentryNodeOptionsInput): NodeOptions {
  return {
    dsn: input.dsn,
    environment: input.environment || 'production',
    release: input.release,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  }
}
