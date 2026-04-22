<script setup lang="ts">
useHead({
  title: 'Create account — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const { $supabase } = useNuxtApp()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const submitted = ref(false)
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const { data, error: authError } = await $supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (authError) {
      error.value = authError.message
      await nextTick(() => emailInput.value?.focus())
      return
    }
    if (data.session) {
      // Instant sign-in (email confirmation off) — jump to account.
      await navigateTo('/account', { external: true })
      return
    }
    // Email confirmation required — show the check-your-inbox state.
    submitted.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-6 py-20">
    <template v-if="!submitted">
      <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
        Start here
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Create your account.
      </h1>
      <p class="mt-4 text-primary-700 leading-relaxed">
        Already have one?
        <NuxtLink to="/login" class="text-accent-600 hover:text-accent-700 underline underline-offset-4">
          Sign in
        </NuxtLink>
        instead.
      </p>

      <form class="mt-10 space-y-5" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="signup-email" class="block text-sm font-medium text-primary-900 mb-1.5">
            Email
          </label>
          <input
            id="signup-email"
            ref="emailInput"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            spellcheck="false"
            class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label for="signup-password" class="block text-sm font-medium text-primary-900 mb-1.5">
            Password
          </label>
          <input
            id="signup-password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="new-password"
            required
            minlength="6"
            class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            placeholder="At least 6 characters"
          />
          <p class="mt-1.5 text-xs text-primary-500">Minimum 6 characters.</p>
        </div>

        <p
          v-if="error"
          aria-live="polite"
          class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {{ error }}
        </p>

        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading"
          size="lg"
          class="w-full justify-center rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
        >
          {{ loading ? 'Creating…' : 'Create account' }}
        </UButton>
      </form>
    </template>

    <template v-else>
      <div role="status" aria-live="polite">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
          Almost there
        </p>
        <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
          Check your inbox.
        </h1>
      </div>
      <p class="mt-6 text-primary-900 leading-relaxed">
        We sent a confirmation link to
        <span class="font-semibold">{{ email }}</span
        >. Click it to finish signing up.
      </p>
      <p class="mt-4 text-sm text-primary-700 leading-relaxed">
        If nothing arrives in a minute or two, check spam — or
        <NuxtLink to="/login" class="text-accent-600 hover:text-accent-700 underline underline-offset-4">
          sign in
        </NuxtLink>
        if you already confirmed.
      </p>
    </template>
  </div>
</template>
