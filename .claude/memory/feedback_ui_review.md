---
name: WT UI — run design review before declaring UI work "done"
description: Never ship UI without a systematic review pass for contrast, hierarchy, accessibility — catch it before Andy sees it
type: feedback
originSessionId: 824c5271-8b90-44f3-8927-f27bf1daa4d7
---
Before declaring any UI slice "done" or sending Andy a preview URL, run a systematic review pass. Don't rely on eyeballing the finished output — by that point my eyes are biased toward seeing what I intended, not what's actually rendered.

**Why:** Andy flagged this explicitly on 2026-04-21 when the Open Sea style shipped with obvious failures: grey/silver header background instead of paper, wordmark barely readable, outline "See the week →" button on dark navy with near-zero contrast, footer links almost invisible. His words: "a UI or UX skill with testing would of improved how you delivered this they should of spotted poor contrast on buttons and text." These are the kind of issues a fresh pair of eyes catches in 30 seconds — and I have a `web-design-guidelines` skill that does exactly that.

**How to apply:**

1. **Before pushing any slice that includes visible UI changes**, invoke the `web-design-guidelines` skill via the Skill tool. Feed it the files that changed + a short summary of what the screens should do.

2. **Audit targets — the categories that bite most often on this project**:
   - **Contrast**: every text-on-background combination must meet WCAG AA (4.5:1 body, 3:1 large text). Run contrast checks on `primary-500 on paper`, `primary-600 on dark`, `accent-500 on paper`, any `/X` opacity borders.
   - **Button visibility in both themes**: solid primary should pop; outline/ghost variants still need visible edges or coloured text; "warm CTA" coral must be legible.
   - **Dark sections**: on navy (primary-900/950) backgrounds, ghost/outline buttons and muted text almost always under-contrast — promote to solid-light or raise opacity.
   - **Nav headers**: backdrop-blur over a warm paper background can render grey/silver on some browsers. Prefer `bg-paper/95` or a solid `bg-paper` on sticky headers rather than `bg-paper/80 backdrop-blur` until tested.
   - **Link hover states**: `hover:text-accent-600` is fine; but the default colour must be readable first. `text-primary-500` on paper is usually too muted for body links.

3. **Fix in one pass**, re-run the audit, then push. Don't push-and-fix-in-next-commit — Andy sees the first URL and the first impression sticks.

4. **When adding new components or pages**, also add at least one variant to `/styleguide` so all reviewable states live on one URL. Reviewing against the styleguide first, page-in-context second, is cheaper than discovering contrast issues mid-page.

5. **Long-term — wire automation**: add `axe-core` or `playwright-lighthouse` to the Playwright config so CI catches regressions. That's a follow-up slice, not part of every feature, but once it exists the manual review gets lighter.

**Order of operations for any slice with UI**:
1. Build.
2. Invoke `web-design-guidelines` skill.
3. Fix everything it flags + what it didn't but is obvious when you look again.
4. Re-check the styleguide page renders correctly (some tokens get touched during fixes).
5. Push preview.
6. Tell Andy what URL + what to look for, including anything the audit surfaced and you deliberately deferred (with reason).
