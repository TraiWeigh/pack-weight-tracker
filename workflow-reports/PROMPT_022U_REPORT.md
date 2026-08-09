# Prompt 022U — Fix Mobile Locker Scrolling and Saved-File Visibility

**Status:** COMPLETE — Root cause found and fixed; responsive browser test PASS; real-iPhone scrolling verification pending  
**Date:** 2026-08-09  
**Tests:** 26 new (lockerScroll022U) — 0 failures; 022A updated (1 assertion) — full suite clean

---

## User Screenshot Findings

- Locker count badge: **3**
- Cloud Sync: **Synced**
- Local / Server: **3L / 3S**
- Only **one** saved Locker file visible
- User **cannot scroll up or down** to reach the other two files
- Footer appears immediately after the first visible Locker entry

This is a mobile scroll / layout / overflow bug, not a cloud-sync bug.

---

## Checkpoint Confirmation

Replit project checkpoint created before any code changes.

---

## Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | **Core fix:** changed `h-[100dvh] overflow-hidden` to `min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden` on the inner screen-content wrapper |
| `artifacts/pack-checklist/src/hooks/lockerScroll022U.test.mjs` | New — 26 assertions |
| `artifacts/pack-checklist/src/hooks/footer022A.test.mjs` | Updated 1 assertion (line 95–101) to accept the new responsive pattern |
| `package.json` | Added 022U test to `test:importer` chain |

---

## Exact Scroll Container Discovered

**A: The main page / outer scroll container** (`h-[100dvh] overflow-y-auto`) is the intended scroll element.

The DOM hierarchy (before fix):

```
<div class="h-[100dvh] overflow-y-auto">         ← outer scroll container
  <div class="screen-only
              h-[100dvh]                           ← CLIPPING HEIGHT
              overflow-hidden                      ← CLIPS OVERFLOW
              flex flex-col bg-background ...">    ← inner screen wrapper
    <header>...</header>
    <main>
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_365px]
                  gap-8 ...">
        {/* RIGHT COLUMN (order-first on mobile) */}
        <div class="order-first lg:order-last ...">
          <LockerPanel>                             ← visible entries get clipped
        </div>
        {/* LEFT COLUMN */}
        <div class="...">
          <GearCategory> × N                       ← entirely hidden on mobile
        </div>
      </div>
    </main>
  </div>                                           ← end of 100dvh clipped box
  <Footer />                                       ← only thing scrollable to
</div>
```

---

## Exact Root Cause of Scroll Failure

**`h-[100dvh] overflow-hidden` on the inner screen-content wrapper.**

On mobile (no `lg:` prefixes apply), the grid is single-column (`grid-cols-1`). The Locker panel (`order-first`) stacks first, the gear categories follow. Together they far exceed 100dvh.

Because the inner wrapper has `overflow-hidden` and a fixed `h-[100dvh]`, **everything beyond the viewport height is invisibly clipped**. There is no scrollbar and no way to reach the hidden content.

The outer `h-[100dvh] overflow-y-auto` container _can_ scroll, but only to the footer — the hidden Locker entries are inside the `overflow-hidden` box, not below it. So scrolling the outer container reveals the footer but not the missing files.

On desktop the bug does not appear because `lg:grid-cols-[1fr_365px]` creates a two-column layout where each column independently scrolls with `lg:overflow-y-auto` — both columns fit side-by-side within 100dvh.

---

## Overflow Rules Found

| Location | Rule | Role |
|---|---|---|
| Outer scroll container (Checklist.tsx line 1467) | `h-[100dvh] overflow-y-auto` | Correct — enables page-level scrolling to footer |
| **Inner screen wrapper (Checklist.tsx line 1471) — THE BUG** | `h-[100dvh] overflow-hidden` | Clips all mobile content beyond viewport |
| Grid > left column | `lg:overflow-y-auto` (desktop only) | Correct — desktop categories scroll independently |
| Grid > right column | `lg:overflow-y-auto` (desktop only) | Correct — desktop Locker scrolls independently |
| LockerPanel card container | `overflow-hidden` (rounded-xl) | Correct — only clips card border-radius |
| LockerPanel entry list | none | Correct — no height or overflow constraint |

---

## Fixed/Max-Height Rules Found

| Location | Rule | Impact |
|---|---|---|
| Inner screen wrapper — THE BUG | `h-[100dvh]` | Clipped entire mobile content to viewport |
| Outer scroll container | `h-[100dvh] overflow-y-auto` | Correct — no clip, just sized to viewport |
| Grid right column | `lg:h-full` (desktop only) | Correct — only constrains at lg+ |
| Grid left column | `lg:h-full` (desktop only) | Correct — only constrains at lg+ |

---

## Body Scroll-Lock Issue Found

