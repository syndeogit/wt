---
name: WT project GitHub and Jira setup
description: WindTribe repo location, Jira instance, and known credential limitations discovered in Task 1.1.1
type: reference
originSessionId: 824c5271-8b90-44f3-8927-f27bf1daa4d7
---
**GitHub repo:** `github.com/syndeogit/wt` (public, `main` default branch). Note: planning prompts may suggest `syndeo2/windtribe` — confirm with Andy.

**Jira instance:** `syndeo-test.atlassian.net`, project key `WT`. Access via curl with basic auth (email `andy@syndeo.cz` + API token). The Atlassian MCP connector covers `xtm-cloud` only, not `syndeo-test`.

**Jira IDs:** Always verify IDs from the current Jira state at session start. A planning prompt for Task 1.1.1 referenced `WT-9 / WT-7` but the real IDs were `WT-74 (task) / WT-13 (story) / WT-2 (epic)`. Treat prompt-referenced Jira IDs as suspect unless the human confirms.

**GitHub token in global CLAUDE.md** (`github_pat_11BST2ZPI0...`) has `contents:write` (push works) but **not** `pull_requests:write` — you cannot open PRs via the API with it. If you need to open a PR programmatically, ask Andy for a token with `pull_requests:write` or have him click Create PR at `https://github.com/syndeogit/wt/compare/<base>...<head>?expand=1` after you push the PR body to a file.

**Local credentials file:** `C:\dev\dev\WT\.env.local` (gitignored) — the single source of truth for runtime credentials. Never put secrets in memory files; reference this file instead. As of 2026-04-20 it holds:

- Jira: `JIRA_SYNDEO_DOMAIN`, `JIRA_SYNDEO_EMAIL`, `JIRA_SYNDEO_TOKEN`
- Supabase project `windtribe` (ref `wrasfpjetwewvmjawqxs`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN` (Management API for `supabase link` / `db push`)
- Vercel team `syndeogits-projects`: `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID_GUEST/CENTRE/HOTEL`
- Sentry org `syndeo-wh` (EU region — `https://de.sentry.io`): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_URL`

The tracked template `windtribe-env-template.env` has empty credential slots — keep it that way; it documents *which* vars to populate, never the values.

**Sentry region note:** the `syndeo-wh` org is on the EU region. API calls go to `https://de.sentry.io/api/0/...`, not `https://sentry.io`. The CLI auto-handles this if `SENTRY_URL=https://de.sentry.io` is set, otherwise pass `--url https://de.sentry.io`.
