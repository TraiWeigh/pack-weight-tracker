---
name: TrailWeigh Operating Manual
description: Pointer to 025T report — the permanent comprehensive reference for TrailWeigh architecture, platform facts, and agent communication rules.
---

## Location

`workflow-reports/PROMPT_025T_REPORT.md` (101KB, 1,963 lines, 220 questions answered)

## What it covers

- **Parts A–O:** 220 Q&A covering audit of 025R/025S, Replit platform model, checkpoints, dev/prod DB separation, task system, cost/efficiency, data safety, security findings
- **Section G:** Gold Standard Prompt Skeleton for all future TrailWeigh code-change prompts
- **Section H:** Replit Operating Manual (10 rules for any AI working on this codebase)
- **Sections B–F:** Confirmed facts tables (architecture, DB schema, platform behaviors)

## Key confirmed facts (quick reference)

- Share token: `randomBytes(5).hex()` = 10 chars, 40-bit, no expiry, no rate limit
- sourceVersion: JSON fingerprint of `{i,n,t}` per locker row — SAVED changes update it; UNSAVED do not; RENAME changes `n:` only (PATCH does NOT update savedAt)
- Unit pref: `localStorage['tw-unit-system']` — global, not per-file, **NOT in DB** (DB SELECT confirmed NULL for all rows — 025T Q132 was WRONG; 025U corrects it)
- Background UUID (Sample List Live Test): `701cc0ea-4912-416c-b08e-0c747381668c`, type:custom → correctly invisible in Review
- Built-in themes: Landscape only (10 presets). Retro-Outdoors/Psychedelic/Topo = removed in 023D (were built-in at 023C); owner has as private browser collections
- No `user.deleted` webhook → orphaned DB rows on account deletion
- No FK between share_links and locker_entries
- DATABASE = HELIUM (host segment confirmed; no neon.tech; NEON_DATABASE_URL absent)
- **NEW (025U):** Unauthenticated `POST /api/links` frozen-snapshot path (links.ts:50-53) — no auth check, stores arbitrary JSON. BLOCKING security gap for public launch.
- **NEW (025U):** Review seedFromLiveFiles writes 5 GLOBAL appearance keys (trailweigh:background/bgFade/bgTone/bgSize/chartPalette) — two review tokens in same browser contaminate each other's appearance.
- Payload fields in server: store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency. **unitSystem is NEVER included.**

## Replit platform facts (from official docs, HIGH confidence)

- Checkpoints: code + AI context + env config + dev DB (DB restore optional, must check "Database")
- Dev and prod databases are SEPARATE
- First publish: optional data copy (toggle); overwrites prod data
- Republish: code only; prod DB preserved
- Production rollback: not direct — roll back in editor then republish
- Tasks run in isolated project copies; fresh context = new chat thread
