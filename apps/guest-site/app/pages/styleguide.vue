<script setup lang="ts">
useHead({
  title: 'Styleguide — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const primarySwatches = [
  { name: 'primary-50', hex: '#f1f4f8' },
  { name: 'primary-200', hex: '#b4c1d8' },
  { name: 'primary-400', hex: '#546f94' },
  { name: 'primary-500', hex: '#345075' },
  { name: 'primary-600', hex: '#20385a' },
  { name: 'primary-800', hex: '#102038' },
  { name: 'primary-900', hex: '#0b2740' },
]

const accentSwatches = [
  { name: 'accent-50', hex: '#fdf4f0' },
  { name: 'accent-200', hex: '#f6c8b4' },
  { name: 'accent-400', hex: '#e88367' },
  { name: 'accent-500', hex: '#e07a5f' },
  { name: 'accent-600', hex: '#c75a3d' },
  { name: 'accent-800', hex: '#823929' },
]

const neutralSwatches = [
  { name: 'paper', hex: '#f7f3ee' },
  { name: 'paper-elevated', hex: '#fbf7f1' },
  { name: 'ink-muted', hex: '#546f94' },
  { name: 'ink', hex: '#0b2740' },
]
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-20 space-y-20">
    <header>
      <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-4">
        Internal · not for production
      </p>
      <h1 class="font-display text-5xl text-primary-900 leading-[1.05]">Styleguide</h1>
      <p class="mt-6 text-lg text-primary-700 max-w-2xl leading-relaxed">
        The Open Sea direction. Every reusable token + component variant we commit to lives here. If
        it isn't on this page, it isn't part of the system yet.
      </p>
    </header>

    <!-- Direction -->
    <section>
      <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3">Direction</p>
      <h2 class="font-display text-3xl text-primary-900 mb-4">Open Sea</h2>
      <p class="text-primary-700 max-w-3xl leading-relaxed">
        Premium, editorial, aspirational. Built for the city-dweller imagining themselves on the
        water at 2pm on a Thursday. Deep navy carries gravity; coral brings warmth; sand paper
        background says "come in." Photography does the heavy emotional lift; type and colour stay
        out of its way.
      </p>
    </section>

    <!-- Typography -->
    <section>
      <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3">Typography</p>
      <h2 class="font-display text-3xl text-primary-900 mb-6">Fraunces + Inter</h2>
      <p class="text-primary-700 mb-10 max-w-3xl leading-relaxed">
        <span class="font-display">Fraunces</span> on display — taglines, section titles, hero
        moments. Variable serif with optical sizing that feels editorial without being stuffy. Inter
        for body, UI, navigation — the workhorse that stays invisible.
      </p>
      <div class="space-y-3 border-t border-primary-900/10 pt-8">
        <p class="font-display text-6xl text-primary-900 leading-[1.02] tracking-tight">
          The wind belongs to everyone.
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-500">
          Display / 6xl / font-display
        </p>
      </div>
      <div class="space-y-3 border-t border-primary-900/10 pt-8 mt-8">
        <p class="font-display text-4xl text-primary-900 leading-tight">
          Three reasons to book with us.
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-500">
          Display / 4xl / section heading
        </p>
      </div>
      <div class="space-y-3 border-t border-primary-900/10 pt-8 mt-8">
        <p class="text-2xl text-primary-900 leading-snug">
          Body large — for intro paragraphs, featured quotes, occasional emphasis inside editorial
          sections.
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-500">
          Inter / 2xl / lead paragraph
        </p>
      </div>
      <div class="space-y-3 border-t border-primary-900/10 pt-8 mt-8">
        <p class="text-base text-primary-700 leading-relaxed max-w-3xl">
          Body base — the default. Used for almost every paragraph on the site. Line length caps at
          ~70 characters for comfortable reading; line height sits around 1.65 so the eye can rest
          between lines even on longer blocks.
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-500">
          Inter / base / default paragraph
        </p>
      </div>
      <div class="space-y-3 border-t border-primary-900/10 pt-8 mt-8">
        <p class="text-sm text-primary-700">
          Body small — captions, helper text, metadata under product cards.
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-500">Inter / sm / caption</p>
      </div>
      <div class="space-y-3 border-t border-primary-900/10 pt-8 mt-8">
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600">
          Eyebrow · categorisation · prefixes a heading
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-500">
          Inter / xs uppercase / accent coloured · pre-heading label
        </p>
      </div>
    </section>

    <!-- Primary palette -->
    <section>
      <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3">Palette</p>
      <h2 class="font-display text-3xl text-primary-900 mb-2">Primary — deep navy</h2>
      <p class="text-primary-700 mb-6 max-w-2xl">
        Carries text, primary surfaces, most ink on the page. 700–900 for headings and strong text,
        500–600 for primary buttons, 200–400 for borders and quiet surfaces.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        <div v-for="s in primarySwatches" :key="s.name" class="text-xs">
          <div
            class="h-16 rounded-lg border border-primary-900/10"
            :style="{ background: s.hex }"
          />
          <div class="mt-2 font-mono text-primary-900">{{ s.name }}</div>
          <div class="font-mono text-primary-500">{{ s.hex }}</div>
        </div>
      </div>
    </section>

    <!-- Accent palette -->
    <section>
      <h2 class="font-display text-3xl text-primary-900 mb-2">Accent — coral</h2>
      <p class="text-primary-700 mb-6 max-w-2xl">
        Used sparingly. Eyebrow labels, single CTA moments, focus states. If everything is coral,
        nothing is. Rule: one coral thing per viewport is usually right.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div v-for="s in accentSwatches" :key="s.name" class="text-xs">
          <div
            class="h-16 rounded-lg border border-primary-900/10"
            :style="{ background: s.hex }"
          />
          <div class="mt-2 font-mono text-primary-900">{{ s.name }}</div>
          <div class="font-mono text-primary-500">{{ s.hex }}</div>
        </div>
      </div>
    </section>

    <!-- Neutrals -->
    <section>
      <h2 class="font-display text-3xl text-primary-900 mb-2">Paper + ink</h2>
      <p class="text-primary-700 mb-6 max-w-2xl">
        Background is warm sand (paper), not pure white — so the brand always feels inviting. Ink is
        deep navy, so text reads confidently against it.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="s in neutralSwatches" :key="s.name" class="text-xs">
          <div
            class="h-16 rounded-lg border border-primary-900/10"
            :style="{ background: s.hex }"
          />
          <div class="mt-2 font-mono text-primary-900">{{ s.name }}</div>
          <div class="font-mono text-primary-500">{{ s.hex }}</div>
        </div>
      </div>
    </section>

    <!-- Buttons -->
    <section>
      <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3">Components</p>
      <h2 class="font-display text-3xl text-primary-900 mb-6">Buttons</h2>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-3">
          <UButton color="primary" variant="solid" class="rounded-full">Solid primary</UButton>
          <UButton color="primary" variant="outline" class="rounded-full">Outline primary</UButton>
          <UButton color="primary" variant="soft" class="rounded-full">Soft primary</UButton>
          <UButton color="primary" variant="ghost" class="rounded-full">Ghost primary</UButton>
          <UButton color="primary" variant="link">Link primary</UButton>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <UButton size="xs" color="primary" class="rounded-full">Extra small</UButton>
          <UButton size="sm" color="primary" class="rounded-full">Small</UButton>
          <UButton size="md" color="primary" class="rounded-full">Medium</UButton>
          <UButton size="lg" color="primary" class="rounded-full">Large</UButton>
          <UButton size="xl" color="primary" class="rounded-full">Extra large</UButton>
        </div>
        <div class="flex flex-wrap gap-3">
          <UButton disabled color="primary" class="rounded-full">Disabled</UButton>
          <UButton loading color="primary" class="rounded-full">Loading</UButton>
          <UButton
            color="primary"
            class="rounded-full bg-accent-500 hover:bg-accent-600 border-accent-500 hover:border-accent-600 text-white"
          >
            Warm CTA
          </UButton>
        </div>
      </div>
    </section>

    <!-- Inputs -->
    <section>
      <h2 class="font-display text-3xl text-primary-900 mb-6">Inputs</h2>
      <div class="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <UInput placeholder="Email address" icon="i-lucide-mail" size="lg" />
        <UInput placeholder="Your name" size="lg" />
        <UInput placeholder="Disabled" disabled size="lg" />
        <UInput placeholder="Error state" color="error" size="lg" />
      </div>
    </section>

    <!-- Cards -->
    <section>
      <h2 class="font-display text-3xl text-primary-900 mb-6">Cards</h2>
      <div class="grid gap-4 sm:grid-cols-2 max-w-3xl">
        <UCard>
          <template #header>
            <p class="font-display text-xl text-primary-900">Beginner windsurfing — 3 days</p>
            <p class="text-sm text-primary-500 mt-1">3 afternoons · 3 hrs each</p>
          </template>
          <p class="text-primary-700 leading-relaxed">
            Three consecutive afternoons on the flats, small groups, all gear included. You will
            rig, balance, turn, and ride upwind by day three.
          </p>
          <template #footer>
            <div class="flex items-center justify-between">
              <span class="font-display text-2xl text-primary-900">€285</span>
              <UButton size="sm" color="primary" class="rounded-full">Choose</UButton>
            </div>
          </template>
        </UCard>
        <UCard>
          <p class="text-primary-700 leading-relaxed">
            Body-only card — for side content, quote blocks, or quieter surfaces.
          </p>
        </UCard>
      </div>
    </section>

    <!-- Badges -->
    <section>
      <h2 class="font-display text-3xl text-primary-900 mb-6">Badges</h2>
      <div class="flex flex-wrap gap-2">
        <UBadge color="primary">Curated</UBadge>
        <UBadge color="neutral">Standard</UBadge>
        <UBadge color="success">Available</UBadge>
        <UBadge color="warning">Limited spots</UBadge>
        <UBadge color="error">Sold out</UBadge>
        <UBadge variant="outline" color="primary">Outlined</UBadge>
      </div>
    </section>
  </div>
</template>
