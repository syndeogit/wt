---
name: WT subagent-driven cadence
description: For multi-task plan execution, use a lightened version of subagent-driven-development — one implementer per task, controller-driven inline review (no separate spec/code-quality reviewer subagents per task)
type: feedback
originSessionId: eae64e6c-34b7-4791-ae1d-5821bc0f45c5
---
When executing a multi-task implementation plan via subagent-driven-development, use the LIGHTENED cadence (Andy approved on 2026-04-26 for Slice N):

- One implementer subagent per task (or do small tasks inline if a 1-file edit doesn't need a fresh context)
- Controller (me) does the spec compliance review inline by reading the diff against the plan + running lint/typecheck
- Skip the per-task spec-reviewer and code-quality-reviewer subagents
- Optionally run a code-quality reviewer subagent ONCE at end-of-phase if scope/quality needs the cross-check
- Pause for Andy preview between phases, not between every task

**Why:** the full skill ceremony (3 subagents per task) costs ~78 subagent dispatches for a 26-task plan. Andy's working-mode rule prohibits multi-hour autonomous grinds and credit budget matters. Lightened cadence drops to ~26 dispatches while preserving fresh-context implementation per task.

**How to apply:** When invoking subagent-driven-development for a plan with >5 tasks, propose this cadence up front. For tasks that are <50-line edits to one file, prefer inline execution — no implementer subagent needed.
