---
name: WT working mode — clickable increments, credit-aware
description: Default working cadence for WindTribe — small visible slices, not multi-hour autonomous grinds
type: feedback
originSessionId: 824c5271-8b90-44f3-8927-f27bf1daa4d7
---
Work in clickable increments, not multi-hour autonomous runs.

**Why:** Andy flagged the risk of burning a week of Claude credits on infrastructure only to find we built the wrong thing. Previous session went through 20 sub-tasks in one grind; he pulled the brakes and asked for smaller loops. The concern is specifically "spent credits + no validation yet = bad." This is a solo-contributor project with finite budget.

**How to apply:**

1. **Target 30–60 min per slice.** Each slice produces something Andy can open in a browser (Vercel preview, localhost) and form an opinion on. If a slice starts ballooning past 90 min, stop and surface the scope — almost always means the slice is too big.

2. **Push to preview before asking for polish.** Ugly first, polished second. A placeholder design that Andy can click through is more valuable than a polished design of the wrong thing. If shape is right, harden. If not, bin cheaply.

3. **One feature-visible commit per slice, not a batch.** Multiple commits within a slice are fine, but the slice lands on a branch that gets merged when the preview is accepted. Don't land a half-finished slice "to save a checkpoint."

4. **Skip ceremony that doesn't earn its keep.** Elaborate Jira cascades across sub-task/story/epic for a small config change: no. Elaborate cascades for a story completion: yes (the Jira hygiene memory applies). Solo project, no other reviewers, so PRs are optional, branch protection is parked, etc.

5. **Stop when a decision is needed.** Surface options with defaults. Don't guess on product decisions (brand, tone, which payment model, etc.) — guessing wrong wastes more credits than asking.

6. **Watch the tool-call budget per turn.** Before batching 15+ tool calls autonomously, ask: will the output change direction if something fails mid-batch? If yes, split into visible chunks with checkpoints between.

**When to break this rule:**

- Pure mechanical work (e.g. formatting a whole workspace after adding Prettier) — batch it, no checkpoint needed.
- Explicit instruction from Andy to run further autonomously (e.g. "keep going until this whole epic is done").
- Post-verification cleanup after a feature ships — tight, safe, contained.

**What belongs in the repo plan doc** (`docs/mvp-plan.md`, mirrored to Confluence SD space page 234455041):

The plan captures slices, scaffolding, architecture rules, open questions, and current state. Update it as decisions are made. The repo version is authoritative — if the Confluence mirror is out of date, resync from the repo.
