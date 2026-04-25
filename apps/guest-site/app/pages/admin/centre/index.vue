<script setup lang="ts">
definePageMeta({
  middleware: [
    'admin-centre',
    function () {
      // One-centre MVP: jump straight to that centre's bookings on both
      // server and client so the picker doesn't flash for the common case.
      const { user } = useCurrentUser()
      const centres = user.value?.adminCentres ?? []
      if (centres.length === 1) {
        return navigateTo(`/admin/centre/bookings?centre=${centres[0]}`, {
          replace: true,
        })
      }
    },
  ],
})

const { user } = useCurrentUser()

useHead({
  title: 'Centre admin — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
      Centre admin
    </p>
    <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
      Pick a centre.
    </h1>
    <ul class="mt-10 space-y-3" aria-label="Centres you administer">
      <li v-for="c in user?.adminCentres ?? []" :key="c">
        <UButton
          :to="`/admin/centre/bookings?centre=${c}`"
          size="lg"
          class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
        >
          <span translate="no">{{ c }}</span>
        </UButton>
      </li>
    </ul>
  </div>
</template>
