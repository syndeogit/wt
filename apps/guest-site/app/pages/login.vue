<script setup lang="ts">
useHead({
  title: 'Sign in — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const { $supabase } = useNuxtApp()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const { error: authError } = await $supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (authError) {
      error.value = authError.message
      await nextTick(() => emailInput.value?.focus())
      return
    }
    const redirect = (route.query.redirect as string) || '/account'
    await navigateTo(redirect, { external: true })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
      Welcome back
    </p>
    <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
      Sign in.
    </h1>
    <p class="mt-4 text-primary-700 leading-relaxed">
      New to WindTribe?
      <NuxtLink to="/signup" class="text-accent-600 hover:text-accent-700 underline underline-offset-4">
        Create an account
      </NuxtLink>
      instead.
    </p>

    <form class="mt-10 space-y-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="login-email" class="block text-sm font-medium text-primary-900 mb-1.5">
          Email
        </label>
        <input
          id="login-email"
          ref="emailInput"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          required
          spellcheck="false"
          class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label for="login-password" class="block text-sm font-medium text-primary-900 mb-1.5">
          Password
        </label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
          minlength="6"
          class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
        />
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
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </UButton>
    </form>
  </div>
</template>
