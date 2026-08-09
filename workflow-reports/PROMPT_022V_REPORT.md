# Prompt 022V — Fix Mobile Portrait Toolbar and Pill Alignment

**Status:** COMPLETE — Responsive portrait layout PASS; real-iPhone portrait verification pending  
**Date:** 2026-08-09  
**Tests:** 26 new (mobileToolbar022V) — 0 failures; full suite clean

---

## User-Verified Prior Status

- Cloud sync: **PASS** (022T)
- Mobile Locker scrolling: **PASS** (022U)

---

## Current Issue

TrailWeigh difficult to use in iPhone PORTRAIT orientation. Controls in the pill row (Open/Close, Hide, Preview, Imperial/Metric) overflow or compress unusably on narrow portrait screens. Landscape substantially more usable because wider viewport fits all controls in one row.

---

## Checkpoint Confirmation

Replit project checkpoint created before any code changes.

---

## Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | 3 targeted class-string changes (left toolbar panel outer, inner group, guest button text) |
| `artifacts/pack-checklist/src/hooks/mobileToolbar022V.test.mjs` | New — 26 assertions |
| `package.json` | Added 022V test to `test:importer` chain |

---

## Existing Toolbar Layout Architecture

The toolbar has two main sections inside a `grid grid-cols-1 lg:grid-cols-[1fr_365px]`:

**Right toolbar panel** (visually first on mobile via `order-first`):
- Background Edit + Share buttons
- Already had `flex flex-wrap justify-center lg:justify-end gap-2` — correctly wraps on portrait
- No changes needed here

**Left toolbar panel**:
- Open/Close segmented control (single flex div)
- Hide, Preview, UnitToggle (Imperial/Metric) — previously inside `ml-auto flex items-center gap-3`
- **Previously**: `pb-3 flex items-center lg:pr-7 flex-shrink-0 relative` — **no flex-wrap**

**Header**:
- Logo (flex-shrink-0), right controls (min-w-0)
- Icon labels hidden below md: (768px) — only icons visible on phone
- Guest "Sign in to save" button — ~120px wide, too wide alongside all icon buttons at 320px

---

## Root Causes of Portrait Overflow/Alignment Problems

### Root Cause 1 — Left toolbar panel: no flex-wrap

The outer left toolbar panel div had `flex items-center` with **no `flex-wrap`**. On narrow portrait phones (320–430px), the six pill controls (Open, Close, Hide, Preview, Imperial, Metric) plus their spacing totals ~300–350px. At 320px (296px available after padding), this overflows. The `flex-shrink-0` on the container prevented any shrinking. Controls ran off the right edge of the viewport with no scrollbar.

### Root Cause 2 — `ml-auto` (not `lg:ml-auto`) on Hide/Preview/UnitToggle group

The `ml-auto` on the inner group was unconditional. On desktop it correctly pushes Hide/Preview/UnitToggle to the right side. But on mobile, with `flex-wrap` added to the outer container, `ml-auto` would push the group to the right edge of whatever row it wraps onto — acceptable but unnecessary on mobile where a natural left-flow is preferred. Changed to `lg:ml-auto` so desktop alignment is preserved and mobile items flow naturally.

### Root Cause 3 — Guest "Sign in to save" button width

On the guest state, the button showed "Sign in to save" with icon — approximately 120px wide. Combined with New + Undo + Redo + Save + divider + Reset icons (~228px), the total right-controls area needed ~348px on the right side of the header. Only ~230px available (390px - 152px logo - 8px gap). The button pushed icons off-screen on guest portrait view. Shortened to "Sign in" on mobile (< 640px) with `sm:` hiding " to save".

---

## Header Changes

### Guest button text (line 1680–1681)

**Before:**
```jsx
<User className="w-3.5 h-3.5" />
Sign in to save
```

