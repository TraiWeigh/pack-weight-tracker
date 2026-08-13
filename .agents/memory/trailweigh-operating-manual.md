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
- **Frozen POST (links.ts:50-53):** Intentionally anonymous for backward compat. Creates only new `share_links` row; cannot touch `locker_entries`. Risk = unauthenticated DB write / MEDIUM severity. NOT authorization bypass, NOT CSRF. Body capped at 12MB.
- **Review writes 9 GLOBAL appearance keys** (trailweigh:background/bgFade/bgTone/bgSize/chartPalette/barColor/barFont/barTextColor/barTransparency). 025U said "5" — 025V corrected to 9.
- Payload fields in server: store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency. **unitSystem is NEVER included.**
- **Express body limit = 12MB** (`express.json({ limit: '12mb' })`). Import upload = **20MB** (multer). 025U's "no size limit" was wrong.
- **Token collision → HTTP 500 to one request, NOT a process crash.** Express 5 async error handling routes rejection to default error handler. Process survives.
- **SESSION_SECRET = UNUSED/LEGACY.** `express-session` not in dependencies. No session middleware. Auth = Clerk-only.
- **SyncStatusPanel IS rendered** inside LockerPanel. Shows "Synced [time]" from last SAVE even when newer local edits exist. Cannot detect unsaved local changes (no dirty flag). Classification: technically accurate but potentially misleading.
- **userId NOT indexed** on `locker_entries` (confirmed by pg_indexes catalog query). Urgency: low at 3 rows; add before public launch.
- **locker_entries: 3 rows; share_links: 82 rows** (as of 2026-08-13 dev DB).
- **Pack data key = user-namespaced** (`pack-checklist-v5-${uid}`). Safe across accounts. Global keys (unit pref, background, bar*, `trailweigh:photoCollections`) are device-global.
- **Custom photo IndexedDB = NOT userId-namespaced.** DB='trailweigh', store='bgPhotos', keyPath='photoId' only. User B on shared device inherits User A's custom photo blobs. EXPOSURE OF PERSONAL UPLOADED PHOTOS on shared devices.
- **SharedPackView (/shared) = ACTIVE** legacy route for hash-encoded share links. SharedChecklistPage = dead import (not routed).
- **CSRF is wrong category for frozen POST** — no victim auth state. Correct: anonymous write surface. CSRF on Locker writes = EFFECTIVELY MITIGATED by Clerk SameSite=Lax.
- **API calls use `credentials: 'include'` (cookie auth, not bearer).** No Authorization header constructed by frontend. Same-origin relative URLs (/api/locker).
- **LIVE TOKEN RETURNS ALL RETAINED FILES AFTER ACCOUNT DELETION** (not empty list — 025V was WRONG). locker_entries survive because no webhook deletes them; resolver queries DB directly without Clerk verification.
- **Delete Account page = STATIC INFO ONLY.** No API calls, no automated deletion. Users must contact team. No /api/user endpoint. Deletion is a future feature.
- **Privacy Policy outdated:** Section 3 claims "server stores only share-link snapshots" — FALSE since Locker sync added. Section 6 does not disclose that locker_entries survive account deletion.
- **Safari 7-day eviction:** ALL script-writable storage (localStorage + IndexedDB) after 7 days of Safari use without site interaction. Tracker classification NOT required (025V was wrong about this). Regular TrailWeigh use resets timer. Home Screen apps have first-party exemption.
- **CORS broad:** `credentials: true, origin: true` — permissive but SameSite=Lax prevents CSRF under current config. Design risk if Lax ever changes.

## Replit platform facts (from official docs, HIGH confidence)

- Checkpoints: code + AI context + env config + dev DB (DB restore optional, must check "Database")
- Dev and prod databases are SEPARATE
- First publish: optional data copy (toggle); overwrites prod data
- Republish: code only; prod DB preserved
- Production rollback: not direct — roll back in editor then republish
- Tasks run in isolated project copies; fresh context = new chat thread
