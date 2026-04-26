// vitest.setup.server.ts
// Provides Nitro/h3 auto-import globals for server handler unit tests.
// Nuxt injects these at runtime; vitest needs them explicitly.
import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
} from 'h3'

Object.assign(globalThis, {
  defineEventHandler,
  getRouterParam,
  getQuery,
  createError,
})
