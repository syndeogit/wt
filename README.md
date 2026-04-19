# WindTribe

WindTribe is the booking and operations platform for the windsurf and kitesurf community. This monorepo holds the guest-facing site (windtribe.com), admin portals for centres and hotels, and the shared code that powers them.

## Requirements

- **Node.js** 20.11+ (LTS recommended)
- **pnpm** 10+ (the repo pins `packageManager: "pnpm@10.33.0"`)
- **git** 2.40+

A Supabase account and local credentials file become necessary once Story 1.2 (Supabase backend setup) lands.

## Quick start

```bash
git clone https://github.com/syndeogit/wt.git
cd wt
pnpm install

# Run an app
pnpm dev:guest    # guest-site on http://localhost:3000
pnpm dev:centre   # centre-admin (picks next free port)
pnpm dev:hotel    # hotel-admin  (picks next free port)
```

First-time setup should take under 15 minutes on a modern machine.

## Repository layout

```
.
├── apps/
│   ├── guest-site/        # Public site — windtribe.com (Nuxt 4)
│   ├── centre-admin/      # Centre operator portal (Nuxt 4)
│   └── hotel-admin/       # Hotel operator portal (Nuxt 4)
├── packages/
│   ├── shared/            # @windtribe/shared — cross-app composables, types, utilities
│   ├── ui/                # @windtribe/ui — shared Vue components and design primitives
│   └── database/          # @windtribe/database — Supabase schema, migrations, generated types
├── .prettierrc.json       # Prettier config (applies to all workspaces)
├── .prettierignore
├── eslint.config.mjs      # ESLint flat config (all workspaces)
├── tsconfig.base.json     # Shared TS compiler options + path aliases
├── pnpm-workspace.yaml    # Workspace declaration
├── package.json           # Root scripts and devDependencies
├── windtribe-env-template.env  # Reference list of env vars (fill in .env.local locally)
└── README.md
```

Cross-package imports use the workspace path aliases declared in `tsconfig.base.json`:

```ts
import { something } from '@windtribe/shared'
import { Button } from '@windtribe/ui'
import type { Database } from '@windtribe/database'
```

## Environment variables

The repo never contains real credentials. Reference variable names live in `windtribe-env-template.env`. Copy it to `.env.local` at the repo root (gitignored) and fill in real values:

```bash
cp windtribe-env-template.env .env.local
# then populate .env.local with credentials
```

Never commit `.env*` files; the root `.gitignore` excludes them.

## Root scripts

Run from the repo root.

| Script              | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `pnpm dev:guest`    | Start guest-site dev server                                 |
| `pnpm dev:centre`   | Start centre-admin dev server                               |
| `pnpm dev:hotel`    | Start hotel-admin dev server                                |
| `pnpm build`        | Build every workspace in parallel                           |
| `pnpm typecheck`    | Run `tsc --noEmit` / `nuxt typecheck` across all workspaces |
| `pnpm lint`         | ESLint across the repo                                      |
| `pnpm lint:fix`     | ESLint with auto-fix                                        |
| `pnpm format`       | Prettier write                                              |
| `pnpm format:check` | Prettier check (read-only, suitable for CI)                 |

Per-workspace scripts (e.g. `nuxt generate`, `nuxt preview`) are available via `pnpm --filter <name> <script>`.

## Contributing

### Branch naming

`WT-<issue-id>-<short-description>`, e.g. `WT-78-provision-supabase`.

### Commit messages

Prefix with the Jira key and conventional type:

```
[WT-78] feat: provision Supabase staging project
[WT-78] fix: correct RLS policy for bookings
[WT-78] docs: add Supabase setup to README
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `build`, `style`.

### Before pushing

Local gate — run these green before pushing:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
```

### Merging

Until CI and review gates land (Story 1.4), work merges to `main` directly once self-tested against its Jira acceptance criteria. Pull requests are optional.

### Jira hygiene

Every sub-task committed here has a parent story and epic. On completion:

- Comment on the sub-task with what was built, decisions made, and what is flagged for later.
- Transition the sub-task to **Done** if its acceptance criteria are self-testable; otherwise to **Review**.
- Add a running comment on the parent story (e.g. WT-13) noting progress.
- Bubble a comment up to the epic (e.g. WT-2) at story milestones.

### Editor

VS Code recommended with the following extensions:

- Vue (Volar)
- ESLint
- Prettier
- Nuxtr (optional)

Enable "Format on save" with Prettier as the default formatter so the codebase stays clean locally.

## Architecture snapshots

- **Apps** are Nuxt 4 (Vue 3, Nitro, Vite). Each app is a standalone deployable — guest site and the two admin portals will land on separate Vercel projects in Story 1.3.
- **Shared packages** are TypeScript-first, buildless at the source level for dev ergonomics. Packages export from `src/index.ts`; consumers resolve via the workspace path aliases in `tsconfig.base.json`.
- **Backend** lives in Supabase (managed Postgres + auth + storage). Schema and migrations live in `packages/database` once Story 1.2 lands.

## Status

Bootstrap phase — Epic 1 (Project foundations and infrastructure). Story 1.1 (Repository and monorepo structure) closes with this README. Next up: Story 1.2 (Supabase), Story 1.3 (Deployment), Story 1.4 (CI/CD), Story 1.5 (Observability).

## License

Private / proprietary. All rights reserved.
