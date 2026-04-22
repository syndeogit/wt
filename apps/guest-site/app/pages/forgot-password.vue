<script setup lang="ts">
useHead({
  title: 'Reset password — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const { $supabase } = useNuxtApp()

const email = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const submitted = ref(false)
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const { error: authError } = await $supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (authError) {
      error.value = authError.message
      await nextTick(() => emailInput.value?.focus())
      return
    }
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
        Forgot your password?
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Reset it.
      </h1>
      <p class="mt-4 text-primary-700 leading-relaxed">
        Enter the email you signed up with and we’ll send you a link to set a new password.
      </p>

      <form class="mt-10 space-y-5" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="forgot-email" class="block text-sm font-medium text-primary-900 mb-1.5">
            Email
          </label>
          <input
            id="forgot-email"
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
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </UButton>

        <p class="text-sm text-primary-700">
          Remembered it?
          <NuxtLink to="/login" class="text-accent-600 hover:text-accent-700 underline underline-offset-4">
            Sign in
          </NuxtLink>
        </p>
      </form>
    </template>

    <template v-else>
      <div role="status" aria-live="polite">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-3 font-semibold">
          Sent
        </p>
        <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
          Check your inbox.
        </h1>
      </div>
      <p class="mt-6 text-primary-900 leading-relaxed">
        If an account exists for
        <span class="font-semibold" translate="no">{{ email }}</span>, a reset link is on its way.
      </p>
      <p class="mt-4 text-sm text-primary-700 leading-relaxed">
        The link lands on this site and asks you to pick a new password. If nothing arrives, check
        spam or
        <NuxtLink to="/forgot-password" class="text-accent-600 hover:text-accent-700 underline underline-offset-4">
          try again
        </NuxtLink>.
      </p>
    </template>
  </div>
</template>
