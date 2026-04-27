---
name: WT Jira full-audit compliance
description: Claude is responsible for keeping Jira an accurate audit trail of WT work — transition stories/sub-tasks/epics as work ships and comment with commit refs every time
type: feedback
originSessionId: cb4a2e46-322a-4e2c-9292-58a7c49c3ac6
---
Claude owns Jira audit-trail accuracy on the WindTribe project. Andy wants a hand-off-ready audit trail at any moment.

**Why:** Earlier in the build I credited shipped work via comments on the epic alone and skipped transitioning the underlying stories. By the time Andy asked, WT-3 / WT-5 / WT-6 each showed 6–9 stories in Backlog despite real code having shipped for many of them. That's a compliance failure — anyone reading Jira would believe nothing shipped, when in fact several MVP cuts were live.

**How to apply (every change, no exceptions):**

1. **Story-level transitions when work lands.** When a slice or chunk ships, transition the matching parent story (not just the epic). Use the actual Jira transition IDs (11=Backlog, 21=Selected for Development, 31=In Progress, 41=Done, 51=Review).
   - Done = the MVP-defined acceptance for that story is met.
   - In Progress = work has started or partial scope is shipped (e.g. read-only when full-CRUD is the eventual goal).
   - Stay in Backlog only if literally nothing has shipped against it.
2. **Bubble to the epic** on every change so the epic comment thread is the single readable timeline. Comment fields to include:
   - one-line summary of what shipped
   - the commit SHA on `main`
   - which slice / chunk this came from
3. **Sub-tasks for chunks** when a slice has internal phases (A1, A2, A3 etc.). One sub-task per phase, transition each as it ships, parent story moves to In Progress at the first sub-task and Done when the last lands.
4. **Don't transition based on intent** — only on shipped commits. If something is queued but not coded, it stays Backlog or pending.
5. **Periodic sweep** — at any natural pause (epic close, end of session), audit the parent epic's stories against shipped commits. Catch any miss-transitions before Andy has to ask.

**Compliance retroactive cleanup landed 2026-04-26:** the WT-3 / WT-5 / WT-7 / WT-8 backfill executed — 16 stories transitioned to Done, 6 to In Progress, WT-8 epic to In Progress, all with commit-cited comments. Slice J comments (WT-41/WT-40/WT-6) also posted. Genuinely un-shipped stories that remain Backlog: WT-30/31/32/33/36 (Centre admin out-of-MVP) and WT-21 (availability schema). Scripts archived in `.tmp/jira_*.py`.
