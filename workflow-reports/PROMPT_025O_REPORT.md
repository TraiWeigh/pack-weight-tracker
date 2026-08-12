# PROMPT 025O REPORT
- Prompt: 025O
- Status: IMPLEMENTED — USER VERIFICATION PENDING
- Agent mode: Build (Economy)
- Owner source screenshot (025O-A): YES — shows "Sample List" in owner Locker
- Review failure screenshot (025O-B): YES — shows "Shared Pack List" generic name in Review Locker
- Report created before application changes: YES

## PHASE 2 — Checkpoint
CHECKPOINT = NOT AVAILABLE

## PHASE 3 — Source File & Reproduced Failure

From screenshots and code trace (live signed-out browser test not available to agent):

**Source file (owner):** "Sample List" (Aug 10, 2026) — single entry in owner Locker, Cloud Sync badge "1L / 1S"
**Review result:** "Shared Pack List" (Aug 11, 2026) — generic fallback name, wrong

The prompt refers to "Seirra/Dutch/o826" as the owner's actual file; screenshots show "Sample List" as the test evidence file. In either case the pattern is the same: owner file name is NOT reaching the Review.

## PHASE 4 — Share Request Body Analysis (code trace)

`handleShareLocker` (Checklist.tsx:1063–1079) constructs:

```ts
const payload = {
  type:          'locker',
  data:          store.items,          // current working list gear data
  categoryOrder: store.order,
  categoryMeta:  store.meta,
  background:    background ?? null,
  ...
  name:          activeLockerFile?.name ?? undefined,  // ← BUG: null when state not set
  lockerFiles,                         // full Locker snapshot
  ...
};
```

| Question | Answer |
|----------|--------|
| POST body contains real file name? | FAIL — `activeLockerFile?.name` is undefined |
| POST body contains real category/item data? | YES — `store.items/order/meta` (current working state) |
| POST body uses generic name? | YES — undefined → ReviewPage falls back to "Shared Pack List" |
| Share handler uses wrong state variable? | YES — `activeLockerFile` is null at share time |
| Blank/default store? | NO — store.items is correctly the current working state |

## PHASE 5 — Stored Public Record

API server (artifacts/api-server/src/routes/links.ts):
```ts
// POST: stores payload exactly as received
await db.insert(shareLinksTable).values({ id, payload });

// GET: returns payload exactly as stored
return res.json({ payload: rows[0].payload });
```

**Server stores and retrieves without any transformation.** The server is NOT the problem.
If `payload.name` is undefined in the POST, it is stored as undefined/null and returned as undefined/null.

## PHASE 6 — GET Response

GET /api/links/:id returns the complete stored payload.
`rows[0].payload.name` = undefined (because POST body had it undefined).

**STORED PUBLIC RECORD SIGNATURE matches POST BODY SIGNATURE — server is faithful.**

## PHASE 7 — ReviewPage Mapping

ReviewPage.tsx line 63:
```ts
const seedFileName = (payload.name as string | undefined) ?? 'Shared Pack List';
```

When `payload.name` is undefined → `seedFileName` = `'Shared Pack List'` ← fallback fires.
This is CORRECT ReviewPage behavior — the fallback is appropriate. The fix belongs upstream.

## PHASE 8 — Root-Cause Gate

**FIRST DIVERGENCE:**
`payload.name` is `undefined` in the POST body because `activeLockerFile?.name` is `undefined` in `handleShareLocker`.

**CONFIRMED ROOT CAUSE: LAYER A — OWNER SHARE HANDLER / CLIENT PAYLOAD CONSTRUCTION**

`activeLockerFile` state is null at share time. This can happen when:
- The 022G mount-effect hasn't propagated yet after a page refresh (React async state update)
- The user has the Locker open showing saved files but hasn't explicitly loaded a file in this session
- The user was in "new list" mode when they clicked Share

