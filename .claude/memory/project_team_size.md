---
name: WT is a solo-contributor project
description: Andy is the only human on WindTribe — affects scope decisions around PRs, branch protection, review rigour
type: project
originSessionId: 824c5271-8b90-44f3-8927-f27bf1daa4d7
---
Andy is the sole human contributor on WindTribe. Claude is his pair. No other engineers, no external reviewers.

**Why:** Confirmed in-session when WT-89 (branch protection) came up — Andy parked it as unnecessary overhead for a solo setup.

**How to apply:**

- **PR workflow is optional, not required.** Direct-to-main merges after self-testing remain the default. Open a PR only when Andy explicitly asks for one, or when a change is large/risky enough to benefit from a staged review step.
- **Skip tasks that assume multiple contributors** — things like branch protection, CODEOWNERS, review-assignment rules. Flag them in Jira, park them, note they reopen when a team joins.
- **CI gates (lint + typecheck + test via WT-86) are the primary safety net.** They run on every push and block nothing, but every failure is visible and should be treated as a hard signal. Don't merge broken CI without a deliberate reason.
- **Favour velocity over ceremony.** The self-drive protocol (work through an epic continuously, self-test to Done) assumes Andy is triaging async, not gating synchronously.

Revisit this memory if Andy mentions adding a second contributor, hiring, or onboarding anyone to the repo.
