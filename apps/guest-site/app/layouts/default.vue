<script setup lang="ts">
const appConfig = useAppConfig()
const { user } = useCurrentUser()

const nav = [
  { label: 'Destinations', to: '/destinations' },
  { label: 'Karpathos', to: '/karpathos' },
  { label: 'Wing for beginners', to: '/wing' },
  { label: 'Journal', to: '/journal' },
]

const footerExplore = [
  { label: 'Destinations', to: '/destinations' },
  { label: 'Karpathos', to: '/karpathos' },
  { label: 'Wing for beginners', to: '/wing' },
  { label: 'Journal', to: '/journal' },
]

const footerCompany = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[color:var(--color-bg)]">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary-900 focus:text-[color:var(--color-bg)]"
    >
      Skip to content
    </a>

    <header class="sticky top-0 z-40 border-b border-primary-200/60 bg-[color:var(--color-bg)]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink
          to="/"
          translate="no"
          class="flex items-center gap-3 font-display text-xl tracking-tight text-primary-900 hover:text-primary-950 transition-colors"
        >
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-accent-500" aria-hidden="true" />
          {{ appConfig.site.name }}
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-7 text-sm font-medium" aria-label="Primary">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="text-primary-900 hover:text-accent-600 transition-colors"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-2">
          <template v-if="user">
            <UButton
              to="/account"
              variant="ghost"
              color="primary"
              size="sm"
              class="hidden sm:inline-flex text-primary-900 hover:text-primary-950 hover:bg-primary-100 max-w-[14rem] truncate"
              :aria-label="`Account — signed in as ${user.email}`"
            >
              <span class="truncate" translate="no">{{ user.email }}</span>
            </UButton>
            <UButton
              to="/account"
              color="primary"
              variant="solid"
              size="sm"
              class="sm:hidden rounded-full bg-primary-900 hover:bg-primary-800 text-[color:var(--color-bg)]"
            >
              Account
            </UButton>
          </template>
          <template v-else>
            <UButton
              to="/login"
              variant="ghost"
              color="primary"
              size="sm"
              class="hidden sm:inline-flex text-primary-900 hover:text-primary-950 hover:bg-primary-100"
            >
              Sign in
            </UButton>
            <UButton
              to="/book"
              color="primary"
              variant="solid"
              size="sm"
              class="rounded-full bg-primary-900 hover:bg-primary-800 text-[color:var(--color-bg)]"
            >
              Book a week
            </UButton>
          </template>
        </div>
      </div>
    </header>

    <main id="main" class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-primary-200/60 mt-24 bg-[color:var(--color-bg-elevated)]">
      <div class="max-w-6xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4">
        <div class="md:col-span-2">
          <div translate="no" class="flex items-center gap-3 font-display text-lg text-primary-900">
            <span class="inline-block w-2 h-2 rounded-full bg-accent-500" aria-hidden="true" />
            {{ appConfig.site.name }}
          </div>
          <p class="mt-4 text-sm text-primary-900 max-w-sm leading-relaxed">
            {{ appConfig.site.description }}
          </p>
        </div>
        <nav aria-label="Footer — Explore">
          <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold mb-4">
            Explore
          </p>
          <ul class="space-y-2.5 text-sm">
            <li v-for="item in footerExplore" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="text-primary-900 hover:text-accent-600 transition-colors"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <nav aria-label="Footer — Company">
          <p class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold mb-4">
            Company
          </p>
          <ul class="space-y-2.5 text-sm">
            <li v-for="item in footerCompany" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="text-primary-900 hover:text-accent-600 transition-colors"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
      <div class="border-t border-primary-200/60">
        <div
          class="max-w-6xl mx-auto px-6 py-5 text-xs text-primary-700 flex items-center justify-between"
        >
          <span>© {{ new Date().getFullYear() }} {{ appConfig.site.name }}.</span>
          <span>Made for the wind.</span>
        </div>
      </div>
    </footer>
  </div>
</template>
