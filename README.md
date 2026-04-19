# WindTribe

WindTribe is the booking and operations platform for the windsurf/kitesurf community — a guest-facing site at windtribe.com plus admin portals for centres and hotels. This monorepo holds all three applications and their shared code.

## Repository layout

```
.
├── apps/
│   ├── guest-site/      # Public site — windtribe.com (Nuxt)
│   ├── centre-admin/    # Centre operator portal (Nuxt)
│   └── hotel-admin/     # Hotel operator portal (Nuxt)
├── packages/
│   ├── shared/          # Cross-app composables, types, utilities
│   ├── ui/              # Shared Vue components and design primitives
│   └── database/        # Supabase schema, migrations, generated types
├── package.json         # Workspace root
├── pnpm-workspace.yaml  # pnpm workspace declaration
└── README.md
```

## Getting started

Prerequisites: Node.js 20.11+ and pnpm 10+.

```bash
pnpm install                  # install all workspace dependencies
pnpm --filter guest-site dev  # run the guest site
```

Full setup, environment variables, and contribution guidelines will land in Task 1.1.4.

## Status

This repository is in bootstrap (Epic 1 — Project foundations and infrastructure). TypeScript configuration (Task 1.1.2), lint/format tooling (Task 1.1.3), and the comprehensive README (Task 1.1.4) are tracked as follow-up Jira tasks.
