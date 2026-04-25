<script setup lang="ts">
definePageMeta({
  middleware: [
    'admin-hotel',
    function () {
      const { user } = useCurrentUser()
      const hotels = user.value?.adminHotels ?? []
      if (hotels.length === 1) {
        return navigateTo(`/admin/hotel/bookings?hotel=${hotels[0]}`, { replace: true })
      }
    },
  ],
})

const { user } = useCurrentUser()

useHead({
  title: 'Hotel admin — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
      Hotel admin
    </p>
    <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
      Pick a hotel.
    </h1>
    <ul class="mt-10 space-y-3" aria-label="Hotels you administer">
      <li v-for="h in user?.adminHotels ?? []" :key="h">
        <UButton
          :to="`/admin/hotel/bookings?hotel=${h}`"
          size="lg"
          class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
        >
          <span class="font-mono text-sm" translate="no">{{ h }}</span>
        </UButton>
      </li>
    </ul>
  </div>
</template>
