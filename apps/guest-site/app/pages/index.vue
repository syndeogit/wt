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
    eyebrow: 'For first-timers',
    title: 'Wing for beginners, taught by people who taught themselves',
    body: 'Wingfoiling is the fastest-growing wind sport in the world — and the most beginner-friendly. Our coaches got into wing the same way you will: as a complete beginner. They know what felt impossible at hour one, and what clicks by hour six.',
  },
  {
    eyebrow: 'Chosen, not listed',
    title: 'Destinations we would book ourselves',
    body: 'Every centre we feature is somewhere we would go back to. One week at ION Karpathos, not a directory of a hundred places you have never heard of.',
  },
  {
    eyebrow: 'One trip, one confirmation',
    title: 'Stay and surf, bundled',
    body: 'Partner hotels with live availability. Book the week, the lessons, and the bed in the same session. Arrive to everything ready.',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="relative max-w-6xl mx-auto px-6 pt-24 pb-28 sm:pt-36 sm:pb-40">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-6 font-semibold">
          Wingfoil · Windsurf · Kitesurf · Karpathos, Greece
        </p>
        <h1
          class="font-display text-5xl sm:text-7xl leading-[1.02] text-primary-900 max-w-4xl text-pretty"
        >
          {{ appConfig.site.tagline }}
        </h1>
        <p class="mt-8 text-lg sm:text-xl text-primary-900 max-w-2xl leading-relaxed">
          {{ appConfig.site.description }}
        </p>
        <div class="mt-10 flex flex-col sm:flex-row gap-3">
          <UButton
            to="/wing"
            size="xl"
            class="rounded-full bg-accent-500 hover:bg-accent-600 text-white border-0 px-8"
          >
            Try wing in Karpathos →
          </UButton>
          <UButton
            to="/karpathos"
            size="xl"
            color="primary"
            variant="outline"
            class="rounded-full border-primary-900 text-primary-900 hover:bg-primary-900 hover:text-[color:var(--color-bg)]"
          >
            See the week
          </UButton>
        </div>
      </div>
    </section>

    <!-- Pillars -->
    <section class="border-y border-primary-200/60 bg-[color:var(--color-bg-elevated)]">
      <div class="max-w-6xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-3">
        <div v-for="p in pillars" :key="p.title">
          <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3 font-semibold">
            {{ p.eyebrow }}
          </p>
          <h2 class="font-display text-2xl text-primary-900 mb-3 leading-tight text-pretty">
            {{ p.title }}
          </h2>
          <p class="text-primary-900 leading-relaxed">{{ p.body }}</p>
        </div>
      </div>
    </section>

    <!-- Featured destination — split: text on paper-elevated card, image to the right -->
    <section class="max-w-6xl mx-auto px-6 py-24">
      <div class="grid gap-8 md:grid-cols-5 md:gap-12 items-stretch">
        <article
          class="md:col-span-2 bg-[color:var(--color-bg-elevated)] rounded-2xl p-8 sm:p-10 border border-primary-200/60 flex flex-col justify-between"
        >
          <div>
            <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
              Featured destination
            </p>
            <h2
              class="font-display text-3xl sm:text-4xl text-primary-900 leading-[1.05] text-pretty"
            >
              ION Karpathos, when the Meltemi wakes up.
            </h2>
            <p class="mt-6 text-primary-900 leading-relaxed">
              Thermal wind from morning, turquoise water you can stand in, instructors who grew up
              on this bay. Wing-curious to first-foiling in a week — if the wind cooperates, and on
              Karpathos in summer it usually does.
            </p>
          </div>
          <div class="mt-8 flex flex-wrap gap-3">
            <UButton
              to="/karpathos"
              size="lg"
              class="rounded-full bg-primary-900 hover:bg-primary-800 text-[color:var(--color-bg)] border-0"
            >
              Plan a week
            </UButton>
            <UButton
              to="/wing"
              variant="link"
              class="text-accent-700 hover:text-accent-800 underline-offset-4"
            >
              Wing-beginner programme →
            </UButton>
          </div>
        </article>
        <div class="md:col-span-3">
          <div
            role="img"
            aria-label="Placeholder for ION Karpathos hero photography. Real photo coming."
            class="aspect-[4/5] md:aspect-auto md:h-full rounded-2xl bg-gradient-to-br from-primary-400 via-primary-700 to-primary-950 overflow-hidden relative"
          >
            <div
              class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_50%)]"
              aria-hidden="true"
            />
            <div class="absolute bottom-6 left-6 right-6 text-[color:var(--color-bg)]">
              <p
                class="text-[10px] uppercase tracking-[0.25em] mb-2 text-[color:var(--color-bg)]/80"
              >
                Photography placeholder
              </p>
              <p class="text-sm leading-snug text-[color:var(--color-bg)]/90">
                Real Karpathos hero image lands here. Until then, navy stand-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Closing CTA strip — deep Mediterranean teal -->
    <section class="bg-primary-700">
      <div
        class="max-w-6xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-accent-200 mb-3 font-semibold">
            Start here
          </p>
          <h2
            class="font-display text-3xl sm:text-4xl leading-tight text-[color:var(--color-bg)] text-pretty"
          >
            Your first wing week, booked by Sunday.
          </h2>
        </div>
        <UButton
          to="/wing"
          size="xl"
          class="rounded-full bg-accent-500 hover:bg-accent-600 text-white border-0 px-8 shrink-0"
        >
          Plan a week →
        </UButton>
      </div>
    </section>
  </div>
</template>
