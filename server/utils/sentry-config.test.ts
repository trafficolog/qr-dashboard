import { describe, expect, it } from 'vitest'
import { createSentryNodeOptions } from './sentry-config'

describe('sentry v9 contract', () => {
  it('builds node options with stable defaults', () => {
    const options = createSentryNodeOptions({
      dsn: 'https://public@sentry.example/1',
      environment: 'test',
      release: 'splat-qr@0.13.0',
    })

    expect(options).toMatchObject({
      dsn: 'https://public@sentry.example/1',
      environment: 'test',
      release: 'splat-qr@0.13.0',
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    })
  })
})
