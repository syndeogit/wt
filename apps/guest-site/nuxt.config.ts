// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@sentry/nuxt/module'],
  sentry: {
    sourceMapsUploadOptions: {
      org: 'syndeo-wh',
      project: 'windtribe-guest',
      url: 'https://de.sentry.io/',
    },
  },
  sourcemap: { client: 'hidden' },
  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
      },
    },
  },
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      sentryDsn: process.env.SENTRY_DSN,
      sentryEnvironment: process.env.SENTRY_ENVIRONMENT ?? 'development',
    },
  },
})
