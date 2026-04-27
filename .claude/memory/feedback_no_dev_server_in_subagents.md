---
name: WT subagents never start dev servers
description: Implementer subagents must NOT run `pnpm dev:guest` or any browser-dependent command — they hang waiting for readiness; verification = typecheck + lint + read-the-diff
type: feedback
originSessionId: eae64e6c-34b7-4791-ae1d-5821bc0f45c5
---
When dispatching implementer subagents in the WT project, EXPLICITLY prohibit them from starting dev servers or running browser-dependent commands.

**Why:** On 2026-04-26 a subagent attempting Task 1.2's "manual smoke" step ran `pnpm dev:guest` in the background and burnt 8+ minutes waiting for "server readiness notification" before timing out. The work it had already done (component file + page mount) was correct but unreviewable until I took over manually.

**How to apply:** Every implementer prompt for WT-app work must include:

> **Critical rule — verification:** DO NOT start a dev server. DO NOT run `pnpm dev:guest`, `pnpm e2e`, or any browser-dependent command. For verification: (1) `pnpm typecheck` — primary safety net, (2) `pnpm lint <touched-files>` — style/import check, (3) Read your diff carefully. The user (Andy) previews manually after the phase completes.

This applies to ALL UI/SSR-touching tasks in this codebase.
