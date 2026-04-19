# Deployment

WindTribe deploys to [Vercel](https://vercel.com) — one project per app. Each app is a standalone Nuxt 4 deployable.

> **Status:** this document is the contract for how deployments work. Vercel projects are provisioned under WT-82 (still open). Project IDs, domains, and environment-variable wiring are filled in here as each piece lands.

## Environments

| Environment | Trigger                      | URL pattern                                          |
| ----------- | ---------------------------- | ---------------------------------------------------- |
| Preview     | Pull requests against `main` | `<app>-<branch>-windtribe.vercel.app`                |
| Staging     | Push to `main`               | `staging-<app>.windtribe.com` (TBC)                  |
| Production  | Push of a tag `v<semver>`    | `<app>.windtribe.com` (guest site = `windtribe.com`) |

Preview deployments are automatic and ephemeral — created on PR open, destroyed on PR close.

Staging is always what is merged but not yet released. Production only advances when a release is explicitly tagged.

## Vercel projects

| App            | Project ID | Primary domain          | Preview URL template                   |
| -------------- | ---------- | ----------------------- | -------------------------------------- |
| `guest-site`   | _(WT-82)_  | `www.windtribe.com`     | `guest-<branch>-windtribe.vercel.app`  |
| `centre-admin` | _(WT-82)_  | `centres.windtribe.com` | `centre-<branch>-windtribe.vercel.app` |
| `hotel-admin`  | _(WT-82)_  | `hotels.windtribe.com`  | `hotel-<branch>-windtribe.vercel.app`  |

Each project's build config:

```
Root directory    apps/<app>
Install command   pnpm install --frozen-lockfile
Build command     pnpm --filter <app> build
Output directory  apps/<app>/.output/public
Framework preset  Nuxt
Node version      22
```

## Release workflow

### Promote a PR to staging

1. Open a PR against `main`. Vercel builds a preview for each app.
2. After review, merge to `main`. Vercel automatically deploys each app to its staging URL.
3. Sanity-check staging. If good, proceed to production.

### Release to production

1. From `main`, tag the commit: `git tag v1.2.3 && git push origin v1.2.3`.
2. Vercel promotes the staging deployment to production on tag push (wired up under WT-83).
3. Monitor Sentry (WT-90) and the error-alerting channel (WT-93) for 15 minutes post-release.

### Rollback

Two options, in order of preference:

1. **Promote the previous staging deployment** via the Vercel dashboard — fastest, no git work.
2. **Re-tag main at the last-known-good commit** and push the new tag. Vercel redeploys.

If the rollback reveals a data problem rather than a code problem, pause and escalate — rolling back code on top of a migrated database can corrupt state.

## Environment variables

Each Vercel project carries its own env vars. The full list (and which apps consume each one) lives in `windtribe-env-template.env`. Never commit real values.

Secret vars (service role keys, webhook signing secrets) belong only in Vercel's Environment Variables UI or via `vercel env add`. Never paste them into code or tickets.

## Troubleshooting

### Deployment failed at "Build"

- Check the Vercel build log.
- Reproduce locally: `pnpm install --frozen-lockfile && pnpm --filter <app> build`.
- If the local build passes but Vercel fails, compare Node versions: we pin 22.

### Preview URL doesn't update

Vercel caches aggressively. Force a rebuild via the Vercel dashboard (Deployments → the run → **Redeploy** → uncheck "Use existing build cache").

### Domain not resolving

DNS is managed wherever the `windtribe.com` domain registrar lives. Confirm the `A`/`CNAME` records match Vercel's expected targets (Vercel → Project → Settings → Domains).
