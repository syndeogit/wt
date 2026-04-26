import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      // h3 is a transitive dep (via nuxt/nitro); expose it to vitest so server
      // handler tests can import it directly and vi.mock('h3') can intercept.
      h3: resolve('./node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['packages/**/*.{test,spec}.ts', 'apps/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.nuxt/**', '**/.output/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.nuxt/**', '**/.output/**', '**/*.d.ts'],
    },
  },
})
