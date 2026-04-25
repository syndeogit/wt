<script setup lang="ts">
const config = useRuntimeConfig()
const fbPageUrl = computed(() => (config.public.facebookPageUrl as string) || '')

const fbEmbedSrc = computed(() => {
  if (!fbPageUrl.value) return ''
  const params = new URLSearchParams({
    href: fbPageUrl.value,
    tabs: 'timeline',
    width: '500',
    height: '700',
    small_header: 'false',
    adapt_container_width: 'true',
    hide_cover: 'false',
    show_facepile: 'false',
  })
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`
})

useHead({
  title: 'Journal — WindTribe',
  meta: [
    {
      name: 'description',
      content: 'Live from ION Karpathos — wind, water, and whatever the team posts.',
    },
  ],
})
</script>

<template>
  <article class="max-w-6xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      From the water
    </p>
    <h1 class="font-display text-5xl sm:text-6xl text-primary-900 leading-[1.05] text-pretty">
      Journal.
    </h1>
    <p class="mt-6 text-lg text-primary-900 max-w-2xl leading-relaxed">
      Live from ION Karpathos. Conditions, sunrise photos, the day’s mood. We don’t schedule
      or filter — it’s whatever the team posts, when they post it.
    </p>

    <div class="mt-14 grid gap-10 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <template v-if="fbEmbedSrc">
          <div
            class="overflow-hidden rounded-2xl border border-primary-200/60 bg-[color:var(--color-bg-elevated)]"
          >
            <iframe
              :src="fbEmbedSrc"
              title="ION Karpathos on Facebook"
              class="w-full block"
              style="height: 700px; border: 0"
              loading="lazy"
              allow="encrypted-media"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
          <p class="mt-3 text-xs text-primary-700">
            Feed not loading? Some privacy extensions block embeds from facebook.com — open the
            <a
              :href="fbPageUrl"
              target="_blank"
              rel="noopener"
              class="underline underline-offset-4 text-accent-700 hover:text-accent-800"
              >page directly</a
            >
            instead.
          </p>
        </template>
        <template v-else>
          <p class="text-primary-700">Feed coming soon.</p>
        </template>
      </div>

      <aside class="lg:col-span-1">
        <div
          class="bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
        >
          <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
            What you’re seeing
          </p>
          <h2 class="font-display text-2xl text-primary-900 leading-tight text-pretty">
            ION Karpathos, live.
          </h2>
          <p class="mt-3 text-sm text-primary-700 leading-relaxed">
            The ION Karpathos team’s own Facebook timeline. Wind reports the morning of, session
            footage in the afternoon, taverna shots at sunset. Worth a check the week before you
            travel.
          </p>
        </div>
      </aside>
    </div>
  </article>
</template>
