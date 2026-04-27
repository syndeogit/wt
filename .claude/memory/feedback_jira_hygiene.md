---
name: WT Jira hygiene — transition the moment work begins, bubble state up the hierarchy
description: WT project's Jira discipline — move issues (sub-task, story, epic) to In Progress the moment work on them starts, and keep the whole chain visible
type: feedback
originSessionId: 824c5271-8b90-44f3-8927-f27bf1daa4d7
---

**Core rule, never skip:** the moment work begins on any WT issue — sub-task, story, or epic — transition it to **In Progress**. Transition it on *start*, not retroactively after work is done. Then bubble state up its entire parent chain (story → epic) the same way.

Every issue that has work happening on it right now should read **In Progress** on the board. If the board doesn't match reality, the rule has been broken.

**Why:** Andy told me explicitly — 2026-04-21 — after noticing Slice 0 was underway but the epics + stories it feeds were still sitting in Backlog. He said: "the jira rule should say to transition epics stories or tasks once they begin to in progress etc." His board views filter by issue type. When parents stay in Backlog, the board under-represents what's in flight, and when something surprises him he can't tell whether it's new scope or work that was already quietly underway.

## How to apply — at start of work

When Claude begins work that touches a given issue:

1. **If the issue is a sub-task** — transition it to **In Progress** before the first tool call that modifies code for that task.
2. **If the sub-task has a parent story** not already In Progress or Done — transition the story to **In Progress** at the same time.
3. **If the parent story has a parent epic** not already In Progress or Done — transition the epic to **In Progress** at the same time.

Do this in one batch, not in three separate turns. Cheaper in tool calls and keeps the hierarchy coherent in a single shot.

Add a comment at each level:

- Sub-task: "Work starting. Plan: …" (1–2 sentences)
- Story: "Sub-task WT-NN started — summary of what that unlocks." (1 sentence)
- Epic: one sentence only when it's the first story to move, so the epic doesn't get repetitive chatter.

When a slice from `docs/mvp-plan.md` spans multiple Jira items (normal case — a vertical slice usually feeds multiple stories), apply the rule to **every** item the slice touches at start of work. Read the slice's `Feeds epic(s)` column in the plan to know which.

## How to apply — at end of work

When a sub-task completes:

- Comment: what was built, decisions taken, deviations, flags for future work.
- Transition using the **self-test rule**:
  - Acceptance criteria **self-verifiable** (commands green, tests pass, spec met) → transition directly to **Done**. Note what was verified.
  - Criteria need human judgement (UX, visual design, business correctness) → transition to **Review**. Spell out what Andy should eyeball.
  - Default to Done when the rule permits — don't park everything in Review.
- Comment on the parent story with a one-liner: which sub-task moved, what it unlocks next.
- Bubble to the epic only at story milestones (story complete, major decision made) — not per sub-task.

When every sub-task of a story is Done, transition the story to Done unless Andy has said otherwise.

When every story of an epic is Done, transition the epic to Done.

## Working through a slice or epic

Once started, keep going. Do not stop after a single sub-task awaiting handoff unless:

- The epic is **Done** and there is no next slice queued.
- All remaining items on the active slice are in **Review** (nothing left that can be self-tested to Done).
- A genuine blocker surfaces (missing credentials, contradictory acceptance criteria, a decision only Andy can make).
- Andy has asked for a checkpoint (see the working-mode memory for cadence rules).

## Mapping slices to Jira

`docs/mvp-plan.md` is the plan's slice-by-slice structure (A through M + Slice 0 scaffolding). The plan lists which epic(s) each slice feeds. Use that as the lookup:

- Before starting a slice, identify every Jira sub-task, story, and epic the slice touches.
- Transition all of them to In Progress per the start-of-work rule above.
- When the slice completes, transition each touched item using the end-of-work rule.

If a slice touches work that doesn't yet have a Jira sub-task (common for cross-cutting scaffolding like Slice 0), either create one up front or work without one — but do still bubble status on the parent stories + epics that the slice ultimately feeds.

## Format

Plain English. No jargon. No icons. Comments short — one or two sentences unless closing out a sub-task (then include the what/how/flag structure).

Use the Atlassian Document Format (ADF) for comments via the Jira v3 API, posting the `body` as an ADF doc tree. Comment and transition API calls can be batched via a small Node script when multiple items need updating at once.
