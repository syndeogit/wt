import * as Sentry from '@sentry/nuxt'

const dsn = useRuntimeConfig().public.sentryDsn
const environment = useRuntimeConfig().public.sentryEnvironment

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })
}