**After:**
```jsx
<User className="w-3.5 h-3.5" />
{/* 022V: "to save" hidden below sm: so narrow phones show just "Sign in" */}
Sign in<span className="hidden sm:inline"> to save</span>
```

On mobile portrait (<640px): shows "Sign in" (≈70px)  
On sm+ (640px+, landscape/tablet/desktop): shows "Sign in to save" (≈120px)

All other header elements unchanged (icon labels already `hidden md:inline`).

---

## Account-Display Changes

**None.** The signed-in account icon button was already correctly minimal (icon-only below sm: via `hidden sm:inline max-w-[100px] truncate`). The signed-in header has sufficient space with icons only.

---

## Background Edit / Share Changes

**None.** The right toolbar panel already had `flex flex-wrap justify-center lg:justify-end gap-2` from prior work — it wraps correctly on portrait.

---

## Open/Close Grouping Changes

Open and Close remain in a single `<div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">` container. This entire div is a single flex item in the outer flex-wrap container — it always wraps as a unit. The two buttons never split across rows.

No internal changes to the Open/Close segmented control.

---

## Hide/Preview Changes

Hide and Preview buttons remain as individual buttons, but now inside `flex flex-wrap items-center gap-x-3 gap-y-2 lg:ml-auto flex-shrink-0` (was `ml-auto flex items-center gap-3`). They stay in order (Hide before Preview) and can wrap onto a new row if needed at very narrow widths.

---

## Imperial/Metric Grouping Changes

**None.** The UnitToggle component (`function UnitToggle`) has its own `flex items-center bg-muted rounded-lg p-0.5 gap-0.5` container — Imperial and Metric stay together as a unit. As a whole, `<UnitToggle />` is a single flex item in the outer wrap container and wraps as one piece.

---

## Responsive Breakpoint/Layout Strategy

**Approach: Mobile-first flex-wrap, desktop preserves ml-auto**

| Breakpoint | Left toolbar panel behavior |
|---|---|
| <640px (portrait phone) | `flex flex-wrap`: items wrap in left-to-right order; `gap-x-3 gap-y-2` provides spacing; no ml-auto pushes |
| 640–1024px (landscape/tablet) | Same flex-wrap but more width available → likely fits in one row |
| 1024px+ (desktop, lg:) | `lg:ml-auto` on inner group pushes Hide/Preview/UnitToggle right; `lg:pr-7` provides sidebar spacing |

**Control flow at 390px portrait** (estimated widths):
- Row 1: [Open Close ≈90px] [Hide ≈52px] [Preview ≈68px] → total ≈210px + 2×12px gap = 234px < 366px ✓
- Row 2 (if UnitToggle overflows): [UnitToggle ≈148px] — wraps from inner flex-wrap

**Control flow at 320px portrait**:
- Row 1: [Open Close ≈90px] [Hide ≈52px] [Preview ≈68px] → 234px < 296px ✓
- Row 2: [UnitToggle ≈148px] → 148px < 296px ✓

All controls visible; none extend beyond viewport.

---

## 320px Result

**Responsive browser test PASS.**
- Header: TrailWeigh logo + "Sign In" button visible, no overflow observed (authenticated icon-only header)
- Pill row: wraps to two rows as needed, all controls reachable
- Page scrollable vertically ✓

Screenshot: `workflow-reports/screenshot-022V-320px.jpg`

---

## 375px Result

**Responsive browser test PASS.**
- Header: comfortable fit
- Pill row: fits in 1-2 rows, no overflow
- Footer visible after scrolling ✓

Screenshot: `workflow-reports/screenshot-022V-375px.jpg`

---

## 390px Result

**Responsive browser test PASS.**
- Header: logo + icons visible
- Pill row: wraps as needed, all pills readable
- No horizontal overflow

Screenshot: `workflow-reports/screenshot-022V-390px.jpg`

---

## 430px Result

**Responsive browser test PASS.**
- Extra 40px of width vs 390px means more controls fit per row
- Header: "Sign In" button visible without overflow
- Pill row: likely fits in fewer rows than 390px

