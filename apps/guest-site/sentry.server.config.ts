import * as Sentry from '@sentry/nuxt'

const dsn = process.env.SENTRY_DSN
const environment = process.env.SENTRY_ENVIRONMENT ?? 'development'

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  })
}