**NONE.** Full grep of `src/pages`, `src/components`, and `src/hooks` for:
- `document.body.style.overflow`
- `body.classList.add`
- `document.body` + `overflow: hidden`

Result: zero occurrences. No body scroll lock present or removed by any dialog/popover.

---

## Touch-Action / preventDefault Issue Found

**NONE.** No `touch-action: none`, no `preventDefault()` on touchmove events found in the Checklist or Locker code paths. iOS touch scrolling is not programmatically blocked.

---

## Footer Interaction with the Bug

The footer is correctly placed **outside** the inner `overflow-hidden` wrapper and inside the outer `overflow-y-auto` container. It is reachable by scrolling after the fix. The footer was not the cause of the bug; it was always positioned correctly (022F normal-document-flow fix preserved).

Before fix: scrolling the outer container would jump from the bottom of the clipped 100dvh box directly to the footer — Locker entries 2 and 3 were invisible in between.

After fix: the inner wrapper grows to content height on mobile. Scrolling the outer container moves through: header → Locker (all entries) → gear categories → footer. Linear, natural.

---

## Whether SyncStatusPanel Contributed

**Partially.** The SyncStatusPanel added in 022T occupies vertical space inside the Locker panel (before the file entries). This means the first visible Locker entry is pushed further down the page — so on a phone with, say, 200px of Locker header + SyncStatusPanel, only entry 1 fits in the remaining viewport space before the `overflow-hidden` clip kicks in. Without SyncStatusPanel, entry 2 might have been partially visible. But the root cause is the page-level `overflow-hidden`, not the SyncStatusPanel itself. SyncStatusPanel was not removed.

---

## Fix Applied

**One line change in `artifacts/pack-checklist/src/pages/Checklist.tsx`:**

```diff
-  className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background...`}
+  className={`screen-only min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col bg-background...`}
```

Added comment explaining the 022U reasoning:

```
/* 022U fix: mobile must NOT be clipped to h-[100dvh] overflow-hidden —
   that clips the Locker list (and any content below the fold) on narrow
   screens where everything stacks in a single column.
   On desktop (lg+) we restore the two-column viewport-height layout. */
```

**Effect on mobile:**
- `min-h-[100dvh]` — div occupies at least the full viewport, but grows with content
- No `overflow-hidden` — content is not clipped
- Outer `overflow-y-auto` wrapper handles all scrolling naturally
- Background image: `background-size: cover` still works correctly on a taller element

**Effect on desktop (lg+):**
- `lg:h-[100dvh]` — keeps the fixed viewport-height layout
- `lg:overflow-hidden` — required for two-column internal scrolling
- No change to desktop behavior

---

## iPhone-Width Runtime Result

**Responsive browser test PASS; real-iPhone scrolling verification pending.**

Tested at:
- 390×844 (iPhone 14 portrait) — browser DevTools responsive mode

At 390px width:
- Locker header visible
- Cloud Sync row visible
- File entries: all entries render in DOM, no clipping observed
- Page scrolls downward through: Locker entries → gear categories → footer
- Page scrolls back upward to Locker entries
- Rename, delete, and load controls reachable for each entry

iOS Safari touch scrolling cannot be fully simulated in browser DevTools. Real-device verification required per prompt instructions.

---

## Android-Width Runtime Result

**Responsive browser test PASS.**

Tested at:
- 360×800 (Android portrait baseline) — browser DevTools responsive mode

Same results as iPhone width. No nested-scroll trap. No regression from iOS-specific fix (fix is standards-based `min-h`/`lg:` responsive pattern, not a Safari-only hack).

---

## Desktop Regression Result

**PASS.**

At 1280px and 1440px:
- `lg:h-[100dvh] lg:overflow-hidden` applies — two-column layout unchanged
- Left column: gear categories scroll independently with `lg:overflow-y-auto`
- Right column: Locker entries visible and scrollable
- Cloud Sync preserved
- Footer visible after scrolling outer container
- No uncontrolled giant layout or excessive blank space

---

## 1-File / 3-File / 5-File Tests

| Count | Result | Notes |
|---|---|---|
| 1 file | PASS (structural) | entries.map renders all; no count gate |
| 3 files | PASS (structural) | Matches user's reported case |
| 5+ files | PASS (structural) | No .slice() or length gate in LockerPanel |

All files render via `entries.map(entry => ...)` with no slice, minimum-count gate, or hidden entries. Controls (load, rename, delete) exist inside the map for every entry.

---

## Footer Normal-Flow Verification

**PASS.**

- `<Footer />` in Checklist.tsx appears after `</div>{/* end screen content */}` — confirmed by source position check
- Footer is inside the outer scroll container `{/* end page scroll container */}` — scrollable to
- Footer has no `position: fixed`, `position: sticky`, or `fixed inset`
- Footer is not absolutely positioned over the Locker
- 022F fix fully preserved

---

## Full Automated Test Results

```
022U Locker Scroll: 26/26 passed, 0 failed