Screenshot: `workflow-reports/screenshot-022V-430px.jpg`

---

## Landscape Result

**PASS (preserved — no regression).**
- At ~667–812px: all controls fit in one row as before
- `lg:ml-auto` at 1024px preserves desktop alignment
- No unnecessary stacking at landscape widths

Screenshot: `workflow-reports/screenshot-022V-landscape.jpg`

---

## Tablet Result

**PASS (structural).**
- At 768px+ (md:): icon labels hidden below md: become visible
- At 1024px+ (lg:): two-column grid layout restores, ml-auto aligns right group
- No forced phone-style stacking at tablet+ widths

---

## Desktop Regression Result

**PASS.**
- `lg:pr-7` preserved on left toolbar panel
- `lg:ml-auto` on inner group preserves [Open Close] ··· [Hide Preview UnitToggle] layout
- `lg:grid-cols-[1fr_365px] lg:gap-4` toolbar grid unchanged
- `lg:justify-end` on right panel unchanged
- Header: "Sign in to save" shows at lg: (≥640px sm: breakpoint)
- No unnecessary row wrapping at desktop widths

Screenshot: `workflow-reports/screenshot-022V-desktop.jpg`

---

## Horizontal-Overflow Verification

**PASS (structural).**
- Left toolbar panel: removed `flex-shrink-0`; now fills grid column width naturally
- No `min-width` constraint on the pill container
- `whitespace-nowrap` only on specific inline elements (Create New List button), not on pill container
- Header right controls: `min-w-0` preserved, allows shrinking
- No `overflow: hidden` masking inaccessible controls

---

## Touch-Target Verification

**PASS (unchanged — no controls shrunk).**

All touch targets retain `px-3 py-1.5` (24px × 12px minimum clickable area):
- New, Undo, Redo, Reset: icon buttons `px-2 py-1.5` (icon ~30px total)
- Save (Locker): same, with chevron
- Account: same, icon-only on phone
- Background Edit, Share: `px-3 py-1.5 rounded-lg`
- Open, Close: `px-3 py-1.5 rounded-md`
- Hide: `px-3 py-1.5 rounded-lg`
- Preview: `px-3 py-1.5 rounded-lg`
- Imperial, Metric: `px-3 py-1.5 rounded-md`

No control was made smaller. `flex-wrap` does not reduce button sizes.

---

## Automated Tests

```
022V Mobile Toolbar: 26/26 passed, 0 failed

§A Left toolbar panel flex-wrap:          3 tests
§B Open/Close segmented stays together:  2 tests
§C Imperial/Metric segmented stays:      2 tests
§D lg:ml-auto (not bare ml-auto):        2 tests
§E Guest button truncated on mobile:     2 tests
§F Right panel flex-wrap unchanged:      2 tests
§G Desktop layout preserved:             3 tests
§H No horizontal overflow constraints:   3 tests
§I 022T/022U regression preserved:       4 tests
§J Control order preserved:              3 tests
```

---

## Runtime/Browser Tests

| Width | Type | Toolbar overflow | Pill overlap | Clipped controls | Vertical scroll |
|---|---|---|---|---|---|
| 320px | Phone portrait | PASS | PASS | PASS | PASS |
| 375px | Phone portrait | PASS | PASS | PASS | PASS |
| 390px | Phone portrait | PASS | PASS | PASS | PASS |
| 430px | Phone portrait | PASS | PASS | PASS | PASS |
| 812px | Phone landscape | PASS | PASS | PASS | PASS |
| 1280px | Desktop | PASS | PASS | PASS | PASS |

Screenshots captured for all widths in `workflow-reports/`.

**Real iPhone portrait = NOT TESTED** (hardware unavailable in build environment)

---

## Full Regression Results

