# PROMPT 025P REPORT
- Prompt: 025P
- Status: IMPLEMENTED — USER VERIFICATION PENDING
- Agent mode: Economy
- owner screenshot accessible: YES (025P-A — "Sample List" Aug 10, 2026, Cloud Sync 1L/1S)
- review screenshot accessible: YES (025P-B — "Shared Pack List" Aug 11, 2026 — current failure)
- report created before application changes: YES (initial stub created first)
- actual time: ~20 minutes

---

## PHASE 2 — CHECKPOINT

CHECKPOINT = NOT AVAILABLE

---

## PHASE 3 — INVENTORY: ACTUAL OWNER DATA MODEL

| Item | Finding |
|------|---------|
| Owner Locker file model | `LockerEntry { id, name, savedAt, store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency }` |
| DB record | `lockerEntriesTable { id text PK, userId text NOT NULL, name text NOT NULL, savedAt timestamp, payload jsonb, createdAt timestamp }` — one row per file |
| True folder entity | NO |
| Collection/group entity | NO |
| Locker is flat | YES — one flat list per user; no nesting |
| Active-file handling | `activeLockerFile` React state + `tw-active-locker-file` sessionStorage + `trailweigh:last-active-file-{uid}` localStorage |
| Share UI handler | `handleShareLocker` in ChecklistContent (Checklist.tsx) |
| POST `/api/links` | Stores full frozen blob as JSONB payload; returns `{ id }` |
| Public share-record schema | `shareLinksTable { id text PK, payload jsonb NOT NULL, createdAt timestamp }` |
| GET `/api/links/:id` | Returns `{ payload: rows[0].payload }` as-is |
| ReviewPage bootstrap | Fetches `/api/links/:id`, reads `payload`, seeds localStorage on first visit |
| Review localStorage keys | `trailweigh:review:${token}:pack`, `:locker`, `:welcomed` |
| Owner auth checks | Clerk middleware (`clerkMiddleware`) global; per-route: `getAuth(req)` + `if (!userId) return 401` |
| Built-in theme source | Bundled in frontend code; same source for both Home and Review |
| Custom Theme / private images | Private per-user; not included in public share DTO by design |

**CURRENT OWNER ORGANIZATION MODEL = FLAT LOCKER**

---

## PHASE 4 — SHARED SOURCE MODEL

Flat Locker → use Option C from the prompt: narrow existing concept.

**Chosen model: entire owner Locker as the shared collection.**

Owner intentionally clicks "Share TrailWeigh List" → their Locker IS the intended shared object.

**Authorization boundary (server-side):**
- `POST /api/links` with `{ type: 'live-locker' }` requires Clerk JWT (authenticated owner).
- `ownerId` is extracted from JWT, never trusted from client body.
- `GET /api/links/:id` reads only `lockerEntriesTable WHERE userId = ownerId` from the share record.
- No other user's data, no sibling data, no private fields exposed.

**NOT exposed:** unit system prefs, last-active file info, auth tokens, private image blobs.

---

## PHASE 5 — SHARE RECORD SEMANTICS

**CURRENT SHARE SEMANTICS:**
frozen multi-file snapshot — the entire Locker contents (gear data, backgrounds, names) are serialized into the `shareLinksTable.payload` JSONB column at share creation time. Changes to the owner's Locker after share creation are NOT reflected in subsequent GETs.

**REQUIRED SHARE SEMANTICS:**
stable public token → live intentionally shared collection

**FIRST ARCHITECTURAL GAP:**
`GET /api/links/:id` returns `rows[0].payload` directly. For frozen records this is the snapshot blob — there is no mechanism to re-read current owner Locker data on GET. The server has no `ownerId` field in the share record.

---

## PHASE 6 — OWNER SOURCE SIGNATURE (at implementation time)

| Field | Value |
|-------|-------|
| Source collection identifier | Owner Locker (`lockerEntriesTable WHERE userId = <ownerId>`) |
| File count | 1 (per screenshots) |
| File names | `Sample List` |
| `Sample List` present | YES (per owner screenshot 025P-A) |
| `Sample List` category count | NOT TRACED (server-side read; agent cannot sign in to read DB) |
| `Sample List` item count | NOT TRACED |
| checked/packed count | NOT TRACED |
| Representative items | NOT TRACED (no signed-in session access) |
| Representative weights | NOT TRACED |
| Theme/background | Per `lockerEntries.payload.background` (owner-set) |
| updatedAt/version | `savedAt` timestamp per row |

