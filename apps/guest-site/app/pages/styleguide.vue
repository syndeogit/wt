<script setup lang="ts">
useHead({
  title: 'Styleguide — WindTribe',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const primarySwatches = [
  { name: 'primary-50', hex: '#ecfeff' },
  { name: 'primary-200', hex: '#a5f3fc' },
  { name: 'primary-400', hex: '#22d3ee' },
  { name: 'primary-500', hex: '#06b6d4' },
  { name: 'primary-600', hex: '#0891b2' },
  { name: 'primary-800', hex: '#155e75' },
  { name: 'primary-900', hex: '#164e63' },
]

const accentSwatches = [
  { name: 'accent-50', hex: '#fff1ef' },
  { name: 'accent-200', hex: '#ffc4ba' },
  { name: 'accent-400', hex: '#f7755e' },
  { name: 'accent-500', hex: '#ef5a3e' },
  { name: 'accent-600', hex: '#d4452f' },
  { name: 'accent-800', hex: '#882a1d' },
]

const neutralSwatches = [
  { name: 'bg', hex: '#ffffff' },
  { name: 'bg-elevated', hex: '#f0fbff' },
  { name: 'ink-muted', hex: '#0e7490' },
  { name: 'ink (primary-900)', hex: '#164e63' },
]
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-20 space-y-20">
    <header>
      <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-4">
        Internal · not for production
      </p>
      <h1 class="font-display text-5xl text-primary-900 leading-[1.05]">Styleguide</h1>
      <p class="mt-6 text-lg text-primary-900 max-w-2xl leading-relaxed">
        The Aegean direction. Every reusable token + component variant we commit to lives here. If
        it isn't on this page, it isn't part of the system yet.
      </p>
    </header>

    <!-- Direction -->
    <section>
      <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3 font-semibold">Direction</p>
      <h2 class="font-display text-3xl text-primary-900 mb-4">Aegean</h2>
      <p class="text-primary-900 max-w-3xl leading-relaxed">
        Mediterranean summer, not Atlantic winter. Clean white ground, turquoise primary that reads
        as Greek-island sea, deep teal ink for confident text, coral accent for warmth — the classic
        Greek hotel signage combination. Photography of turquoise water and white-washed walls does
        the emotional lift; type and colour stay out of its way.
      </p>
    </section>

    <!-- Typography treatments — same content, four variations -->
    <section>
      <p class="text-xs uppercase tracking-[0.2em] text-accent-600 mb-3 font-semibold">
        Typography treatments
      </p>
      <h2 class="font-display text-3xl text-primary-900 mb-4">
        Same text, four treatments — pick one.
      </h2>
      <p class="text-primary-900 max-w-3xl leading-relaxed mb-10">
        Each variation renders the same block of content so the only variable is the type treatment
        itself. Ink colour, font family, weight, scale, and eyebrow styling differ. All WCAG AA+ on
        white. Say "Option N" and we commit.
      </p>

      <!-- Option 1 — Editorial (current baseline) -->
      <div class="border border-primary-200 rounded-2xl p-8 sm:p-10 mb-6 bg-white">
        <p class="text-xs font-mono text-primary-600 mb-6">
          Option 1 · Editorial — Fraunces display + Inter body, all primary-900, coral eyebrow
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-4 font-semibold">
          Internal · not for production
        </p>
        <h3
          class="font-display text-5xl text-primary-900 leading-[1.05] mb-6"
          style="font-weight: 600"
        >
          Styleguide
        </h3>
        <p class="text-lg text-primary-900 max-w-2xl leading-relaxed">
          The Aegean direction. Every reusable token + component variant we commit to lives here. If
          it isn't on this page, it isn't part of the system yet.
        </p>
      </div>

      <!-- Option 2 — Magazine (heavier display, larger scale) -->
      <div class="border border-primary-200 rounded-2xl p-8 sm:p-10 mb-6 bg-white">
        <p class="text-xs font-mono text-primary-600 mb-6">
          Option 2 · Magazine — Fraunces 7xl bold, tighter tracking, body bumped to xl
        </p>
        <p class="text-[11px] uppercase tracking-[0.28em] text-accent-600 mb-5 font-bold">
          Internal · not for production
        </p>
        <h3
          class="font-display text-6xl sm:text-7xl text-primary-900 leading-[0.95] mb-7"
          style="font-weight: 700; letter-spacing: -0.035em"
        >
          Styleguide
        </h3>
        <p class="text-xl text-primary-900 max-w-2xl leading-relaxed">
          The Aegean direction. Every reusable token + component variant we commit to lives here. If
          it isn't on this page, it isn't part of the system yet.
        </p>
      </div>

      <!-- Option 3 — Contemporary (Inter throughout, no serif) -->
      <div class="border border-primary-200 rounded-2xl p-8 sm:p-10 mb-6 bg-white">
        <p class="text-xs font-mono text-primary-600 mb-6">
          Option 3 · Contemporary — Inter display (no serif), bold, tight tracking
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-600 mb-4 font-semibold">
          Internal · not for production
        </p>
        <h3
          class="text-5xl text-primary-900 leading-[1.05] mb-6"
          style="font-weight: 700; letter-spacing: -0.035em"
        >
          Styleguide
        </h3>
        <p class="text-lg text-primary-900 max-w-2xl leading-relaxed">
          The Aegean direction. Every reusable token + component variant we commit to lives here. If
          it isn't on this page, it isn't part of the system yet.
        </p>
      </div>

      <!-- Option 4 — Minimal (lighter weight, no coral eyebrow) -->
      <div class="border border-primary-200 rounded-2xl p-8 sm:p-10 mb-6 bg-white">
        <p class="text-xs font-mono text-primary-600 mb-6">
          Option 4 · Minimal — Fraunces regular weight, body in muted ink (primary-700), teal
          eyebrow (no coral)
        </p>
        <p class="text-xs uppercase tracking-[0.22em] text-primary-700 mb-4 font-medium">
          Internal · not for production
        </p>
        <h3
          class="font-display text-5xl text-primary-900 leading-[1.05] mb-6"
          style="font-weight: 400; letter-spacing: -0.02em"
        >
          Styleguide
        </h3>
        <p class="text-lg text-primary-700 max-w-2xl leading-relaxed">
          The Aegean direction. Every reusable token + component variant we commit to lives here. If
          it isn't on this page, it isn't part of the system yet.
        </p>
      </div>
    </section>

    <!-- Typography scale reference (kept for internal sizing reference) -->
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
      <h2 class="font-display text-3xl text-primary-900 mb-2">Primary — Mediterranean turquoise</h2>
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
      <h2 class="font-display text-3xl text-primary-900 mb-2">Background + ink</h2>
      <p class="text-primary-900 mb-6 max-w-2xl">
        Pure white background — clean Mediterranean light. Elevated surfaces use a barely-tinted
        turquoise shade. Text uses deep teal ink (cyan-800); muted text uses a slightly lighter teal
        (cyan-700). All combinations meet WCAG AA contrast on white.
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

  <!-- Dark variant preview — full-bleed below the styleguide. Static
       sample showing how an inverted theme would feel. Doesn't toggle
       theme site-wide; lives only on this page so we can audit dark
       direction without breaking auto-theming elsewhere. -->
  <section class="bg-primary-950 mt-24">
    <div class="max-w-5xl mx-auto px-6 py-20 space-y-16 text-primary-100">
      <header>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-300 mb-4 font-semibold">
          Dark variant · preview only
        </p>
        <h2 class="font-display text-4xl text-primary-50 leading-tight">
          The Aegean after sunset.
        </h2>
        <p class="mt-6 text-lg text-primary-200 max-w-2xl leading-relaxed">
          Same brand, inverted surface. Deepest teal as the ground, near-white text, primary actions
          in the brighter cyan, coral CTAs unchanged. Not live across the site yet — this block is a
          static preview so we can see whether the direction is worth committing to.
        </p>
      </header>

      <div>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-300 mb-3 font-semibold">
          Hero on dark
        </p>
        <div class="bg-primary-900 rounded-2xl p-10 sm:p-14">
          <p class="text-xs uppercase tracking-[0.22em] text-accent-300 mb-4 font-semibold">
            Wingfoil · Karpathos
          </p>
          <h3
            class="font-display text-4xl sm:text-5xl text-primary-50 leading-[1.05] max-w-2xl text-pretty"
          >
            Try wing. Try wind. Live a week.
          </h3>
          <p class="mt-6 text-primary-200 leading-relaxed max-w-xl">
            Curated wingfoil escapes for the city-dweller who has been meaning to try.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a
              href="#"
              class="inline-flex items-center rounded-full bg-accent-500 hover:bg-accent-600 text-white px-7 py-3 text-base font-medium transition-colors"
            >
              Try wing in Karpathos →
            </a>
            <a
              href="#"
              class="inline-flex items-center rounded-full bg-primary-700/60 hover:bg-primary-700 text-primary-50 px-7 py-3 text-base font-medium border border-primary-600/40 transition-colors"
            >
              See the week
            </a>
          </div>
        </div>
      </div>

      <div>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-300 mb-3 font-semibold">
          Card on dark
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <article class="bg-primary-900 rounded-2xl p-7 border border-primary-800">
            <p class="font-display text-xl text-primary-50 mb-1">Wing for beginners — 5 days</p>
            <p class="text-xs uppercase tracking-[0.18em] text-primary-300 mb-4">
              5 mornings · coaching + kit
            </p>
            <p class="text-primary-200 leading-relaxed text-sm">
              Five days from "never tried it" to first independent flights. Coach in the water with
              you. Group cap of three.
            </p>
            <div class="mt-6 flex items-center justify-between">
              <span class="font-display text-2xl text-primary-50">€890</span>
              <a
                href="#"
                class="inline-flex items-center rounded-full bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 text-sm font-medium transition-colors"
              >
                Choose
              </a>
            </div>
          </article>
          <article class="bg-primary-900 rounded-2xl p-7 border border-primary-800">
            <p class="font-display text-xl text-primary-50 mb-1">Body-only card</p>
            <p class="text-primary-200 leading-relaxed text-sm mt-3">
              Quieter surfaces — quotes, side notes, secondary content. No header, no footer, just
              prose that reads as comfortably on dark as on light.
            </p>
          </article>
        </div>
      </div>

      <div>
        <p class="text-xs uppercase tracking-[0.22em] text-accent-300 mb-3 font-semibold">
          Tokens used (dark)
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
          <div
            v-for="tok in [
              { name: 'primary-950', hex: '#083344' },
              { name: 'primary-900', hex: '#164e63' },
              { name: 'primary-800', hex: '#155e75' },
              { name: 'primary-700', hex: '#0e7490' },
              { name: 'primary-200', hex: '#a5f3fc' },
              { name: 'primary-100', hex: '#cffafe' },
              { name: 'primary-50', hex: '#ecfeff' },
            ]"
            :key="tok.name"
          >
            <div
              class="h-14 rounded-lg border border-primary-800"
              :style="{ background: tok.hex }"
            />
            <div class="mt-2 font-mono text-primary-100">{{ tok.name }}</div>
          </div>
        </div>
        <p class="mt-6 text-sm text-primary-300 max-w-2xl leading-relaxed">
          Background = primary-950 (deepest teal). Surfaces = primary-900. Text = primary-50 for
          headings, primary-200 for body, primary-300 for muted. Accent CTAs unchanged. Borders use
          primary-800 with low opacity to stay quiet.
        </p>
      </div>
    </div>
  </section>
</template>
