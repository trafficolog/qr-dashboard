import * as Sentry from '@sentry/node'

/**
 * Initialises Sentry for server-side error tracking.
 * Only active when SENTRY_DSN is set in the environment.
 */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  if (!config.sentryDsn) return

  Sentry.init({
    dsn: config.sentryDsn,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
  })

  console.log('[sentry] Server-side Sentry initialised')
})