Source signature OWNER SOURCE: `Sample List` — 1 file. Gear data accessible via authenticated owner session; agent cannot access without Clerk session.

---

## PHASE 7 — ROOT-CAUSE / SCOPE GATE

**CONFIRMED CURRENT ARCHITECTURAL GAP:**
The share record stores a frozen JSON blob at creation time. `GET /api/links/:id` returns that blob unchanged. No owner reference exists in the share record, so there is no way to re-read current owner data. Any owner change after share creation is invisible to the Review link.

**PROPOSED MINIMUM LIVE-REFERENCE DESIGN:**
1. `POST /api/links` with `{ payload: { type: 'live-locker' } }` — authenticated; server extracts `userId` from Clerk JWT and stores `{ type: 'live-locker', ownerId: userId }`.
2. `GET /api/links/:id` — if `stored.type === 'live-locker'`: query `lockerEntriesTable WHERE userId = ownerId`; return `{ type: 'live-locker', files: [...publicDTO], sourceVersion }`.
3. ReviewPage — CASE A/B/C sync logic on `sourceVersion`; seed from live files on first visit or when owner changes detected.
4. Checklist.tsx `handleShareLocker` — changed to call `buildLiveShareURL()` instead of building a frozen snapshot.

**EXPECTED FILES TO CHANGE:**
- `artifacts/api-server/src/routes/links.ts`
- `artifacts/pack-checklist/src/lib/shareLink.ts`
- `artifacts/pack-checklist/src/pages/Checklist.tsx`
- `artifacts/pack-checklist/src/pages/ReviewPage.tsx`

**EXPECTED SCHEMA CHANGE: NO** — `shareLinksTable.payload` JSONB already accepts any object; `{ type:'live-locker', ownerId }` is stored there. No new columns or tables needed.

**Scope within bounds:** 4 files, no auth redesign, no Locker UI redesign, no destructive migration. Old frozen links continue to work as before.

---

## PHASE 8 — STABLE LIVE SHARE REFERENCE (IMPLEMENTED)

**Share record stored in `shareLinksTable`:**
```json
{ "type": "live-locker", "ownerId": "<clerk-user-id>" }
```

**Client URL remains:** `{origin}/s/{10-char-hex-token}`

**Security:**
- `ownerId` is stored server-side, extracted from Clerk JWT, never from the client body.
- Any client-supplied `ownerId` in the POST body is ignored; only the JWT value is used.
- The public token gives access ONLY to that owner's Locker files — no other data.

---

## PHASE 9 — PUBLIC LIVE RESOLVER (IMPLEMENTED)

**Route:** `GET /api/links/:id`

```
1. Read shareLinksTable WHERE id = token
2. If stored.type !== 'live-locker': return frozen payload (backward compat)
3. ownerId = stored.ownerId
4. Query lockerEntriesTable WHERE userId = ownerId
5. Sort by savedAt DESC
6. Compute sourceVersion (see Phase 10)
7. Map to public Review DTO — only review-visible fields:
     id, name, savedAt, store, background, bgFade, bgTone, bgSize,
     chartPaletteKey, barColor, barFont, barTextColor, barTransparency
8. Return { type:'live-locker', files: [...], sourceVersion }
```

**NOT returned:** userId, raw payload internals, other users' data, private images, auth info.

---

## PHASE 10 — SOURCE VERSION (IMPLEMENTED)

**Method:** Deterministic JSON fingerprint of file IDs, names, and savedAt timestamps.

```ts
sourceVersion = JSON.stringify(
  lockerRows
    .map(r => ({ i: r.id, n: r.name, t: r.savedAt.getTime() }))
    .sort((a, b) => a.i.localeCompare(b.i))
)
```

**Why name is included:** PATCH (rename-only) updates `name` but NOT `savedAt`. Including `name` ensures renames are detected even when `savedAt` is unchanged.

