# Database scripts

One-off Node scripts for provisioning and seeding the data backends.

## `directus-setup.js`

Idempotent provisioning + seed for the WindTribe Directus collections on the shared Syndeo instance. Run from the repo root:

```bash
node packages/database/scripts/directus-setup.js
```

Reads `NUXT_PUBLIC_DIRECTUS_URL`, `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD` from `.env.local`. Safe to re-run — every create/seed call checks for existing records by name/slug first.

**What it does:**

1. Logs in as admin.
2. Creates `wt_centres`, `wt_products`, `wt_hotels` collections with the field schemas documented in `docs/directus-design.md`.
3. Creates m2o relations: `wt_products.centre → wt_centres`, `wt_hotels.centre → wt_centres`.
4. Grants the **Content - Public** policy read access on published records in all three collections.
5. Seeds ION Karpathos centre + 5 products + 2 hotels.

**When to run:**

- First-time provisioning.
- After schema changes (edit the script, re-run).
- Restoring a local/staging Directus from scratch.
