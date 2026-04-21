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

const pillars = [
  {
    eyebrow: 'Chosen, not listed',
    title: 'Destinations we would go back to',
    body: 'Every centre we feature is somewhere we would book for ourselves. One week at ION Karpathos, not a directory of a hundred places you have never heard of.',
  },
  {
    eyebrow: 'Priced in full',
    title: 'The price is the price',
    body: 'Boards, coaching, transfers, accommodation — all shown upfront. No "from €X" tricks, no surprise add-ons at checkout.',
  },
  {
    eyebrow: 'One trip, one confirmation',
    title: 'Stay and surf, bundled',
    body: 'Partner hotels with live availability. Book the week, the lesson, and the bed in the same session. Arrive to everything ready.',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-b from-[color:var(--color-paper)] via-[color:var(--color-paper)] to-[color:var(--color-paper-elevated)]"
      />
      <div class="relative max-w-6xl mx-auto px-6 pt-24 pb-28 sm:pt-36 sm:pb-40">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-6">
          Karpathos · Greek Aegean · Meltemi season
        </p>
        <h1 class="font-display text-5xl sm:text-7xl leading-[1.02] text-primary-900 max-w-4xl">
          {{ appConfig.site.tagline }}
        </h1>
        <p class="mt-8 text-lg sm:text-xl text-primary-700 max-w-2xl leading-relaxed">
          {{ appConfig.site.description }}
        </p>
        <div class="mt-10 flex flex-col sm:flex-row gap-3">
          <UButton to="/karpathos" size="xl" color="primary" variant="solid" class="rounded-full">
            Plan a week in Karpathos
          </UButton>
          <UButton
            to="/destinations"
            size="xl"
            color="primary"
            variant="ghost"
            class="rounded-full"
          >
            See all destinations →
          </UButton>
        </div>
      </div>
    </section>

    <!-- Pillars -->
    <section class="border-y border-primary-900/10 bg-[color:var(--color-paper-elevated)]">
      <div class="max-w-6xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-3">
        <div v-for="p in pillars" :key="p.title">
          <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3">{{ p.eyebrow }}</p>
          <h2 class="font-display text-2xl text-primary-900 mb-3 leading-tight">{{ p.title }}</h2>
          <p class="text-primary-700 leading-relaxed">{{ p.body }}</p>
        </div>
      </div>
    </section>

    <!-- Featured destination tease -->
    <section class="max-w-6xl mx-auto px-6 py-24">
      <div class="grid gap-10 md:grid-cols-5 md:gap-16 items-end">
        <div class="md:col-span-2">
          <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3">
            Featured destination
          </p>
          <h2 class="font-display text-4xl sm:text-5xl text-primary-900 leading-[1.05]">
            ION Karpathos, when the Meltemi wakes up.
          </h2>
          <p class="mt-6 text-primary-700 leading-relaxed">
            Thermal wind from morning, turquoise water you can stand in, instructors who grew up on
            this bay. Beginner to intermediate in a week — if the wind cooperates, and it usually
            does.
          </p>
          <UButton
            to="/karpathos"
            color="primary"
            variant="outline"
            size="lg"
            class="mt-8 rounded-full"
          >
            See the week →
          </UButton>
        </div>
        <div class="md:col-span-3">
          <div
            class="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary-500 via-primary-700 to-primary-950 overflow-hidden relative"
          >
            <div
              class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.2),transparent_50%)]"
            />
            <div class="absolute bottom-6 left-6 right-6 text-[color:var(--color-paper)]">
              <p class="text-xs uppercase tracking-[0.2em] opacity-80 mb-2">Photography</p>
              <p class="font-display text-xl leading-tight">
                Swap this gradient for a real Karpathos hero image when photography lands.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer CTA strip -->
    <section class="bg-primary-900 text-[color:var(--color-paper)]">
      <div
        class="max-w-6xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-accent-400 mb-3">Start here</p>
          <h2 class="font-display text-3xl sm:text-4xl leading-tight">
            Your next wind holiday, booked by Sunday.
          </h2>
        </div>
        <UButton
          to="/karpathos"
          size="xl"
          color="primary"
          variant="solid"
          class="rounded-full bg-accent-500 hover:bg-accent-600 border-accent-500 hover:border-accent-600 text-white"
        >
          Plan a week →
        </UButton>
      </div>
    </section>
  </div>
</template>
