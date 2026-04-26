<!-- apps/guest-site/app/components/RiderProfileSoft.vue -->
<script setup lang="ts">
import type { Discipline, RiderLevel } from '~/composables/useRiderProfile'

const { profile, load, setProfile, skip, isSet, isSkipped } = useRiderProfile()

onMounted(() => load())

const editing = ref(false)
const draftDiscipline = ref<Discipline | ''>('')
const draftLevel = ref<RiderLevel | ''>('')

watch(
  profile,
  (p) => {
    draftDiscipline.value = p?.discipline ?? ''
    draftLevel.value = p?.level ?? ''
  },
  { immediate: true },
)

const canSave = computed(() => Boolean(draftDiscipline.value && draftLevel.value))

function save() {
  if (!canSave.value) return
  setProfile({ discipline: draftDiscipline.value as Discipline, level: draftLevel.value as RiderLevel })
  editing.value = false
}

function startEdit() {
  editing.value = true
}

function summary(): string {
  if (!profile.value) return ''
  const lvl = profile.value.level.charAt(0).toUpperCase() + profile.value.level.slice(1)
  const disc = {
    wingfoil: 'wingfoiler',
    windsurf: 'windsurfer',
    kitesurf: 'kitesurfer',
  }[profile.value.discipline]
  return `${lvl} ${disc}`
}
</script>

<template>
  <div v-if="!isSkipped">
    <!-- filled, not editing -->
    <div
      v-if="isSet && !editing"
      class="bg-primary-50 border-y border-primary-200 px-6 py-2.5 flex items-center gap-3 text-sm"
      aria-live="polite"
    >
      <span class="text-primary-900">🏄 <strong>{{ summary() }}</strong></span>
      <button
        type="button"
        class="text-primary-700 underline underline-offset-4 hover:text-primary-900 text-xs"
        @click="startEdit"
      >
        Edit
      </button>
    </div>

    <!-- empty or editing -->
    <div
      v-else
      class="bg-[#fff8ea] border-y border-amber-300/60 px-6 py-3.5 flex flex-wrap items-center gap-3 text-sm"
    >
      <span class="text-amber-900 font-semibold">What do you ride?</span>
      <label class="sr-only" for="rps-discipline">Discipline</label>
      <select
        id="rps-discipline"
        v-model="draftDiscipline"
        class="border border-amber-600 bg-white px-2.5 py-1.5 rounded text-sm focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <option value="" disabled>Discipline…</option>
        <option value="wingfoil">Wingfoil</option>
        <option value="windsurf">Windsurf</option>
        <option value="kitesurf">Kitesurf</option>
      </select>
      <label class="sr-only" for="rps-level">Level</label>
      <select
        id="rps-level"
        v-model="draftLevel"
        class="border border-amber-600 bg-white px-2.5 py-1.5 rounded text-sm focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <option value="" disabled>Level…</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <button
        type="button"
        :disabled="!canSave"
        class="bg-primary-900 text-white px-3.5 py-1.5 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        @click="save"
      >
        Save
      </button>
      <button
        type="button"
        class="text-amber-900 underline underline-offset-4 hover:text-amber-950 text-xs"
        @click="skip"
      >
        Skip for now
      </button>
    </div>
  </div>
</template>
