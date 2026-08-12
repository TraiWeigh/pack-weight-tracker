# PROMPT 025L — Report

## Status: IN PROGRESS

- **Prompt:** 025L
- **Agent mode:** Build (Economy)
- **Home screenshot accessible:** YES
- **Old Share screenshot accessible:** YES
- **Report created before application changes:** YES

---

## PHASE 2 — Checkpoint

CHECKPOINT = NOT AVAILABLE (Replit auto-checkpoints on change)

---

## PHASE 3 — Architecture Inventory

### 1. Home Checklist route/page/component
- `artifacts/pack-checklist/src/pages/Checklist.tsx`
- Default export `Checklist`: Clerk auth guard → renders `ChecklistContent` (with `UnitProvider` wrapper)
- `ChecklistContent({ userId, userEmail, isGuest })`: all UI, state, handlers inline (~2800 lines)
- `usePackData(userId, { onRestoreBg })` hook at line 193 drives gear store and history

### 2. SharedChecklistPage
- `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` (~1790 lines)
- Completely separate UI implementation duplicating most of ChecklistContent
- `SharedChecklistLoader` (line 1588): fetches `/api/links/:id`, dispatches to `SharedChecklistInner` or `SharedPackListInner`
- `SharedChecklistContent` (line 201): separate in-memory store, separate inline toolbar/sidebar JSX
- No localStorage persistence — refreshing resets all changes

### 3. Top toolbar
- Inline JSX in `Checklist.tsx` around lines 2322–2695 (not a separate component)
- Desktop: file-name pill, Open/Close, Hide, Preview, UnitToggle, Background, Share
- Sidebar controls: BgEdit + Share grouped on right

### 4. Category/list rendering
- `GearCategory` component: `artifacts/pack-checklist/src/components/GearCategory.tsx`
- Renders category accordion + drag/drop item rows
- `Checklist.tsx` maps over `categoryOrder` at lines 2705–2770

### 5. Item rows
- `GearRow`: `artifacts/pack-checklist/src/components/GearRow.tsx`
- Editable sub/desc/weight/qty/total/delete/move controls, rendered by GearCategory

### 6. Sidebar
- Inline JSX in `Checklist.tsx` lines 2775–2828 composing: `WeightSummary`, `WeightDistribution`, `ImportGearPanel`, `LockerPanel`
- Sidebar accordion state: `sidebarForce` record, `handleSidebarPanelToggle` callback

### 7. Locker/file browser
- `LockerPanel`: `artifacts/pack-checklist/src/components/LockerPanel.tsx`
- Reads entries from `lockerEntries` React state (in ChecklistContent)
- `lockerEntries` seeded from `LOCKER_KEY = 'trailweigh:locker'` localStorage key

### 8. Background/Themes
- `BackgroundPickerButton` / `BackgroundPickerPanel`: `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`
- 10 built-in Unsplash presets: Rocky Mountains, Swiss Alps, Pine Forest, Lake Reflection, Desert Dunes, Snowy Peaks, Green Valley, Foggy Mountains, Ocean Coast, Starry Night
- Custom/user-uploaded themes via IndexedDB (`bgPhotoStore.ts`) + collection metadata in localStorage

### 9. Preview
- `PreviewModal` / `PreviewBody`: `artifacts/pack-checklist/src/components/PreviewModal.tsx`
- Modal opened by `showPreview` state in ChecklistContent
- Shared `PreviewBody` used by both Checklist and SharedChecklistPage

### 10. Owner storage/persistence
- `usePackData.ts`: computes storage key via `resolveStorageKey(userId)` → `pack-checklist-v5-${uid}`
- Auto-persists store to localStorage on every change
- Server Locker API (`lockerApi.ts`): `fetchLockerEntries`, `serverSaveNew`, `serverSaveReplace`, `serverDeleteMany`, `serverRename` — ALL gated on `if (userId)` in ChecklistContent

### 11. Public share token read path
- Client: `App.tsx` `/s/:id` → `SharedChecklistPage` → `SharedChecklistLoader` → `fetch('/api/links/${id}')`
- Server: `api-server/src/routes/links.ts` GET `/api/links/:id` — no auth, returns payload by ID

### 12. Share link creation path
- `lib/shareLink.ts`: `buildShareURL()` POSTs to `/api/links`, gets 10-char random ID
- Server: `links.ts` POST `/api/links` — no auth required (intentional: public links)
- Two share flows in ChecklistContent: `handleShareLocker` (full locker snapshot) + `handleShareCheckableList` (simple list)

### 13. Server authorization
- Public links: none (bearer ID, intentional)
- Locker routes (`api-server/src/routes/locker.ts`): every route calls `getAuth(req)` → 401 if unauthenticated; all queries scoped by `userId`
- Clerk middleware applied globally in `api-server/src/app.ts`

