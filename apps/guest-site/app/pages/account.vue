<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useHead({
  title: 'Your account — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

interface RiderProfileRow {
  first_name: string
  last_name: string
  phone: string | null
  primary_discipline: string | null
  level: string | null
  notes: string | null
}

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

// Rider profile ────────────────────────────────────────────────────────────
const { data: profileRes, refresh: refreshProfile } = await useFetch<{
  profile: RiderProfileRow | null
}>('/api/profile', { key: 'account-profile', default: () => ({ profile: null }) })

const profile = computed(() => profileRes.value?.profile ?? null)
const editing = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  primaryDiscipline: '',
  level: '',
  notes: '',
})

function loadFormFromProfile() {
  const p = profile.value
  form.firstName = p?.first_name ?? ''
  form.lastName = p?.last_name ?? ''
  form.phone = p?.phone ?? ''
  form.primaryDiscipline = p?.primary_discipline ?? ''
  form.level = p?.level ?? ''
  form.notes = p?.notes ?? ''
}
loadFormFromProfile()
watch(profile, loadFormFromProfile)

function startEdit() {
  saveError.value = null
  loadFormFromProfile()
  editing.value = true
}
function cancelEdit() {
  editing.value = false
  saveError.value = null
}

async function saveProfile() {
  saveError.value = null
  if (!form.firstName.trim() || !form.lastName.trim()) {
    saveError.value = 'First and last name are required.'
    return
  }
  saving.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        primaryDiscipline: form.primaryDiscipline || null,
        level: form.level || null,
        notes: form.notes,
      },
    })
    await refreshProfile()
    editing.value = false
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    saveError.value = err?.data?.statusMessage || err?.message || 'Failed to save.'
  } finally {
    saving.value = false
  }
}

const disciplineLabels: Record<string, string> = {
  wingfoil: 'Wingfoil',
  windsurf: 'Windsurf',
  kitesurf: 'Kitesurf',
}
const levelLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-20">
    <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-3 font-semibold">Signed in</p>
    <h1 class="font-display text-4xl sm:text-5xl text-primary-900 leading-tight text-pretty">
      Your account.
    </h1>

    <!-- Account details -->
    <section
      class="mt-10 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
    >
      <dl class="space-y-4">
        <div>
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Email</dt>
          <dd class="mt-1 text-primary-900 break-all" translate="no">{{ user?.email ?? '—' }}</dd>
        </div>
        <div v-if="memberSince">
          <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
            Member since
          </dt>
          <dd class="mt-1 text-primary-900">{{ memberSince }}</dd>
        </div>
      </dl>
    </section>

    <!-- Rider profile -->
    <section
      class="mt-6 bg-[color:var(--color-bg-elevated)] rounded-2xl border border-primary-200/60 p-6 sm:p-8"
      aria-labelledby="rider-profile-heading"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-accent-700 mb-1 font-semibold">
            Rider profile
          </p>
          <h2
            id="rider-profile-heading"
            class="font-display text-2xl text-primary-900 leading-tight text-pretty"
          >
            Who you are on the water.
          </h2>
        </div>
        <UButton
          v-if="!editing"
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full border-primary-900 text-primary-900 hover:bg-primary-100"
          @click="startEdit"
        >
          {{ profile ? 'Edit' : 'Add details' }}
        </UButton>
      </div>

      <!-- View mode -->
      <template v-if="!editing">
        <p v-if="!profile" class="mt-6 text-primary-700">
          Not set yet. Add your details so future bookings don’t have to ask.
        </p>
        <dl v-else class="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">Name</dt>
            <dd class="mt-1 text-primary-900" translate="no">
              {{ profile.first_name }} {{ profile.last_name }}
            </dd>
          </div>
          <div v-if="profile.phone">
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Phone
            </dt>
            <dd class="mt-1 text-primary-900 tabular-nums" translate="no">{{ profile.phone }}</dd>
          </div>
          <div v-if="profile.primary_discipline">
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Main discipline
            </dt>
            <dd class="mt-1 text-primary-900">
              {{ disciplineLabels[profile.primary_discipline] ?? profile.primary_discipline }}
            </dd>
          </div>
          <div v-if="profile.level">
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Level
            </dt>
            <dd class="mt-1 text-primary-900">
              {{ levelLabels[profile.level] ?? profile.level }}
            </dd>
          </div>
          <div v-if="profile.notes" class="sm:col-span-2">
            <dt class="text-xs uppercase tracking-[0.18em] text-primary-700 font-semibold">
              Notes
            </dt>
            <dd class="mt-1 text-primary-900 whitespace-pre-line">{{ profile.notes }}</dd>
          </div>
        </dl>
      </template>

      <!-- Edit mode -->
      <template v-else>
        <form novalidate @submit.prevent="saveProfile">
        <div class="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              for="account-first-name"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              First name <span aria-hidden="true" class="text-accent-700">*</span>
            </label>
            <input
              id="account-first-name"
              v-model="form.firstName"
              type="text"
              name="given-name"
              autocomplete="given-name"
              required
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
          <div>
            <label
              for="account-last-name"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Last name <span aria-hidden="true" class="text-accent-700">*</span>
            </label>
            <input
              id="account-last-name"
              v-model="form.lastName"
              type="text"
              name="family-name"
              autocomplete="family-name"
              required
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
          <div>
            <label for="account-phone" class="block text-sm font-medium text-primary-900 mb-1.5">
              Phone
            </label>
            <input
              id="account-phone"
              v-model="form.phone"
              type="tel"
              name="tel"
              autocomplete="tel"
              inputmode="tel"
              spellcheck="false"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
          <div>
            <label
              for="account-discipline"
              class="block text-sm font-medium text-primary-900 mb-1.5"
            >
              Main discipline
            </label>
            <select
              id="account-discipline"
              v-model="form.primaryDiscipline"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            >
              <option value="">—</option>
              <option value="wingfoil">Wingfoil</option>
              <option value="windsurf">Windsurf</option>
              <option value="kitesurf">Kitesurf</option>
            </select>
          </div>
          <div>
            <label for="account-level" class="block text-sm font-medium text-primary-900 mb-1.5">
              Level
            </label>
            <select
              id="account-level"
              v-model="form.level"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            >
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label for="account-notes" class="block text-sm font-medium text-primary-900 mb-1.5">
              Anything we should know?
            </label>
            <textarea
              id="account-notes"
              v-model="form.notes"
              name="notes"
              rows="3"
              class="w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-primary-900 placeholder-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
            />
          </div>
        </div>

        <p
          v-if="saveError"
          aria-live="polite"
          class="mt-5 inline-block text-sm bg-red-50 text-red-900 border border-red-200 rounded-lg px-3 py-2"
        >
          {{ saveError }}
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            type="submit"
            :loading="saving"
            :disabled="saving"
            size="md"
            class="rounded-full bg-primary-900 hover:bg-primary-800 text-white border-0"
          >
            {{ saving ? 'Saving…' : 'Save profile' }}
          </UButton>
          <UButton
            type="button"
            :disabled="saving"
            size="md"
            variant="outline"
            color="primary"
            class="rounded-full border-primary-900 text-primary-900 hover:bg-primary-100"
            @click="cancelEdit"
          >
            Cancel
          </UButton>
        </div>
        </form>
      </template>
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
