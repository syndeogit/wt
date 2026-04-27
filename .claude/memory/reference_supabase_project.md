---
name: WT Supabase project ID
description: WindTribe Supabase project is wrasfpjetwewvmjawqxs — NOT the relronbmenrmxxkpbyst listed in C:\dev\dev\CLAUDE.md (that ID belongs to the ION booking project)
type: reference
originSessionId: eae64e6c-34b7-4791-ae1d-5821bc0f45c5
---
The correct Supabase project for the WindTribe codebase is:

- **Project ID / ref:** `wrasfpjetwewvmjawqxs`
- **Name:** windtribe
- **Region:** eu-west-1
- **Status:** ACTIVE_HEALTHY

`C:\dev\dev\CLAUDE.md` (updated 2026-04-26) now lists both projects under "Supabase" with WindTribe first. Originally it only listed `relronbmenrmxxkpbyst` under "Supabase (ION Booking)" and was easy to misread as the WindTribe project — that mistake on 2026-04-26 caused timeouts when applying the Slice N add-ons migration. If the file ever reverts, the correct WindTribe ID is `wrasfpjetwewvmjawqxs`.

Use `mcp__claude_ai_Supabase__list_projects` if uncertain — it returns all three projects (jobhunt, alignment, windtribe) in this organisation.

When applying migrations to WindTribe via Supabase MCP, always use `wrasfpjetwewvmjawqxs`.