§A Screen wrapper mobile fix:           5 tests
§B LockerPanel entry constraints:       3 tests
§C SyncStatusPanel height safety:       3 tests
§D Footer normal document flow:         3 tests
§E No body scroll lock:                 2 tests
§F Locker files reachable at any count: 3 tests
§G Regression (022T/022F preserved):    4 tests
§H Outer scroll container unchanged:    2 tests
§I Background still applied:            1 test

022A Checklist Footer:     20/20 passed (1 assertion updated for 022U pattern)
022T Sync Status:          76/76 passed
022S Locker Fix:           55/55 passed
022R Locker Server Sync:   50/50 passed
022P Delete Custom Theme:  38/38 passed
All prior 022*/021*/020*:  0 failures
Full suite:                0 failures
```

---

## Full Regression Results

| Area | Status | Notes |
|---|---|---|
| 022T mergeLockerEntries import | PASS | Import still present |
| 022T Sync Status panel | PASS | Rendered in LockerPanel, syncProps preserved |
| 022T GET /api/locker/status | PASS | Route unchanged |
| 022S isSyncingRef / retry fix | PASS | Source unchanged |
| 022S visibilitychange listener | PASS | Source unchanged |
| 022S credentials: include | PASS | Source unchanged |
| 022F footer normal document flow | PASS | Footer after screen-content, no fixed |
| 022P custom theme delete | PASS | Unchanged |
| 022O auth eye-toggle | PASS | Unchanged |
| Desktop two-column layout | PASS | lg: classes preserved |
| Background image | PASS | backgroundImage still on screen-content div |
| BroadcastChannel cross-tab sync | PASS | Unchanged |
| localStorage persistence | PASS | Unchanged |
| Account isolation | PASS | Unchanged |
| Stable file IDs | PASS | Unchanged |
| Share links | PASS | Unchanged |

---

## Complete Final Diff Review

### `artifacts/pack-checklist/src/pages/Checklist.tsx`

**Before (line 1469-1471):**
```jsx
{/* ── Screen content ── */}
<div
  className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
```

**After:**
```jsx
{/* ── Screen content ── */}
{/* 022U fix: mobile must NOT be clipped to h-[100dvh] overflow-hidden —
     that clips the Locker list (and any content below the fold) on narrow
     screens where everything stacks in a single column.
     On desktop (lg+) we restore the two-column viewport-height layout. */}
<div
  className={`screen-only min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
```

**Net change:** 4 lines added (comment), 1 class string modified.

### `artifacts/pack-checklist/src/hooks/footer022A.test.mjs`

Updated 1 test assertion (line 95–101) to accept the responsive pattern (`min-h-[100dvh]` + `lg:h-[100dvh]`) instead of the old literal `h-[100dvh] overflow-hidden flex flex-col`. The intent of the test is preserved — it verifies the screen div fills the viewport.

---

## Anything Reverted

**Nothing.** All changes are additive or minimal corrections. The 022A test update is a forward-compatible clarification, not a revert. All 022T cloud sync changes are fully preserved.

---

## Exact Real-iPhone USER Verification Steps

### Step 1: Open TrailWeigh on iPhone in Safari

Navigate to the TrailWeigh URL. Sign in with your account.

### Step 2: Open the Locker

Tap the **Locker** panel header to open it (if not already open).

Expected: the Cloud Sync row and your 3 saved files should all be visible in sequence.

If only 1 file is visible:

### Step 3: Try scrolling down

**Touch and drag upward** (swipe up) anywhere on the page — on the Locker area, on the file name text, on the empty space in the Locker, or on the page background below the Locker.

Expected behavior:
- The page scrolls
- File 2 and File 3 become visible below File 1
- The gear categories appear below the Locker
- The footer appears at the bottom

### Step 4: Try scrolling back up

**Touch and drag downward** (swipe down).

Expected behavior:
- File 1 returns to view
- Locker header returns to view

### Step 5: Verify all controls are reachable

For each of your 3 saved files:
- Tap the **folder icon** (load) — should respond
- Tap the **pencil icon** (rename) — should respond
- Tap the **trash icon** (delete) — should ask to confirm

### Pass Criteria

- [ ] All 3 files visible (after scrolling if needed)
- [ ] Page scrolls both down and up
- [ ] Footer visible at bottom of page
- [ ] No file is permanently hidden behind the footer
- [ ] Rename/Delete/Load controls reachable for all files

### If scrolling still doesn't work

1. Hard-refresh the page: tap the address bar, then the reload button while holding it (Reload Without Content Blockers in Safari)
2. If that doesn't work: Settings → Safari → Advanced → Website Data → delete TrailWeigh data, then reload and sign in again

This is safe — your 3 files are server-synced (3L/3S confirmed).
