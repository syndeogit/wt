---
name: WT prefer pure-function tests over h3 mocking
description: When a Nitro server handler needs unit tests, extract validation/parsing into a pure function in a util module and test that — don't mock h3, defineEventHandler, getQuery, etc.
type: feedback
originSessionId: eae64e6c-34b7-4791-ae1d-5821bc0f45c5
---
When unit-testing a WT Nitro/Nuxt server handler, do NOT mock h3 (`vi.mock('h3', ...)`) or stub `defineEventHandler` / `getRouterParam` / `getQuery` / `createError` directly.

**Why:** On 2026-04-26 (Slice O Task 2), the implementer subagent followed the spec verbatim and tried to mock h3 from vitest. h3 isn't a direct dependency of this monorepo (transitive through nitro/nuxt), so vitest couldn't resolve the import. The fix it applied was a hardcoded `h3@1.15.11` alias in root `vitest.config.ts` — a pin that breaks the next time h3 is bumped or pnpm restructures its store. It also added a dead `vitest.setup.server.ts`. Net diff: 4 files changed, 177 insertions, project-wide blast radius for one slice's tests.

**The right pattern (applied as fixup `c2a7da8`):**

Extract the parse / validation / shape logic into a pure function in the util module, e.g.:

```ts
// server/utils/syndion.ts
export type LessonsQueryResult =
  | { ok: true; centreCode: string; upstreamQuery: Record<string, string | number> }
  | { ok: false; statusCode: number; statusMessage: string }

export function parseLessonsRequest(
  centreSlug: string | undefined,
  query: { days?: string; sport?: string },
): LessonsQueryResult { ... }
```

Then the handler becomes thin orchestration: `parseLessonsRequest(...) → if !ok throw createError(parsed) → fetch → return`.

Tests target `parseLessonsRequest` directly — zero h3 coupling, zero hardcoded paths. Same coverage of the contract.

**How to apply:** When writing or reviewing a plan that includes vitest tests for a Nitro handler, push the validation/transformation logic out of the handler into a pure helper. The handler's only job is to wire h3 helpers + `$fetch` to the helper. The helper is what gets tested. The handler's fetch-orchestration code path is exercised at runtime via manual preview / e2e.

The fetch-then-shape error mapping (`502` for upstream errors, `503` for network) doesn't usually need a unit test — it's three lines of error-code translation that's easier to read than to mock. If you really want it tested, write a separate small helper `mapFetchErrorToStatus(err) -> number`.
