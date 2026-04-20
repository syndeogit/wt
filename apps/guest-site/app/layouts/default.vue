<script setup lang="ts">
const appConfig = useAppConfig()

const nav = [
  { label: 'Destinations', to: '/destinations' },
  { label: 'About', to: '/about' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
    <header
      class="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur"
    >
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span class="inline-block w-6 h-6 rounded-full bg-primary-500" aria-hidden="true" />
          {{ appConfig.site.name }}
        </NuxtLink>
        <nav class="hidden sm:flex items-center gap-6 text-sm">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <UButton to="/book" color="primary" variant="solid" size="sm">Book</UButton>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-16">
      <div
        class="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-zinc-500"
      >
        <span
          >© {{ new Date().getFullYear() }} {{ appConfig.site.name }}. All rights reserved.</span
        >
        <span class="flex gap-6">
          <NuxtLink to="/terms" class="hover:text-zinc-900 dark:hover:text-zinc-50">Terms</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-zinc-900 dark:hover:text-zinc-50"
            >Privacy</NuxtLink
          >
          <NuxtLink to="/contact" class="hover:text-zinc-900 dark:hover:text-zinc-50"
            >Contact</NuxtLink
          >
        </span>
      </div>
    </footer>
  </div>
</template>
