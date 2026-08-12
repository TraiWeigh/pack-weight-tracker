# PROMPT 025N REPORT
- Prompt: 025N
- Status: IN PROGRESS
- Agent mode: Build (Economy)
- Report created before application changes: YES

## PHASE 2 — Checkpoint
CHECKPOINT = NOT AVAILABLE

## PHASE 3 — Failure Reproduction (from code trace — agent cannot perform live signed-out browser test)

Review token used for analysis: `b26ea958c1` (existing link from API server logs)

### Pre-fix fresh-browser state

| Field | Value |
|-------|-------|
| Review pack key exists | NO (fresh browser) → seed WOULD be written |
| Review Locker key exists | NO (never written by ReviewPage) |
| Active Locker file in sessionStorage | NO (never written by ReviewPage) |
| File count in Locker panel | 0 — Locker panel EMPTY |
| Active file shown | None |
| Gear data in main view | YES — seeded correctly to `packKey` |
| Gear data visible to user | YES, but no named file entry |
| "Preinstalled shared file" visible | NO — file list shows empty, no named file |

### New handler trace

`handleNew` (Checklist.tsx:1195–1237):
- Writes `tw-newseed-${uuid}` and `tw-newseed-bg-${uuid}` to localStorage
- Calls `window.open(`${base}/checklist?newseed=${uuid}`, '_blank')`
- ALWAYS opens the owner-authenticated `/checklist` route in a new tab
- Does NOT check `isReview`
- In review mode: opens a tab to an auth-gated page (redirects to login)

## PHASE 4 — Public Seed Bootstrap Trace

| Step | Finding |
|------|---------|
| Fetch | `GET /api/links/${reviewToken}` → `{ payload }` |
| Fields extracted | `payload.data`, `payload.categoryOrder`, `payload.categoryMeta`, `payload.name`, background fields |
| Pack key written | `trailweigh:review:${token}:pack` ← `{ __v:5, items, order, meta }` |
| Locker key written | NEVER — this is the bug |
| SessionStorage active-file | NEVER — this is the bug |
| Welcome key written | `trailweigh:review:${token}:welcomed` = '1' on dismiss |
| `hasData` check | `!!localStorage.getItem(packKey)` — correct guard |
| `loadFromKey` in usePackData | EXISTS and works — reads from `storageKey` correctly |
| Race condition | NONE — all localStorage writes happen before `setStatus('ready')` |
| Missing-seed root cause | Locker never seeded; no active-file set; gear data loads as working list but no named file entry |

## PHASE 5 — New Control Trace

| Step | Finding |
|------|---------|
| Handler | `handleNew` (Checklist.tsx:1195) |
| isReview check | MISSING — no check at all |
| Mechanism | `window.open(${base}/checklist?newseed=${uuid}, '_blank')` |
| Auth dependency | Opens `/checklist` which requires Clerk auth → redirects to login |
| Review compatibility | NONE — always owner path |

## PHASE 6 — Root-Cause Gate

**ROOT CAUSE OF MISSING SEED FILE:**
`ReviewPage.tsx` seeds `trailweigh:review:${token}:pack` (working pack data) but never seeds `trailweigh:review:${token}:locker` (Locker file list). The gear items load as the working list but there is no LockerEntry, so the file panel is empty and no `activeLockerFile` is set. The user sees gear data in the main area but no named file.

**ROOT CAUSE OF NEW FAILURE:**
`handleNew` unconditionally calls `window.open(…/checklist?newseed=…, '_blank')`, which is the owner-authenticated route. In review mode this opens an auth-gated page. The handler has no `isReview` branch.

**DETERMINATION: DIFFERENT ROOT CAUSES**

The seed failure is a bootstrap/initialization omission (Locker key never written).
The New failure is a handler routing issue (wrong navigation target in review mode).

**Decision per prompt Phase 6 gate: Fix ONLY Goal A. Defer New to the next prompt.**

## PHASE 7 — Fix Applied

**File changed: 1** — `artifacts/pack-checklist/src/pages/ReviewPage.tsx`

### What was added

Inside the `!hasData` block (first-visit seed), after writing `packKey`, now also:

1. **Seed `reviewLockerKey`** (`trailweigh:review:${token}:locker`) with a LockerEntry
   matching the `LockerEntry` interface (`id`, `name`, `savedAt`, `store`, `background`, etc.)
   
2. **Seed sessionStorage `tw-active-locker-file`** so `ChecklistContent` mounts with the
   file pre-selected (same key as `ACTIVE_LOCKER_FILE_SS_KEY` in Checklist.tsx)

Also added **migration guard** (separate from `!hasData`): if `packKey` exists but
`reviewLockerKey` is missing, also seed the Locker. This handles users who had the 025L
partial state where pack data was seeded but Locker was never written.

The seed Locker entry ID is `review-seed-${reviewToken}` — stable, tied to the token,
so it can be found and managed by the reviewer.

**No other files changed.** New failure deferred.

## PHASE 8 — New: DEFERRED

New failure has a different root cause (wrong navigation in handleNew).
Will be fixed in the next prompt (025O).

Recorded root cause for 025O:
- `handleNew` in `Checklist.tsx` always calls `window.open(…/checklist?newseed=…, '_blank')`
- Needs an `isReview` branch that instead creates a new blank file in the review-local
  sandbox without opening a new tab or calling any auth endpoint

## PHASE 9 — Runtime Test: Seed
NOT TESTED by agent (cannot perform signed-out browser test).
USER VERIFICATION REQUIRED.

## PHASE 10 — Runtime Test: Refresh/Delete/Fresh
NOT TESTED by agent.
USER VERIFICATION REQUIRED.

## PHASE 11 — New
DEFERRED — different root cause. See PHASE 8.

## PHASE 12 — Owner Isolation
NOT TESTED by agent (no signed-in owner session available).
USER VERIFICATION REQUIRED.
No code paths that touch owner data were changed.

## Targeted Regression

| Check | Status |
|-------|--------|
| 025M concise Share URL | UNTOUCHED — no change to shareLink.ts or Share handlers |
| No-login Review page loads | PASS (screenshot from 025M confirmed) |
| Welcome modal | UNTOUCHED |
| Same ChecklistContent architecture | PRESERVED |
| Review local storage token-namespaced | PRESERVED |
| 025K Background panel Light/Dark | UNTOUCHED |
| Owner New | UNTOUCHED — handleNew not changed |
| Owner Save/Locker | UNTOUCHED |
| Importer/parser | UNTOUCHED |

## Files Changed
- `artifacts/pack-checklist/src/pages/ReviewPage.tsx` — seed Locker + set sessionStorage active-file on first visit

## Unresolved
- `New` in review mode — deferred to 025O (different root cause)
- Full signed-out browser test — USER VERIFICATION REQUIRED

## USER VERIFICATION = PENDING

User will verify:
1. Fresh private Review link opens with no login.
2. Intended preinstalled shared file appears in the Locker file list.
3. File is the active/open file (its name shows in the header).
4. Shared file contents (categories/items) are visible.
5. Refresh keeps the file.
6. Deleting the file and refreshing SAME browser keeps it deleted (no re-seed).
7. Fresh separate browser receives the file again from the public seed.
8. Owner original/Locker remain untouched.