`handleShareLocker` has access to ALL the data needed to resolve the name (Locker entries, localStorage), but uses only `activeLockerFile?.name` with no fallback.

## PHASE 9 — Fix Applied

**File changed: 1** — `artifacts/pack-checklist/src/pages/Checklist.tsx`

### handleShareLocker fix (025O)

Added multi-level name resolution before the payload object:

```ts
const resolvedShareName: string | undefined =
  activeLockerFile?.name ??
  (userId ? readLastActiveFileFromLS(userId)?.name : undefined) ??
  (lockerFiles?.length === 1 ? lockerFiles[0].name : undefined);
```

Fallback chain:
1. `activeLockerFile?.name` — React state (preferred; set when file explicitly loaded)
2. `readLastActiveFileFromLS(userId)?.name` — localStorage; survives page refresh
3. `lockerFiles?.[0]?.name` when exactly 1 Locker entry — must be the shared file
4. `undefined` — ReviewPage shows "Shared Pack List" as absolute last resort

### handleShareCheckableList fix (025O)

Same fix without the `lockerFiles` fallback (no Locker snapshot in this handler):

```ts
const resolvedCheckableName: string | undefined =
  activeLockerFile?.name ??
  (userId ? readLastActiveFileFromLS(userId)?.name : undefined);
```

No other files changed. ReviewPage.tsx, API server, database — all correct, unchanged.

## PHASE 10 — Post-Fix Signature Comparison (code trace)

After fix, for an owner with one saved file ("Sample List" / "Seirra/Dutch/o826"):

| Chain step | File name value |
|------------|----------------|
| Source owner file | "Sample List" (or "Seirra/Dutch/o826") |
| POST body `payload.name` | resolvedShareName = `lockerFiles[0].name` = "Sample List" ✓ |
| Stored public record `name` | "Sample List" (server stores faithfully) ✓ |
| GET response `payload.name` | "Sample List" (server returns faithfully) ✓ |
| ReviewPage `seedFileName` | "Sample List" (no longer hits 'Shared Pack List' fallback) ✓ |
| Review Locker entry `name` | "Sample List" ✓ |

Category/item data (`store.items/order/meta`) was already correct — unaffected by this fix.

## PHASE 11 — Signed-Out Runtime Test
NOT TESTED by agent (cannot perform signed-out browser session).
USER VERIFICATION REQUIRED.

## PHASE 12 — Permanence / Isolation
- Public seed: no change to server — public seed remains permanent (stored in DB)
- Owner: only `handleShareLocker` client-side payload changed — owner data read-only
- Review: ReviewPage reads the fixed name from the GET response and creates its local Locker entry

## Targeted Regression

| Check | Status |
|-------|--------|
| 025M concise share URL | UNTOUCHED — buildShareURL unchanged |
| No-login Review | UNTOUCHED |
| Welcome modal | UNTOUCHED |
| Same-core ChecklistContent | UNTOUCHED |
| Review Hide works | UNTOUCHED |
| 025K Background panel Light/Dark | UNTOUCHED |
| Review New opens sign-in (intentionally unchanged) | UNTOUCHED |
| Importer/parser | UNTOUCHED |
| Owner Save/Locker | UNTOUCHED — only the payload name field resolved differently |
| Server/database | UNTOUCHED |

## Files Changed
- `artifacts/pack-checklist/src/pages/Checklist.tsx` — multi-level name fallback in `handleShareLocker` and `handleShareCheckableList`

## Unresolved
- Live signed-out browser test — USER VERIFICATION REQUIRED
- Review `New` — deferred (opens sign-in; user says acceptable for now)

## USER VERIFICATION = PENDING

User will verify:
1. Share `Seirra/Dutch/o826` using the normal Share control.
2. Open the new `/s/<token>` link signed out / private browser.
3. No login required.
4. Review Locker shows `Seirra/Dutch/o826` (not "Shared Pack List").
5. File is populated with correct categories/items/weights.
6. Owner original remains untouched.