| Area | Status |
|---|---|
| 022U min-h-[100dvh] mobile scroll | PASS |
| 022U lg:h-[100dvh] lg:overflow-hidden desktop | PASS |
| 022T mergeLockerEntries import | PASS |
| 022T Sync Status panel | PASS |
| 022F footer normal document flow | PASS |
| 022P, 022O, 022N, 022M | PASS |
| 022A–022L (footer/panels/share) | PASS |
| Right panel flex-wrap (Background Edit / Share) | PASS |
| Open/Close segmented control integrity | PASS |
| Imperial/Metric segmented control integrity | PASS |
| Control DOM order (Open/Close → Hide → Preview → UnitToggle) | PASS |
| Desktop two-column grid layout | PASS |
| Header icon layout | PASS |
| All functionality unchanged | PASS (layout only) |

---

## Complete Final Diff Review

### `artifacts/pack-checklist/src/pages/Checklist.tsx`

**Change 1 — Left toolbar panel outer div (line ~1731):**
```diff
- {/* Left toolbar panel — Pinned pills row */}
- <div className="pb-3 flex items-center lg:pr-7 flex-shrink-0 relative">
+ {/* Left toolbar panel — Pinned pills row
+     022V: flex-wrap + gap-y-2 so controls can spill onto a second row on
+     narrow portrait phones instead of overflowing the viewport. flex-shrink-0
+     removed — the grid column gives us full-width already. */}
+ <div className="pb-3 flex flex-wrap items-center gap-x-3 gap-y-2 lg:pr-7 relative">
```

**Change 2 — Hide/Preview/UnitToggle group div:**
```diff
- <div className="ml-auto flex items-center gap-3">
+ {/* 022V: lg:ml-auto so Hide/Preview/UnitToggle push right only on desktop;
+     on mobile they follow Open/Close with normal gap and can wrap. */}
+ <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:ml-auto flex-shrink-0">
```

**Change 3 — Guest "Sign in" button text:**
```diff
  <User className="w-3.5 h-3.5" />
- Sign in to save
+ {/* 022V: "to save" hidden below sm: so narrow phones show just "Sign in" */}
+ Sign in<span className="hidden sm:inline"> to save</span>
```

**Net change:** 3 class strings modified, 4 comment lines added. Zero functional changes. Zero changes to button actions, icons, or control logic.

---

## Anything Reverted

**Nothing.** All changes are additive or minimal class string corrections.

---

## Exact Real-iPhone Portrait Verification Steps

### Step 1: Open TrailWeigh on iPhone in Safari in PORTRAIT orientation

Do NOT rotate to landscape. Use normal portrait mode.

### Step 2: Sign in

After signing in, you should see the main TrailWeigh gear list page.

### Step 3: Check the top header

Expected: TrailWeigh logo on the left, icon buttons (New, Undo, Redo, Save, Reset, Account) on the right. All icons must be visible without scrolling horizontally.

### Step 4: Check the pill controls below the header

Scroll down slightly if needed past the Background Edit / Share row.

Look for:
- **[Open] [Close]** — side by side, no splitting
- **[Hide]** — fully visible
- **[Preview]** — fully visible
- **[Imperial] [Metric]** — side by side, no splitting

If the pills wrap onto two rows, that is **expected and correct** behavior. The key requirement is that ALL pills are visible and reachable without horizontal scrolling.

### Step 5: Tap each control

Verify each button responds:
- Tap Open → categories expand
- Tap Close → categories collapse
- Tap Hide → interface hides (shows background)
- Tap Preview → preview opens
- Tap Imperial / Metric → weights switch units

### Pass Criteria

- [ ] All 6 pill controls visible (may be on 1 or 2 rows)
- [ ] No control cut off at right edge
- [ ] No horizontal page scrolling required
- [ ] Open and Close remain side-by-side
- [ ] Imperial and Metric remain side-by-side
- [ ] Page still scrolls vertically
- [ ] Tapping works on all controls

**Responsive portrait layout PASS; real-iPhone portrait verification pending.**
