# @windtribe/database

Supabase configuration, SQL migrations, and (eventually) generated TypeScript types.

## Layout

```
packages/database/
├── src/                          # Exported TS types — populated via `supabase gen types`
├── supabase/
│   ├── config.toml               # Local Supabase project config
│   └── migrations/
│       └── 20260419000000_baseline.sql  # Empty baseline migration
└── README.md
```

## Common commands

Run from repo root.

```bash
pnpm exec supabase --version          # sanity-check the CLI
cd packages/database

pnpm exec supabase start              # boot local Supabase (Docker required)
pnpm exec supabase stop
pnpm exec supabase db reset           # reset local DB and re-run migrations

# New migration
pnpm exec supabase migration new <name>

# Generate TS types from local DB (writes to src/types.ts once Story 1.2 lands)
pnpm exec supabase gen types typescript --local > src/types.ts
```

## Linking to the hosted project

Once the hosted Supabase project exists (WT-78):

```bash
cd packages/database
pnpm exec supabase link --project-ref <ref>
pnpm exec supabase db push           # apply local migrations to hosted
```

## Environment variables

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` live in `.env.local` at the repo root. Never commit them.