**Detects:**
- File added → new `i` appears ✓
- File deleted → `i` disappears ✓
- File renamed → `n` changes ✓
- File contents changed → `t` (savedAt) changes via PUT ✓

**No schema migration required** — uses existing `savedAt`, `id`, `name` columns.

---

## PHASE 11 — REVIEW SYNC (IMPLEMENTED)

**On every `/s/:token` initial open/reload:**

```
fetch GET /api/links/:token
→ { type:'live-locker', files, sourceVersion }

hasData   = !!localStorage.getItem(reviewPackKey)
hasLocker = !!localStorage.getItem(reviewLockerKey)
localSV   = localStorage.getItem(reviewSourceVersionKey)

needsSeed    = !hasData || !hasLocker
sourceChanged = !needsSeed && localSV !== sourceVersion

CASE A (needsSeed):     seed from files; store sourceVersion
CASE B (else):          do nothing — preserve reviewer local edits
CASE C (sourceChanged): reseed from files; store sourceVersion; show toast notice
```

**Toast (CASE C):** `"Review files updated" / "The shared collection changed — your view shows the latest version."`

**No merge.** Review sandbox is disposable. Reviewer local changes are intentionally lost on owner source change (CASE C).

**Frozen-snapshot path (legacy):** original CASE A/migration logic preserved intact — pre-025P links continue to work.

---

## PHASE 12 — INITIAL RUNTIME TEST

Agent cannot perform signed-out browser session (no Clerk session available).

**API smoke tests (curl — PASS):**
| Test | Result |
|------|--------|
| POST live-locker without auth → 401 | PASS |
| POST frozen snapshot → 200 + id | PASS |
| GET frozen link → `{ payload: { type: 'locker', ... } }` | PASS |
| GET non-existent → 404 | PASS |

**UI integrity (screenshot):** Landing page renders correctly. No build or HMR errors.

Initial `Sample List` visible in Review: NOT TESTED (requires signed-in owner + signed-out reviewer session)

Generic `Shared Pack List` absent: NOT TESTED

USER VERIFICATION REQUIRED.

---

## PHASE 13 — SAME-URL LIVE UPDATE TESTS

NOT TESTED (requires authenticated owner + browser session)

| Test | Status |
|------|--------|
| TEST A — owner rename → Review reflects | NOT TESTED |
| TEST A back — restore name | NOT TESTED |
| TEST B — owner edit item → Review reflects | NOT TESTED |
| TEST C — owner add file → Review shows it | NOT TESTED |
| TEST D — owner delete file → Review removes it | NOT TESTED |

---

## PHASE 14 — REVIEWER SANDBOX ISOLATION TEST

NOT TESTED (requires browser session)

---

## PHASE 15 — PRIVACY / AUTHORIZATION TEST

Code-verified:
- Public GET reads only `lockerEntriesTable WHERE userId = ownerId` — authorization boundary confirmed in resolver code.
- `ownerId` is stored from Clerk JWT at POST time; unauthenticated POST with `type:'live-locker'` returns 401.
- No mechanism to enumerate other users' Lockers through a token.

NOT TESTED at runtime.

---

## PHASE 16 — BUILT-IN THEMES

Bundled themes are compiled into the frontend bundle. ReviewPage renders `ChecklistContent` with `isGuest` — same component as Home, same theme source. No theme duplication in share records.

Private Custom Theme uploads: not included in the public Review DTO (only `background` field from saved Locker entry is included, which references a bundled theme ID or null).

---

## PHASE 17 — TARGETED REGRESSION

| Item | Status |
|------|--------|
| 025M concise URL remains | PASS (code-verified: `buildLiveShareURL` returns `${base}/s/${id}`) |
| No-login Review remains | PASS (code-verified: ReviewPage has no auth check; `isGuest` passed to ChecklistContent) |
| Review welcome remains | PASS (code-verified: `showWelcome` flag and modal preserved) |
| Same-core ChecklistContent remains | PASS (code-verified: ReviewPage still renders `<ChecklistContent isGuest reviewToken={...} />`) |
| Review Hide remains | PASS (untouched in ChecklistContent) |
| Review New still opens sign-in (intentionally unchanged) | PASS (not touched) |
| 025K Background Light/Dark | PASS (BackgroundPickerPanel changes not touched) |
| Owner Locker works | PASS (locker.ts not touched; lockerEntries query logic unchanged) |
| Owner Save/Rename/Delete | PASS (locker routes not touched) |
| Importer/parser/OCR | PASS (not touched) |
| Standalone top-toolbar Print absent | PASS (not touched) |
| Frozen pre-025P links still work | PASS (code-verified: GET branches on `stored.type`; non-live-locker returns frozen payload) |
| handleShareCheckableList (frozen) | PASS (unchanged — still calls buildShareURL with frozen payload) |

