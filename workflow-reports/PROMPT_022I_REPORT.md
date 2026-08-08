# Prompt 022I — Complete Shared-Link Collapse & Share Behavior

**Date:** 2026-08-08  
**Status:** COMPLETE ✅  
**Tests:** 41 passed, 0 failed (full suite: all prior suites clean after 3 stale test updates)

---

## Exact Prompt ID / Title

**Prompt 022I — Complete Shared-Link Collapse & Share Behavior**

---

## Complete Inventory of Collapsible Shared-Link Panels

| Panel | Component | State variable | Previous default | New default |
|-------|-----------|---------------|-----------------|-------------|
| Gear categories | `GearCategory.tsx` (via `allOpen`) | `allOpen` in `SharedChecklistContent` | `false` ✓ (022H) | `false` ✓ unchanged |
| Pack Summary | `WeightSummary.tsx` | `summaryOpen` | `false` ✓ (022G) | `false` ✓ unchanged |
| Weight Distribution | `WeightSummary.tsx` | `chartOpen` | `false` ✓ (022G) | `false` ✓ unchanged |
| **Shared Files** | `SharedLockerPanel` (local to SharedChecklistPage.tsx) | `open` | `true` ✗ | **`false` ✅ FIXED** |
| **Scan Gear List** | `ImportGearPanel.tsx` | `open` (via new `defaultOpen` prop) | `true` ✗ | **`false` ✅ FIXED** |
| Background picker | `BackgroundPickerPanel` | `bgPickerOpen` | `false` ✓ | `false` ✓ unchanged |
| Preview | `PreviewModal` | `showPreview` | `false` ✓ | `false` ✓ unchanged |
| Share menu | local | `showShareMenu` | `false` ✓ | `false` ✓ unchanged |
| Save dialog | local | `showSaveDialog` | `false` ✓ | `false` ✓ unchanged |
| User menu | local | `showUserMenu` | `false` ✓ | `false` ✓ unchanged |
| Add Category | local | `addingCat` | `false` ✓ | `false` ✓ unchanged |

---

## Why 022H Missed Scan Gear List and Shared Files

**Scan Gear List:** `ImportGearPanel.tsx` is a **separate component** with its own internal `open` state (`useState(true)`). Prompt 022H changed `allOpen` in `SharedChecklistPage` — the control that drives `GearCategory` via `forceOpen` — but `ImportGearPanel` manages its own state independently. `allOpen` has no effect on `ImportGearPanel`. The component was never touched.

**Shared Files:** `SharedLockerPanel` is a **local sub-component** defined inside `SharedChecklistPage.tsx` (not in `GearCategory` or `WeightSummary`). It also manages its own internal `open` state, initialized to `useState(true)`. Prompt 022H changed `allOpen` (for gear categories) but this sub-component's own `open` state was never modified.

Both panels are independent of the `allOpen / forceOpen` mechanism that controls gear categories.

---

## Root Cause of Share Containing Only "Download PDF"

The `SharedChecklistPage.tsx` Share menu was intentionally minimal at the time it was written. The original developer comment read:

> `"Share pill — PDF download only; recipients can't re-share via Copy Link here"`

This was an explicit design decision to prevent recipients from re-sharing — but it was overly restrictive. The existing **recipient-safe** sharing actions (share current URL, share a checkable packing list copy) were never implemented. Prompt 022I adds them.

---

## Exact Changes Made

| File | Change |
|------|--------|
| `src/pages/SharedChecklistPage.tsx` | `SharedLockerPanel.open` init: `useState(true)` → `useState(false)` |
| `src/pages/SharedChecklistPage.tsx` | Import `buildShareURL` (was type-import only) |
| `src/pages/SharedChecklistPage.tsx` | Add `Link` icon to lucide-react imports |
| `src/pages/SharedChecklistPage.tsx` | Add `copiedLink`, `copiedCheckable` state |
| `src/pages/SharedChecklistPage.tsx` | Add `copyUrlToClipboard` helper |
| `src/pages/SharedChecklistPage.tsx` | Add `handleShareTrailWeighList` handler |
| `src/pages/SharedChecklistPage.tsx` | Add `handleShareCheckableList` handler |
| `src/pages/SharedChecklistPage.tsx` | Replace PDF-only Share menu with 3-action menu |
| `src/pages/SharedChecklistPage.tsx` | Pass `defaultOpen={false}` to `ImportGearPanel` |
| `src/pages/SharedChecklistPage.tsx` | Conditionally hide `ImportGearPanel` when `snapshot.type === 'checkable'` |
| `src/pages/SharedChecklistPage.tsx` | Conditionally hide `BackgroundPickerButton/Panel` when `snapshot.type === 'checkable'` |
| `src/components/ImportGearPanel.tsx` | Add `defaultOpen?: boolean` prop (defaults to `true`) |
| `src/components/ImportGearPanel.tsx` | Change `useState(true)` → `useState(defaultOpen)` for `open` |
| `src/lib/shareLink.ts` | Add `'checkable'` to `SharePayload.type` union |
| `src/hooks/sharedCollapse022I.test.mjs` | NEW — 41 source-level tests |
| `package.json` | Add `sharedCollapse022I.test.mjs` to `test:importer` chain |
| `src/hooks/shareMenuConsistency021F.test.mjs` | Tests P and Q updated to reflect 022I Share menu (no longer PDF-only) |
| `src/hooks/sidebarGutter021L.test.mjs` | Test C9 updated: `useState(true)` → `defaultOpen=true` pattern |