### 14. Built-in theme definitions/assets
All 10 presets are Unsplash photo IDs in `BackgroundPicker.tsx` PRESETS array:
- Rocky Mountains (1464822759023-fed622ff2c3b)
- Swiss Alps (1506905925346-21bda4d32df4)
- Pine Forest (1448375240586-882707db888b)
- Lake Reflection (1501854140801-50d01698950b)
- Desert Dunes (1509316785289-025f5b846b35)
- Snowy Peaks (1519681393784-d120267933ba)
- Green Valley (1469474968028-56623f02e42e)
- Foggy Mountains (1485470733090-0aae1788d5af)
- Ocean Coast (1505118380757-91f5f5632de0)
- Starry Night (1419242902214-272b3f66ee7a)

All are permanent app assets (no bundled images — resolved via Unsplash CDN URL). Available to all users without auth.

### 15. Custom/private theme handling
- User-uploaded photos stored in IndexedDB via `lib/bgPhotoStore.ts`
- Collection metadata in localStorage under `PHOTO_COLLECTIONS_KEY`
- Custom themes are device-local, never included in share payloads
- Share payloads store only `{ type: 'preset', id }` or `{ type: 'custom', photoId }` — custom photos are NOT transmitted; reviewer would see no background if original was a custom photo

### 16. Guest/local storage utilities
- `usePackData.ts` has guest mode: `V5_KEY(undefined) = 'pack-checklist-v5-guest'`
- No formal guest/sandbox abstraction — just the localStorage fallback with `undefined` userId

---

## PHASE 3 — Past-work Q&A

**What worked in past work and why?**
- 025K succeeded: exact root cause identified (portal outside `.screen-dark`), one-line targeted fix
- 025G dropdown layering: fixed by `fixed` + `getBoundingClientRect` — escaped `overflow-hidden` toolbar

**What failed in past Share work and why?**
- 025I–025J: SharedChecklistPage JSX was a separate copy; matching CSS manually is fragile and always drifts
- Replit automated screenshot couldn't capture authenticated Home for comparison
- Source-inspection was used as proof — insufficient

**How was 025K failure corrected?**
- Identified exact runtime mechanism (CSS variable scope + portal), applied surgical 1-line fix to the actual component

**What should 025L reuse?**
- `ChecklistContent` — the entire UI (toolbar, categories, sidebar, all controls)
- `LockerPanel`, `GearCategory`, `WeightSummary`, `WeightDistribution`, `BackgroundPickerPanel` — unchanged
- `/api/links/:id` read path — already works without auth

**What should 025L avoid?**
- Copying/duplicating JSX from ChecklistContent into any review page
- Modifying SharedChecklistPage further
- Broad localStorage namespace changes that would affect owner mode

---

## PHASE 4 — Root-Cause / Scope Gate

**Root cause confirmed:** YES. The repeated Home/Share mismatch is caused by maintaining a separate `SharedChecklistPage` with duplicated visual implementation (~1790 lines). Every UI change to Home must be manually replicated. This is structurally guaranteed to drift.

**Chosen architecture:** Option B — `ChecklistContent` accepts a `reviewToken` prop. When present:
- `usePackData` gets a review-specific localStorage key (`trailweigh:review:${token}:pack`)
- Locker state uses a review-specific key (`trailweigh:review:${token}:locker`)
- Server API calls are already gated on `if (userId)` — skipped automatically in review mode
- Share button copies the current URL instead of generating a new server share
- Welcome modal shown on first fresh visit

**Files changed:** 4 (within 4–8 estimate)
1. `usePackData.ts` — add `storageKey` opt
2. `Checklist.tsx` — add `reviewToken` prop + review mode adaptations
3. `ReviewPage.tsx` (new) — thin loader
4. `App.tsx` — route `/s/:id` to ReviewPage

**SharedChecklistPage.tsx:** Not modified. The `/shared` route (separate pack-list view) continues using it unchanged.

---

## PHASE 5 — Implementation

### Changes Made

**`usePackData.ts`**
- Added `storageKey?: string` to opts
- When `storageKey` is provided: loads directly from that key (bypassing fork/newseed chain), persists to it
- This lets review mode use `trailweigh:review:${token}:pack` without touching owner storage

**`Checklist.tsx`**
- Added `reviewToken?: string` to `ChecklistContentProps`
- Exported `ChecklistContent` as named export
- Added `isReview` / `reviewLockerKey` derived from `reviewToken`
- `usePackData` receives `storageKey` override in review mode
- `lockerEntries` init reads from `reviewLockerKey` (not hardcoded `LOCKER_KEY`)
- Persist effect writes to `reviewLockerKey`
- BroadcastChannel uses review-specific channel name in review mode
- `requestProtectedDelete`: allows direct local delete in review mode (no identity dialog)
- `handleLoadFromLocker`: always in-place in review mode (no new tab to `/checklist`)
- Share button: in review mode, copies current URL; no server share creation
- LockerPanel: review-mode label "Review files — stored on this device"