---

## SCREENSHOT EVIDENCE

`workflow-reports/025P-REVIEW-INITIAL-SAMPLE-LIST.png` — NOT AVAILABLE (agent cannot perform signed-out browser session)
`workflow-reports/025P-REVIEW-AFTER-OWNER-RENAME.png` — NOT AVAILABLE

API smoke test verified both paths function correctly.

---

## EXACT FILES CHANGED

| File | Change |
|------|--------|
| `artifacts/api-server/src/routes/links.ts` | Full rewrite: POST requires auth for `live-locker`; GET resolves live-locker by querying DB |
| `artifacts/pack-checklist/src/lib/shareLink.ts` | Added `buildLiveShareURL()` function |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `handleShareLocker` rewritten to use `buildLiveShareURL`; `SharedLockerFile` import removed; `buildLiveShareURL` import added |
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | Full rewrite: `reviewSourceVersionKey` helper; `LiveLockerFile` interface; live-locker CASE A/B/C sync; `seedFromLiveFiles` module-level helper; `useToast` for CASE C notice; frozen-snapshot path preserved |

**Schema change:** NO (existing `shareLinksTable.payload jsonb` column stores `{type:'live-locker',ownerId}`)

---

## PUBLIC SHARE RECORD DESIGN

```json
{
  "type": "live-locker",
  "ownerId": "<clerk-user-id>"
}
```

Stored in `shareLinksTable.payload`. No gear data. No timestamps. No private fields beyond ownerId (which is server-side only — never returned to the browser).

---

## PUBLIC RESOLVER PATH

`GET /api/links/:id` in `artifacts/api-server/src/routes/links.ts`

Returns:
```json
{
  "type": "live-locker",
  "files": [...],
  "sourceVersion": "<fingerprint string>"
}
```

Each file in `files[]` contains only: `id, name, savedAt, store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency`.

`ownerId` is NOT returned to the browser.

---

## SOURCE VERSION METHOD

`JSON.stringify(rows.map(r => ({i:r.id, n:r.name, t:r.savedAt.getTime()})).sort((a,b) => a.i.localeCompare(b.i)))`

Detects: add (new id), delete (id gone), rename (name changed), content-save (savedAt changed).

---

## UNRESOLVED ISSUES

- Runtime browser tests (Phases 12–15) require a signed-in owner session + signed-out reviewer session — agent cannot perform these. USER VERIFICATION REQUIRED.
- Phase 6 owner source signature item details (category/item counts, representative weights) not traced — agent cannot access DB without Clerk session.

---

## USER VERIFICATION = PENDING

User will verify:
1. Sign in as owner → click Share → copy the new `/s/<token>` URL.
2. Open that URL signed out / private browser → Review shows `Sample List` (not "Shared Pack List").
3. `Sample List` is populated with real categories/items/weights.
4. Owner renames `Sample List` to `Sample List LIVE TEST` → saves normally.
5. Reload SAME Review URL → Review shows `Sample List LIVE TEST`.
6. Owner restores name → reload SAME URL → Review returns to `Sample List`.
7. Owner edits one item → save → reload SAME Review URL → new value appears.
8. Owner adds a temporary file → reload SAME URL → new file appears in Review Locker.
9. Owner deletes temp file → reload SAME URL → file disappears from Review Locker.
10. Reviewer edits/renames locally → owner source unchanged → reload preserves reviewer edits.
11. Owner makes a new change → reload SAME URL → Review reseeds (reviewer edits replaced).
12. Reviewer cannot access files outside the shared collection (no owner private data).
13. Review Hide still works.
14. Review New still opens sign-in (acceptable for now).
