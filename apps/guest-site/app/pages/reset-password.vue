<script setup lang="ts">
useHead({
  title: 'Set a new password — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const { $supabase } = useNuxtApp()

const ready = ref(false)
const password = ref('')
const confirm = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const passwordInput = useTemplateRef<HTMLInputElement>('passwordInput')

// Supabase restores the recovery session automatically via the URL hash
// on the browser client. We show the form as soon as a session exists,
// or after the PASSWORD_RECOVERY event fires.
onMounted(async () => {
  const { data } = await $supabase.auth.getSession()
  if (data.session) ready.value = true
  const { data: sub } = $supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') ready.value = true
  })
  onBeforeUnmount(() => sub.subscription.unsubscribe())
})

async function onSubmit() {
  error.value = null
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    await nextTick(() => passwordInput.value?.focus())
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    await nextTick(() => passwordInput.value?.focus())
    return
  }
  loading.value = true
  try {
    const { error: authError } = await $supabase.auth.updateUser({
      password: password.value,
    })
    if (authError) {
      error.value = authError.message
      await nextTick(() => passwordInput.value?.focus())
      return
    }
    await navigateTo('/account', { external: true })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-6 py-20">
    <template v-if="!ready">
      <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
        Reset password
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Waiting for link.
      </h1>
      <p class="mt-6 text-primary-900 leading-relaxed">
        This page only works when you arrive from the email we sent. If nothing is loading, request
        a fresh
        <NuxtLink
          to="/forgot-password"
          class="text-accent-700 hover:text-accent-800 underline underline-offset-4"
        >
          reset link
        </NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">
        Almost there
      </p>
      <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
        Set a new password.
      </h1>
      <p class="mt-4 text-primary-700 leading-relaxed">
        Pick something you’ll remember. Minimum 6 characters.
      </p>

      <form class="mt-10 space-y-5" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="new-password" class="block text-sm font-medium text-primary-900 mb-1.5">
            New password
          </label>
          <input
            id="new-password"
            ref="passwordInput"
            v-model="password"
            type="password"
            name="new-password"
            autocomplete="new-password"
            required
            minlength="6"
            class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
          />
        </div>
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-primary-900 mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            v-model="confirm"
            type="password"
            name="confirm-password"
            autocomplete="new-password"
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
          {{ loading ? 'Saving…' : 'Save new password' }}
        </UButton>
      </form>
    </template>
  </div>
</template>