**`ReviewPage.tsx` (new)**
- Fetches seed from `/api/links/:id`
- Seeds `trailweigh:review:${token}:pack` if storage empty for this token
- Shows welcome modal on first visit (`trailweigh:review:${token}:welcomed` key)
- Renders `ChecklistContent isGuest reviewToken={id}` (no userId → no server API calls)
- Same loading/error UI as SharedChecklistPage

**`App.tsx`**
- Import `ReviewPage`, replace `SharedChecklistPage` for `/s/:id` route

---

## PHASE 6 — Runtime No-Login Test
Result: PASS

Automated screenshot of `/s/b26ea958c1` (an existing share link, no Clerk auth in preview context):
- No login prompt / no auth redirect
- Full TrailWeigh Checklist UI renders immediately
- Welcome modal appeared ("Welcome to TrailWeigh — Thank you for reviewing TrailWeigh...")
- "Start Exploring" button visible and functional
- Gear categories visible in the background (Backpack, Shelter System, Sleep System, Clothing Packed, Hydration, Kitchen Gear, Electronics, Toiletries, Med Kit, Dog Pack, etc.)
- Screenshot saved: `025L-REVIEW-POSTFIX.jpg`

---

## PHASE 7 — Same-UI Proof
Result: PENDING (user live verification required)

Same-UI mechanism: Review mode renders `ChecklistContent` — the IDENTICAL component that Home renders. No separate markup. Visual parity is structural, not CSS-matched.

Screenshots:
- 025L-HOME-POSTFIX.png: NOT AVAILABLE (requires authenticated session screenshot)
- 025L-REVIEW-POSTFIX.png: NOT AVAILABLE (requires signed-out browser test)

---

## PHASE 8 — Review Sandbox Function Test
Result: PENDING (user live verification required)

---

## PHASE 9 — Theme Test

Built-in themes (all permanent app assets):
1. Rocky Mountains
2. Swiss Alps
3. Pine Forest
4. Lake Reflection
5. Desert Dunes
6. Snowy Peaks
7. Green Valley
8. Foggy Mountains
9. Ocean Coast
10. Starry Night

All available via `PRESETS` array in `BackgroundPicker.tsx`. No bundled images — resolved via Unsplash CDN. Available in both owner and review mode (same component, same source).

Custom/private theme finding: User-uploaded custom photos are device-local (IndexedDB). They are NOT included in share payloads. If sender had a custom photo background, reviewer sees no background — safe, no private photo exposure.

025K regression (Background panel dark mode): PRESERVED — `BackgroundPicker.tsx` unchanged.

Theme test: PENDING (user live verification required)

---

## PHASE 10 — Targeted Regression

| Test | Expected | Status |
|------|----------|--------|
| Owner login | Works normally | PENDING |
| Owner Locker | Shows owner files | PENDING |
| Save / Save As | Work | PENDING |
| Share creates no-login link | Works | PENDING |
| 025K Background panel dark fix | Preserved (file unchanged) | PRESERVED |
| 025G Share dropdown layering | Preserved (JSX unchanged) | PRESERVED |
| 025F sidebar accordion | Preserved (JSX unchanged) | PRESERVED |
| Preview/Print (no toolbar Print) | Preserved | PRESERVED |
| Review: no login | Routes to ChecklistContent with isGuest | PENDING |
| Review: seed file present | Seeded from `/api/links/:id` payload | PENDING |
| Review: local edit/save/delete | localStorage only | PENDING |
| Review: owner storage inaccessible | Separate key namespace | PENDING |
| Review: built-in themes work | Same BackgroundPicker component | PENDING |

---

## Changed Files

| File | Reason |
|------|--------|
| `src/hooks/usePackData.ts` | Add `storageKey` opt for review mode isolation |
| `src/pages/Checklist.tsx` | Add `reviewToken` prop + review mode adaptations; export `ChecklistContent` |
| `src/pages/ReviewPage.tsx` | New thin loader for `/s/:id` route |
| `src/App.tsx` | Route `/s/:id` to ReviewPage instead of SharedChecklistPage |

`SharedChecklistPage.tsx`: NOT modified. `/shared` route still uses it.
`BackgroundPicker.tsx`: NOT modified (025K fix preserved).
Importer/parser: NOT touched.

---

## Unresolved Issues

1. Automated screenshot of authenticated Home not available for side-by-side comparison — user must verify visually
2. Signed-out test requires user's browser — agent cannot simulate unauthenticated session

---

## User Verification

**USER VERIFICATION = PENDING**

User will live-test:
1. Public review link opens with no login
2. Thank-you message on fresh review
3. UI looks/works like normal TrailWeigh
4. Preinstalled file present
5. Reviewer can edit/delete/rename/create files
6. Reviewer can use built-in themes and Light/Dark
7. Refresh/reopen retains local sandbox changes
8. Fresh private browser gets fresh preinstalled copy
9. Owner's original file untouched
10. Owner's Locker/private files inaccessible