---

## How Category State Is Initialized

**`allOpen = useState(false)`** (022H) — passed as `forceOpen={allOpen}` to `GearCategory`. The `GearCategory` `forceOpen` effect fires on mount and sets `isOpen=false`. Combined with `isOpen`'s own `useState(false)` init (022G), categories start collapsed with zero flicker. The Open/Close control buttons still work: `setAllOpen(true)` expands all, `setAllOpen(false)` collapses all.

---

## How Pack Summary State Is Initialized

`WeightSummary.summaryOpen = useState(false)` (022G). Unchanged — already collapsed.

---

## How Weight Distribution State Is Initialized

`WeightSummary.chartOpen = useState(false)` (022G). Unchanged — already collapsed.

---

## How Scan Gear List Is Initialized

**`ImportGearPanel`** now accepts a `defaultOpen?: boolean` prop (defaults to `true`). The internal `open` state is initialized via `useState(defaultOpen)`.

- `SharedChecklistPage` passes `defaultOpen={false}` → Scan Gear List starts collapsed in shared-link context.
- `Checklist.tsx` (private workspace) passes no prop → `defaultOpen` defaults to `true` → Scan Gear List starts expanded in the private workspace. **Private behavior is unchanged.**

---

## How Shared Files Is Initialized

`SharedLockerPanel.open = useState(false)` — changed from `useState(true)`. The panel header remains visible and clickable. The file count badge is visible in the header. Clicking the header expands/collapses normally during the session. On refresh, `open` reinitializes to `false`.

---

## Exact Share Menu Actions After Correction

The Share menu in `SharedChecklistPage` now contains three actions:

| # | Label | Behavior |
|---|-------|----------|
| 1 | **Share TrailWeigh List** | Uses `window.location.href` (the current `/s/:id` URL). Tries `navigator.share` (native mobile sheet) first; falls back to clipboard copy. Shows "Copied!" feedback. Does NOT create a new owner record. |
| 2 | **Share Checkable Packing List** | Builds a new `type: 'checkable'` share URL via `buildShareURL`. Copies to clipboard. Shows "Copied!" feedback. Opens simplified view (no Scan Gear List, no background picker). |
| 3 | **Download PDF** | Existing behavior — unchanged. |

---

## How Share TrailWeigh List Works

1. Reads `window.location.href` — the current `/s/:id` URL. This is the immutable shared snapshot URL.
2. Calls `navigator.share({ title, url })` if the Web Share API is available (mobile browsers, some desktops).
3. Falls back to `copyUrlToClipboard(url)` if `navigator.share` is absent.
4. Shows "Copied!" label on the button for 2 seconds.
5. Does **not** call `buildShareURL` — no new snapshot, no new owner record, no permission escalation.

---

## How Share Checkable Packing List Works

1. Builds a `SharePayload` from the current viewer's in-memory state (`store.items`, `store.order`, `store.meta`, `background`, `bgFade`, `bgTone`, `bgSize`, `system`, `snapshot.name`).
2. Sets `type: 'checkable'` — the new discriminant added to `shareLink.ts`.
3. **Does not include `lockerFiles`** — checkable list is a single-file, focused view.
4. Calls `buildShareURL(payload)` → creates a short `/s/:id` URL via the API (or falls back to hash URL).
5. Copies result to clipboard; shows "Copied!" for 2 seconds.
6. The resulting URL opens `SharedChecklistPage` in **checkable mode**:
   - All gear categories collapsed (allOpen=false)
   - Pack Summary collapsed
   - Weight Distribution collapsed
   - Scan Gear List **hidden** (snapshot.type === 'checkable')
   - Background picker **hidden** (snapshot.type === 'checkable')
   - Gear data, checked items, and background are preserved from the payload
   - Temporary viewer interactions work normally (check/uncheck, open/close panels)
   - Refresh resets panels to collapsed

---

## Exact Permissions Available in Checkable-List View

Recipients of a `type: 'checkable'` link can:
- ✅ View all gear items with their descriptions and weights
- ✅ See initial checked/unchecked state from the payload
- ✅ Temporarily check/uncheck items during their session
- ✅ Open/collapse gear categories
- ✅ Open/collapse Pack Summary and Weight Distribution
- ✅ Print
- ✅ Change background (but picker is hidden in checkable mode — background from payload displays)

