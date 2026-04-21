import * as Sentry from '@sentry/node'
import { createSentryNodeOptions } from '../utils/sentry-config'

/**
 * Initialises Sentry for server-side error tracking.
 * Only active when SENTRY_DSN is set in the environment.
 */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  if (!config.sentryDsn) return

  Sentry.init(
    createSentryNodeOptions({
      dsn: config.sentryDsn,
      environment: process.env.NODE_ENV,
      release: process.env.NUXT_APP_VERSION,
    }),
  )

  console.log('[sentry] Server-side Sentry initialised')
})
