<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useHead({
  title: 'Your account — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const { $supabase } = useNuxtApp()
const { user } = useCurrentUser()
const signingOut = ref(false)

async function onSignOut() {
  signingOut.value = true
  try {
    await $supabase.auth.signOut()
    await navigateTo('/', { external: true })
  } finally {
    signingOut.value = false
  }
}

const memberSince = computed(() => {
  if (!user.value?.createdAt) return null
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(user.value.createdAt))
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
      Signed in
    </p>
    <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
      Your account.
    </h1>

    <section class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8">
      <dl class="space-y-4">
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">Email</dt>
          <dd class="mt-1 text-primary-900 break-all" translate="no">{{ user?.email ?? '—' }}</dd>
        </div>
        <div v-if="memberSince">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-500 font-semibold">
            Member since
          </dt>
          <dd class="mt-1 text-primary-900">{{ memberSince }}</dd>
        </div>
      </dl>
    </section>

    <div class="mt-10 flex flex-wrap gap-3">
      <UButton
        to="/karpathos"
        size="lg"
        class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
      >
        Browse Karpathos
      </UButton>
      <UButton
        :loading="signingOut"
        :disabled="signingOut"
        size="lg"
        variant="outline"
        color="primary"
        class="rounded-full border-primary-900 text-primary-900 hover:bg-primary-100"
        @click="onSignOut"
      >
        {{ signingOut ? 'Signing out…' : 'Sign out' }}
      </UButton>
    </div>
  </div>
</template>