Recipients of a `type: 'checkable'` link **cannot**:
- ❌ Rename or delete anything
- ❌ Edit weights, descriptions, or quantities
- ❌ Add items or categories
- ❌ Move items
- ❌ Scan Gear List / import
- ❌ Change the shared background (picker hidden)
- ❌ Access owner's Locker
- ❌ Modify the owner's saved original

---

## How Temporary Recipient Changes Are Isolated

`SharedChecklistPage` stores **all state in React memory only**. Nothing is written to `localStorage`, `sessionStorage`, or IndexedDB during normal viewer interaction. The page comment at the top confirms: _"Recipient changes update React state only — nothing is ever written to localStorage, IndexedDB, or the API."_

On refresh, the page re-fetches the immutable snapshot from the API (`/api/links/:id`), resetting all viewer changes. ✓

---

## Confirmation: Owner File Cannot Be Modified

`SharedChecklistPage` never writes to:
- `trailweigh:locker` (owner's Locker entry list)
- `pack-checklist-v5-${userId}` (owner's auto-save key)
- `trailweigh:last-active-file-${userId}` (owner's private workspace restoration key)
- The `/api/links/:id` stored snapshot (API is read-only for viewers)

Both new share handlers (`handleShareTrailWeighList`, `handleShareCheckableList`) write only to the clipboard. ✓

---

## Confirmation: Save Your Own Copy Remains Separate

`showSaveDialog` still exists as an independent feature. The Share menu and Save Your Own Copy are separate UI elements. No changes were made to the Save Your Own Copy logic. ✓

---

## Confirmation: 022F Footer Behavior Remains Intact

- Outer wrapper: `min-h-[100dvh]` (not `h-[100dvh] overflow-hidden`) ✓
- Header: `sticky top-0` ✓
- `backgroundAttachment: 'fixed'` ✓
- Footer in normal document flow — unchanged ✓

---

## Confirmation: 022G Private Restoration Remains Intact

- `SharedChecklistPage` never writes `trailweigh:last-active-file-*` ✓
- `Checklist.tsx` `allOpen` init remains `false` ✓
- `readLastActiveFileFromLS` / `writeLastActiveFileToLS` unchanged ✓
- New share handlers write only to clipboard — no localStorage writes ✓

---

## Confirmation: 022H Category Behavior Remains Intact

- `allOpen = useState(false)` — unchanged ✓
- `forceOpen={allOpen}` prop still passed to `GearCategory` ✓
- `GearCategory.isOpen = useState(false)` — unchanged ✓
- Open/Close control buttons still call `setAllOpen(true/false)` ✓

---

## Stale Tests Updated (Prior Suites)

Three prior-suite tests described behavior that 022I intentionally changed:

| File | Test | Old assertion | New assertion |
|------|------|---------------|---------------|
| `shareMenuConsistency021F.test.mjs` | P | SharedChecklistPage Share says "PDF download only" | Share menu has recipient-appropriate actions (022I) |
| `shareMenuConsistency021F.test.mjs` | Q | Comment documents "read-only intent" | No `handleShareLocker`; has `handleShareTrailWeighList` + `handleShareCheckableList` |
| `sidebarGutter021L.test.mjs` | C9 | `ImportGearPanel` hard-codes `useState(true)` | `defaultOpen` prop defaults to `true`; init via `useState(defaultOpen)` |

No test intent was reversed — the spirit (open by default in private context, PDF available, no owner handlers in shared view) is preserved. ✓

---

## Backups

- `workflow-reports/PRE_022I_SharedChecklistPage_BACKUP.tsx`
- `workflow-reports/PRE_022I_ImportGearPanel_BACKUP.tsx`
- `workflow-reports/PRE_022I_shareLink_BACKUP.ts`

---

## Automated Tests Added

**File:** `src/hooks/sharedCollapse022I.test.mjs`  
**41 tests across 11 suites:**

| Suite | Tests |
|-------|-------|
| A. SharedLockerPanel starts collapsed | 4 |
| B. ImportGearPanel defaultOpen prop | 5 |
| C. Share menu has all three required actions | 9 |
| D. Checkable packing-list mode hides tools | 3 |
| E. shareLink.ts accepts checkable type | 3 |
| F. 022H regressions — categories and WeightSummary | 4 |
| G. 022F footer regression protection | 3 |
| H. 022G private-workspace isolation preserved | 3 |
| I. Owner-file protection | 2 |
| J. Shared-link permissions unchanged | 2 |
| K. Footer design unchanged | 2 |

---

## Runtime / Manual Verification

| Test | Status | Notes |
|------|--------|-------|
| A. Every panel closed on shared-link load | **NOT TESTED** | Requires browser + live shared link |
| A. Scan Gear List collapsed | **NOT TESTED** | Requires browser |
| A. Shared Files collapsed | **NOT TESTED** | Requires browser |
| B. Panel interaction — open then refresh returns to collapsed | **NOT TESTED** | Requires browser refresh |
| C. Share menu shows 3 actions | **NOT TESTED** | Requires browser |
| D. Share TrailWeigh List — copies/shares current URL | **NOT TESTED** | Requires browser (navigator.share or clipboard verify) |
| D. Share TrailWeigh List — same snapshot, no new permissions | **NOT TESTED** | Requires runtime |
| E. Share Checkable Packing List — opens simplified view | **NOT TESTED** | Requires browser + link generation |
| E. Checkable view: items checkable, temporary only | **NOT TESTED** | Requires browser |
| E. Checkable view: Scan Gear List absent | **NOT TESTED** | Requires browser |
| E. Checkable view: background picker absent | **NOT TESTED** | Requires browser |
| F. Download PDF — existing behavior works | **NOT TESTED** | Requires browser PDF generation |
| G. Footer — in document flow on long shared page | **PARTIAL** — source confirms 022F layout intact | Runtime verify |
| H. Private workspace — 022G not displaced | **PARTIAL** — confirmed no localStorage writes | Runtime verify |

---

## Failed Attempts / Issues During Implementation

1. **Four 022I test logic failures (not code bugs):** Initial tests used `indexOf('SharedLockerPanel')` and found the function declaration, but some slice windows started from import lines or included comment text that contained searched strings. Fixed by:
   - Searching from the second occurrence of `BackgroundPickerButton` (skip import line)
   - Checking for `lockerFiles:` (property assignment) instead of `lockerFiles` (also matches comments)
   - Checking for `onRename`/`onDelete` handlers instead of the strings "Rename"/"Delete" (which appear in "intentionally absent" comments)

2. **Three stale prior-suite tests (021F×2, 021L×1):** Prior tests documented the old PDF-only Share behavior and hard-coded `useState(true)`. Updated to match 022I's new behavior while preserving the underlying intent.

---

## Anything Still Requiring User Verification

1. **Open shared link in browser** → confirm Scan Gear List, Shared Files, gear categories, Pack Summary, Weight Distribution all start collapsed.
2. **Refresh shared link after expanding panels** → confirm all panels return to collapsed.
3. **Click Share button on shared link page** → confirm 3 actions appear: "Share TrailWeigh List", "Share Checkable Packing List", "Download PDF".
4. **Use Share TrailWeigh List** → confirm current URL is shared/copied; opening it shows same shared snapshot.
5. **Use Share Checkable Packing List** → confirm a new URL is generated; opening it shows gear list without Scan Gear List and without background picker button.
6. **Check/uncheck items in checkable view** → confirm changes are temporary (lost on refresh).
7. **Download PDF** → confirm existing PDF behavior works.
8. **Footer on long shared page** → confirm footer remains below all content.
9. **Private workspace isolation** → establish private last-active file → open shared link → return to TrailWeigh → confirm private file still restores.

---

## Unrelated TrailWeigh Functionality Preserved

- Private Checklist startup (022G) — regression-verified ✓
- Private Checklist ImportGearPanel starts open (defaultOpen defaults to true) ✓
- Shared footer layout (022F) — regression-verified ✓
- Gear categories collapsed in shared view (022H) — regression-verified ✓
- Pack Summary / Weight Distribution collapsed (022G) — regression-verified ✓
- Save Your Own Copy — unchanged, separate feature ✓
- Owner Locker / Rename / Delete — inaccessible to recipients ✓
- Gear calculations, base weight, quantities — unchanged ✓
- Background display (from payload) — preserved ✓
- Print — unchanged ✓
- About / Help / How It Works — untouched ✓
- Footer design (`#1e2322`, `print:hidden`, `flex-shrink-0`) — unchanged ✓

---

## Test Results Summary

```
Full suite: all prior suites 0 failed ✅

022I A. SharedLockerPanel starts collapsed:          4 tests  ✅
022I B. ImportGearPanel defaultOpen prop:            5 tests  ✅
022I C. Share menu three required actions:           9 tests  ✅
022I D. Checkable mode hides tools:                  3 tests  ✅
022I E. shareLink.ts checkable type:                 3 tests  ✅
022I F. 022H category regression:                    4 tests  ✅
022I G. 022F footer regression:                      3 tests  ✅
022I H. 022G private-workspace isolation:            3 tests  ✅
022I I. Owner-file protection:                       2 tests  ✅
022I J. Shared-link permissions unchanged:           2 tests  ✅
022I K. Footer design unchanged:                     2 tests  ✅
────────────────────────────────────────────────────────
022I Shared Collapse & Share: 41 passed, 0 failed   ✅
```
