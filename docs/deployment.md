# Deployment

WindTribe deploys to [Vercel](https://vercel.com) — one project per app. All three are created under the `syndeogits-projects` team and linked to [`syndeogit/wt`](https://github.com/syndeogit/wt).

## Vercel projects

| App            | Project name       | Project ID                         | Dashboard                                               |
| -------------- | ------------------ | ---------------------------------- | ------------------------------------------------------- |
| `guest-site`   | `windtribe-guest`  | `prj_8SylfhuEL2xGdzW726kvbvSdDx58` | https://vercel.com/syndeogits-projects/windtribe-guest  |
| `centre-admin` | `windtribe-centre` | `prj_VS7YgZ7HTnltrndH0ia2oYXAAh3r` | https://vercel.com/syndeogits-projects/windtribe-centre |
| `hotel-admin`  | `windtribe-hotel`  | `prj_I9SEpgquE769vGNfybbIn4dMQ1Vz` | https://vercel.com/syndeogits-projects/windtribe-hotel  |

Each project's build config (set at project-creation time, mirrored in code where relevant):

```
Root directory    apps/<app>
Framework preset  Nuxt
Install command   pnpm install --frozen-lockfile
Build command     (Vercel default — nuxt build)
Output directory  .output (Nuxt default)
Node version      22
```

Production URLs after the initial deploy land at `<project>.vercel.app`. Custom domains (`windtribe.com`, `centres.windtribe.com`, `hotels.windtribe.com`) attach later once the domain is registered — add them via Vercel → Project → Settings → Domains, or via `vercel domains add`.

## Environments

| Environment | Trigger                     | Vercel target | URL pattern                                                                          |
| ----------- | --------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| Preview     | Push to any non-main branch | `preview`     | `<project>-<random>-syndeogits-projects.vercel.app`                                  |
| Production  | Push to `main`              | `production`  | `<project>.vercel.app` (or the attached custom domain)                               |
| Release     | Push of a tag `v*.*.*`      | `production`  | Promotes the current production deployment to the release alias (see WT-83 workflow) |

Preview deployments are automatic and ephemeral. Every commit on every branch gets its own URL.

`main` always represents what is live. The `v*.*.*` tag workflow exists so releases have an auditable record and we can add release-specific aliases / customer comms later.

## Environment variables

Each Vercel project was created with these vars set (plain + sensitive):

| Var                         | Scope                         | Source          |
| --------------------------- | ----------------------------- | --------------- |
| `SUPABASE_URL`              | production / preview / dev    | Hosted Supabase |
| `SUPABASE_ANON_KEY`         | production / preview / dev    | Hosted Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | production / preview (secret) | Hosted Supabase |

Values for new env vars should be set via `vercel env add <KEY> <target> --token $VERCEL_TOKEN`, or in the Vercel dashboard. Never paste real values in PRs, Jira, or Slack.

## Release workflow

### Push to main

1. Merge a commit to `main`.
2. Vercel automatically builds and deploys each of the three projects to their production target.
3. Verify the deployment via the Vercel dashboard or by checking the deploy URL — `<project>.vercel.app`.

### Tag a release

The tag workflow (`.github/workflows/deploy-production.yml`, WT-83) triggers on push of a tag matching `v*.*.*`. It uses the Vercel CLI to redeploy each project with `--prod`, producing an auditable release marker.

```bash
git tag v0.1.0
git push origin v0.1.0
```

**Required GitHub repo secrets** for the workflow:

- `VERCEL_TOKEN` — same token we use locally.
- `VERCEL_ORG_ID` — `team_ZbCbI2gXwKY1Gk9oDeNnhlFo`.
- `VERCEL_PROJECT_ID_GUEST`, `VERCEL_PROJECT_ID_CENTRE`, `VERCEL_PROJECT_ID_HOTEL` — from the table above.

Add them under https://github.com/syndeogit/wt/settings/secrets/actions.

### Rollback

In order of preference:

1. **Promote a previous deployment to production** via the Vercel dashboard (Deployments → the run → `···` → "Promote to production"). Fastest — no git work.
2. **Revert the offending commit on `main`** and push. Vercel re-deploys.
3. **Re-tag at the last-known-good commit.** Use this only if the rollback must be recorded as a release.

If the rollback reveals a data problem rather than a code problem, pause and escalate. Rolling back code on top of a migrated database can corrupt state.

## Preview deployments (WT-84)

Every push to a non-main branch produces a preview URL. To verify:

```bash
git checkout -b demo/preview-test
git commit --allow-empty -m "trigger preview"
git push origin demo/preview-test
```

Vercel posts a deployment run for each project; URLs are under Vercel → Project → Deployments or fetchable via:

```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID_GUEST&teamId=$VERCEL_TEAM_ID&limit=1"
```

## Troubleshooting

### Deployment failed at "Build"

- Check the Vercel build log.
- Reproduce locally: `pnpm install --frozen-lockfile && pnpm --filter <app> build`.
- If the local build passes but Vercel fails, compare Node versions: we pin 22.

### Preview URL doesn't update

Vercel caches aggressively. Force a rebuild via the Vercel dashboard (Deployments → the run → **Redeploy** → uncheck "Use existing build cache").

### Domain not resolving

DNS is managed wherever the `windtribe.com` domain registrar lives. Confirm the `A`/`CNAME` records match Vercel's expected targets (Vercel → Project → Settings → Domains).
