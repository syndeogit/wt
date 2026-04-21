<script setup lang="ts">
const appConfig = useAppConfig()

const nav = [
  { label: 'Destinations', to: '/destinations' },
  { label: 'Karpathos', to: '/karpathos' },
  { label: 'Journal', to: '/journal' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header
      class="sticky top-0 z-40 border-b border-primary-900/10 bg-[color:var(--color-paper)]/85 backdrop-blur"
    >
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3 font-display text-xl tracking-tight">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-accent-500" aria-hidden="true" />
          {{ appConfig.site.name }}
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-8 text-sm text-primary-700">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="hover:text-primary-900 transition-colors"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-3">
          <UButton
            to="/login"
            variant="ghost"
            color="primary"
            size="sm"
            class="hidden sm:inline-flex"
          >
            Sign in
          </UButton>
          <UButton to="/book" color="primary" variant="solid" size="sm">Book a week</UButton>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-primary-900/10 mt-24 bg-[color:var(--color-paper-elevated)]">
      <div class="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4">
        <div class="md:col-span-2">
          <div class="flex items-center gap-3 font-display text-lg">
            <span class="inline-block w-2 h-2 rounded-full bg-accent-500" aria-hidden="true" />
            {{ appConfig.site.name }}
          </div>
          <p class="mt-3 text-sm text-primary-700 max-w-sm leading-relaxed">
            {{ appConfig.site.description }}
          </p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-widest text-primary-500 mb-3">Explore</p>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/destinations" class="hover:text-accent-600">Destinations</NuxtLink>
            </li>
            <li><NuxtLink to="/karpathos" class="hover:text-accent-600">Karpathos</NuxtLink></li>
            <li><NuxtLink to="/journal" class="hover:text-accent-600">Journal</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="text-xs uppercase tracking-widest text-primary-500 mb-3">Company</p>
          <ul class="space-y-2 text-sm">
            <li><NuxtLink to="/about" class="hover:text-accent-600">About</NuxtLink></li>
            <li><NuxtLink to="/contact" class="hover:text-accent-600">Contact</NuxtLink></li>
            <li><NuxtLink to="/terms" class="hover:text-accent-600">Terms</NuxtLink></li>
            <li><NuxtLink to="/privacy" class="hover:text-accent-600">Privacy</NuxtLink></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-primary-900/10">
        <div
          class="max-w-6xl mx-auto px-6 py-6 text-xs text-primary-500 flex items-center justify-between"
        >
          <span>© {{ new Date().getFullYear() }} {{ appConfig.site.name }}.</span>
          <span>Made for the wind.</span>
        </div>
      </div>
    </footer>
  </div>
</template>
