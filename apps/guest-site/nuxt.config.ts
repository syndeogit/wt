// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@pinia/nuxt', '@sentry/nuxt/module'],
  css: ['~/assets/css/main.css'],
  // Force light theme for MVP — dark theme is a separate design task.
  colorMode: { preference: 'light', fallback: 'light' },
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
      directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL,
      facebookPageUrl: process.env.NUXT_PUBLIC_FACEBOOK_PAGE_URL,
      sentryDsn: process.env.SENTRY_DSN,
      sentryEnvironment: process.env.SENTRY_ENVIRONMENT ?? 'development',
    },
  },
})
