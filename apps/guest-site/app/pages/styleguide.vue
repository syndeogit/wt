<script setup lang="ts">
useHead({
  title: 'Styleguide — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const swatches = [
  { name: 'primary-50', hex: '#effcfb' },
  { name: 'primary-200', hex: '#b0edea' },
  { name: 'primary-400', hex: '#4ac3c0' },
  { name: 'primary-500', hex: '#2ba6a3' },
  { name: 'primary-600', hex: '#1d8987' },
  { name: 'primary-800', hex: '#14565a' },
  { name: 'primary-950', hex: '#072a2c' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-16 space-y-16">
    <header>
      <p
        class="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2"
      >
        Internal — not for production use
      </p>
      <h1 class="text-4xl font-semibold tracking-tight">Styleguide</h1>
      <p class="mt-4 text-zinc-600 dark:text-zinc-400">
        Reference for every reusable component and token. Kept in sync as we add to the design
        system. If a component has variants, all variants are shown here.
      </p>
    </header>

    <section>
      <h2 class="text-2xl font-semibold mb-6">Colour — primary</h2>
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Placeholder teal. Swappable in <code class="text-xs">assets/css/main.css</code> once Andy
        provides the real brand colour.
      </p>
      <div class="grid grid-cols-3 sm:grid-cols-7 gap-3">
        <div v-for="s in swatches" :key="s.name" class="text-xs">
          <div
            class="h-14 rounded-md border border-zinc-200 dark:border-zinc-800"
            :style="{ background: s.hex }"
          />
          <div class="mt-1 font-mono">{{ s.name }}</div>
          <div class="font-mono text-zinc-500">{{ s.hex }}</div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-6">Typography</h2>
      <div class="space-y-2">
        <p class="text-5xl font-semibold tracking-tight">Display 5xl — the hero</p>
        <p class="text-4xl font-semibold tracking-tight">Heading 4xl — page title</p>
        <p class="text-2xl font-semibold">Heading 2xl — section title</p>
        <p class="text-xl font-semibold">Heading xl — subsection</p>
        <p class="text-base">Body base — the default paragraph size for content and prose.</p>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          Body sm — captions, helper text, meta.
        </p>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-6">Buttons</h2>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-3">
          <UButton color="primary" variant="solid">Solid primary</UButton>
          <UButton color="primary" variant="outline">Outline primary</UButton>
          <UButton color="primary" variant="soft">Soft primary</UButton>
          <UButton color="primary" variant="subtle">Subtle primary</UButton>
          <UButton color="primary" variant="ghost">Ghost primary</UButton>
          <UButton color="primary" variant="link">Link primary</UButton>
        </div>
        <div class="flex flex-wrap gap-3">
          <UButton color="neutral" variant="solid">Solid neutral</UButton>
          <UButton color="neutral" variant="outline">Outline neutral</UButton>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <UButton size="xs">Extra small</UButton>
          <UButton size="sm">Small</UButton>
          <UButton size="md">Medium</UButton>
          <UButton size="lg">Large</UButton>
          <UButton size="xl">Extra large</UButton>
        </div>
        <div class="flex flex-wrap gap-3">
          <UButton disabled>Disabled</UButton>
          <UButton loading>Loading</UButton>
          <UButton trailing-icon="i-lucide-arrow-right">With icon</UButton>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-6">Inputs</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <UInput placeholder="Email address" icon="i-lucide-mail" />
        <UInput placeholder="Name" />
        <UInput placeholder="Disabled" disabled />
        <UInput placeholder="Error state" color="error" />
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-6">Cards</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <UCard>
          <template #header>
            <p class="font-semibold">Card title</p>
          </template>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Default card with header + body. Used for product tiles, accommodation tiles.
          </p>
        </UCard>
        <UCard>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Body-only card — no header, just content.
          </p>
        </UCard>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-6">Badges</h2>
      <div class="flex flex-wrap gap-2">
        <UBadge color="primary">Primary</UBadge>
        <UBadge color="neutral">Neutral</UBadge>
        <UBadge color="success">Success</UBadge>
        <UBadge color="warning">Warning</UBadge>
        <UBadge color="error">Error</UBadge>
        <UBadge variant="outline">Outline</UBadge>
      </div>
    </section>
  </div>
</template>
