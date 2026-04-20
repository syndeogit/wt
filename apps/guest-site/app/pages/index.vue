<script setup lang="ts">
const appConfig = useAppConfig()

useHead({
  title: appConfig.site.name + ' — ' + appConfig.site.tagline,
  meta: [
    { name: 'description', content: appConfig.site.description },
    { property: 'og:title', content: appConfig.site.name },
    { property: 'og:description', content: appConfig.site.description },
  ],
})
</script>

<template>
  <section class="relative overflow-hidden">
    <div class="max-w-6xl mx-auto px-4 pt-20 pb-24 sm:pt-32 sm:pb-40">
      <p
        class="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4"
      >
        Windsurf · Kitesurf · Live the life
      </p>
      <h1 class="text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl">
        {{ appConfig.site.tagline }}
      </h1>
      <p class="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
        {{ appConfig.site.description }}
      </p>
      <div class="mt-10 flex flex-col sm:flex-row gap-3">
        <UButton to="/destinations" size="xl" color="primary" variant="solid"
          >Explore destinations</UButton
        >
        <UButton to="/karpathos" size="xl" color="primary" variant="outline"
          >ION Karpathos →</UButton
        >
      </div>
    </div>

    <div class="border-t border-zinc-200 dark:border-zinc-800">
      <div class="max-w-6xl mx-auto px-4 py-16 grid gap-10 sm:grid-cols-3">
        <div>
          <h2 class="font-semibold mb-2">Curated destinations</h2>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Hand-picked centres on the best windsurf spots in the Mediterranean — starting with ION
            Karpathos.
          </p>
        </div>
        <div>
          <h2 class="font-semibold mb-2">Real prices</h2>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Every lesson, rental, and package priced up front. No "from €X" tricks, no hidden
            add-ons.
          </p>
        </div>
        <div>
          <h2 class="font-semibold mb-2">Book the stay, not just the lesson</h2>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Bundle accommodation at partner hotels with live availability. One booking, one
            confirmation.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
