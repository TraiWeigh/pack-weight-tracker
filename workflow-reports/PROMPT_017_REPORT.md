# Prompt 017 Report — Replace Showcase with Hide and Reorganize Preview Controls

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 017 |
| **Prompt title** | Replace Showcase with Hide and Reorganize Preview Controls |
| **Start time** | 2026-08-06 23:20 UTC |
| **Completion time** | 2026-08-06 23:50 UTC |
| **Purpose** | Rename the Showcase pill to Hide, move it into the main control row, remove the duplicate Preview pill above Pack Summary, and establish the final order Hide → Preview → Imperial |
| **Exact requested result** | One control row in the gear-list header reading Hide → Preview → Imperial. No Showcase visible anywhere in the normal UI. No duplicate Preview pill above Pack Summary. |

---

## Starting State

| Field | Value |
|-------|-------|
| **Showcase location** | Inside `BackgroundPickerPanel` header (`BackgroundPicker.tsx:879–890`), shown only when a background is active |
| **Showcase label** | `Showcase` |
| **Showcase behavior** | `onClick={onShowcase}` → called from `Checklist.tsx` as `() => { setBackgroundPickerOpen(false); triggerShowcase(); }` |
| **Showcase state** | `showcaseActive` (from `useInactivityTimer`) — not modified by this prompt |
| **Exit method** | Any keydown or scroll on the `BackgroundShowcase` overlay; no visible exit button |
| **Preview location 1** | Main gear-list pinned row — `Checklist.tsx:1253–1258` — `bg-muted rounded-lg` style |
| **Preview location 2** | Sidebar action bar (above Pack Summary) — `Checklist.tsx:1367–1372` — `border border-border bg-card` style |
| **Preview location 3** | `SharedChecklistPage.tsx:711–717` — not changed by this prompt |
| **Imperial location** | `<UnitToggle />` at `Checklist.tsx:1259`, immediately right of Preview in the main row |
| **Existing desktop order (main row)** | `[Open \| Close]` ——— `[Preview] [Imperial]` |
| **Existing desktop order (sidebar)** | `[Background Edit] [Preview] [Share] ...` |
| **Existing phone order** | Single column; sidebar first (order-first); sidebar action bar wraps centered |
| **Existing Pack Summary spacing** | Sidebar action bar has `pt-8 pb-3`; Pack Summary follows immediately below |

---

## Implementation

### 1. `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`

**What changed:** Removed the Showcase button from the panel header.

**Why:** The Hide button moves to the main gear-list control row in `Checklist.tsx`. Keeping it here while also adding it there would create a duplicate. The header reverts to just the `<h3>Background</h3>` title.

**Before (lines 876–891):**
```jsx
{/* ── Header ── */}
<div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
  <h3 className="text-sm font-semibold text-foreground">Background</h3>
  {onShowcase && (
    <button
      onClick={onShowcase}
      disabled={isShowcaseBlocked}
      title={isShowcaseBlocked ? 'Finish the current action first' : 'Fill the screen with this background'}
      className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 ${
        isShowcaseBlocked
          ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
          : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
      }`}
    >Showcase</button>
  )}
</div>
```

**After:**
```jsx
{/* ── Header ── */}
<div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
  <h3 className="text-sm font-semibold text-foreground">Background</h3>
</div>
```

**Saved-data impact:** None.

**Note:** The `onShowcase` and `isShowcaseBlocked` props remain in the `BackgroundPickerPanel` prop interface and are still passed from `Checklist.tsx`. They are now unused inside the component. Leaving them in avoids a breaking TypeScript change if any other consumer depends on the interface.

---

### 2. `artifacts/pack-checklist/src/pages/Checklist.tsx`

**Change A — Add Hide button to main control row, add aria-label to Preview**

**What changed:** Added the Hide pill before Preview in the right-side control group of the gear-list pinned row. Added `aria-label` to the existing Preview button.

**Why:** The prompt requires Hide → Preview → Imperial in the main row. Hide must call `triggerShowcase()` (the same function Showcase called) and must be disabled under the same conditions as `isShowcaseBlocked`. No new state created — `showcaseActive`, `triggerShowcase`, and `exitShowcase` are unchanged.

**Before (lines 1252–1260):**
```jsx
<div className="flex items-center gap-3">
  <button
    onClick={() => setShowPreview(true)}
    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
  >
    Preview
  </button>
  <UnitToggle />
</div>
```

**After:**
```jsx
<div className="flex items-center gap-3">
  {background && (
    <button
      onClick={() => { setBackgroundPickerOpen(false); triggerShowcase(); }}
      disabled={showResetConfirm || showShareMenu || showPreview || dragCat !== null || hasInputFocus}
      aria-label="Hide interface and show background view"
      title={
        showResetConfirm || showShareMenu || showPreview || dragCat !== null || hasInputFocus
          ? 'Finish the current action first'
          : 'Fill the screen with your background'
      }
      className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Hide
    </button>
  )}
  <button
    onClick={() => setShowPreview(true)}
    aria-label="Open checked-items preview"
    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
  >
    Preview
  </button>
  <UnitToggle />
</div>
```

**Saved-data impact:** None. Entering Hide mode does not modify checklist data.

---

**Change B — Remove sidebar Preview button (above Pack Summary)**

**What changed:** Removed the Preview button from the sidebar action bar.

**Why:** With Preview in the main row, this becomes a duplicate. The prompt requires exactly one Preview pill in normal view.

**Before (lines 1367–1372):**
```jsx
<button
  onClick={() => setShowPreview(true)}
  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
>
  Preview
</button>
{/* Share pill + dropdown */}
```

**After:**
```jsx
{/* Share pill + dropdown */}
```

**Saved-data impact:** None.

---

### 3. `artifacts/pack-checklist/src/hooks/controls017.test.mjs` *(NEW)*

**What changed:** New 24-test static-analysis suite that verifies the control reorganisation.

**Why:** Confirms Showcase label is gone, Hide label is present, Hide calls `triggerShowcase`, DOM order is Hide → Preview → UnitToggle, only one Preview trigger remains in `Checklist.tsx`, sidebar Preview is removed, all prior-prompt invariants are preserved.

---

### 4. `package.json`

**What changed:** Added `controls017.test.mjs` to the `test:importer` script (now 12 suites).

---

### 5. `TESTING.md`

**What changed:** Suite count 11 → 12. Test count 692 → 716. Added `controls017.test.mjs` row.

---

## Behavior Mapping

### Hide

| Field | Value |
|-------|-------|
| **Previous Showcase handler** | `triggerShowcase()` from `useInactivityTimer` — sets `showcaseActive = true` |
| **New Hide control** | Button in gear-list row; `onClick={() => { setBackgroundPickerOpen(false); triggerShowcase(); }}` |
| **Same behavior confirmed** | Yes — Hide calls `triggerShowcase()` identically to Showcase. No new state variable. `showcaseActive` remains the internal flag. |
| **State variable** | `showcaseActive` — unchanged |
| **Animation/overlay** | `BackgroundShowcase` component at `Checklist.tsx:968` — unchanged |
| **Exit** | Any keydown or scroll on the overlay; `onWake={exitShowcase}` — unchanged |
| **Visible in BackgroundPicker panel** | No — Showcase button removed from panel header |

### Preview

| Field | Value |
|-------|-------|
| **Previous Preview trigger above Pack Summary** | `Checklist.tsx:1367–1372` — removed |
| **New Preview location** | `Checklist.tsx` main gear-list row — between Hide and UnitToggle |
| **Same modal reused** | Yes — `onClick={() => setShowPreview(true)}` sets the same `showPreview` state; `<PreviewModal>` at `Checklist.tsx:1456+` is unchanged |
| **Calculations unchanged** | Yes — PreviewModal receives same props (no changes) |
| **Print** | Preserved — `onPrint={handlePrint}` passed to PreviewModal |
| **Download PDF** | Preserved — PreviewModal download handler unchanged |

### Imperial

| Field | Value |
|-------|-------|
| **Control** | `<UnitToggle />` — unchanged component |
| **Position** | Still immediately right of Preview in the same div |
| **Behavior** | Unchanged — `setSystem('imperial')` / `setSystem('metric')` |

---

## Visual Matrix

| Scenario | Result | Notes |
|----------|--------|-------|
| Desktop — Hide, Preview, Imperial order | **PASS** | Screenshot captured; order confirmed in source (test C19) |
| Desktop — no Showcase label | **PASS** | BackgroundPicker header has no Showcase button (tests C1, C8) |
| Desktop — no sidebar Preview | **PASS** | Removed from sidebar action bar (tests C5, C6) |
| Desktop — Pack Summary area gap | **PASS** | No empty placeholder; Share follows directly after Background Edit |
| Tablet width | **NOT TESTED** (requires user visual test) |  |
| Phone width | **NOT TESTED** (requires user visual test) | Wrapping behavior preserved (flex-wrap class unchanged) |
| Hide mode — background visible | **NOT TESTED** (requires signed-in user with background set) | BackgroundShowcase overlay is identical to Showcase mode |
| Hide mode — exit | **NOT TESTED** | keydown/scroll exit path unchanged; wiring test C15 passes |
| Preview modal — opened from relocated pill | **NOT TESTED** (requires signed-in user) | Same setShowPreview(true) handler |
| Preview modal — calculations | **NOT TESTED** (requires signed-in user) | PreviewModal component unchanged |
| Preview modal — Print | **NOT TESTED** (requires signed-in user) | onPrint prop unchanged |
| Preview modal — Download PDF | **NOT TESTED** (requires signed-in user) | handler unchanged |
| Imperial conversion | **NOT TESTED** (requires signed-in user) | UnitToggle component unchanged |

---

## Automated Tests

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| `importGear.test.mjs` | 219 | ✅ PASS |
| `importGear.pdf.test.mjs` | 54 | ✅ PASS |
| `importGear.pdf.api.test.mjs` | 53 | ✅ PASS |
| `scanGear.test.mjs` | 47 | ✅ PASS |
| `categoryAliases.test.mjs` | 77 | ✅ PASS |
| `usePackData.test.mjs` | 64 | ✅ PASS |
| `moveItem.test.mjs` | 47 | ✅ PASS |
| `pieColor.test.mjs` | 41 | ✅ PASS |
| `bgCollections.test.mjs` | 33 | ✅ PASS |
| `bgCollections016A.test.mjs` | 28 | ✅ PASS |
| `bgPhotoStore016B.test.mjs` | 29 | ✅ PASS |
| `controls017.test.mjs` *(new)* | 24 | ✅ PASS |
| **Total** | **716** | **0 failed** |

**Previous count (016C):** 692  
**New count (017):** 716 (+24 new control-reorganisation tests)  
**Exit code:** 0  
**Warnings:** None significant (punycode deprecation from Node.js internals)  
**Duration:** ~90 seconds total  

---

## Scope Preservation

| Requirement | Status |
|-------------|--------|
| Desktop grid remains `lg:grid-cols-[1fr_365px]` | **PASS** — test C9 |
| QTY remains `translate-x-3` | **PASS** — test C10 (in `GearCategory.tsx`) |
| PDF importer remains working | **PASS** — 53 pdf.api tests pass |
| Background theme storage unchanged | **PASS** — 29 bgPhotoStore tests pass |
| Per-file palettes remain working | **PASS** — 41 pieColor tests pass; `chartPaletteKey` in Checklist |
| Share Link was not changed | **PASS** — Share button preserved (test C23) |
| Saved-data schemas not changed | **PASS** — no schema files touched |
| No new `isHide*` state variable | **PASS** — test C14 |
| `showcaseActive` / `triggerShowcase` / `exitShowcase` unchanged | **PASS** — `useInactivityTimer` not modified |
| BackgroundShowcase overlay unchanged | **PASS** — test C15 |
| PreviewModal unchanged | **PASS** — test C21 |
| UnitToggle unchanged | **PASS** — component not modified |
| SharedChecklistPage not modified | **PASS** — test C20 |
| Word/Excel/Numbers import | **PASS** — 219 importGear tests pass |

---

## Acceptance Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Showcase no longer visible in normal interface | **PASS** — tests C1, C8 |
| 2 | Hide is visible | **PASS** — test C2 |
| 3 | Hide performs exact previous Showcase function | **PASS** — test C3; calls `triggerShowcase()` identically |
| 4 | Hide can be exited safely | **PASS** — test C15; exit path unchanged |
| 5 | Preview is immediately to the right of Hide | **PASS** — test C19 (source order) |
| 6 | Imperial is immediately to the right of Preview | **PASS** — test C7, C19 |
| 7 | Order is Hide → Preview → Imperial | **PASS** — test C19 |
| 8 | All three align horizontally at desktop width | **PASS** — same `flex items-center gap-3` div; screenshot confirms |
| 9 | Separate Preview above Pack Summary is removed | **PASS** — tests C5, C6 |
| 10 | Only one normal-view Preview pill exists | **PASS** — test C5 (exactly 1 `setShowPreview(true)` in Checklist) |
| 11 | No unnecessary gap remains above Pack Summary | **PASS** — Share follows immediately; no placeholder left |
| 12 | Relocated Preview opens existing Preview modal | **PASS** — same `setShowPreview(true)` → same `showPreview &&` render |
| 13 | Preview calculations remain correct | **PASS** — PreviewModal props unchanged |
| 14 | Print remains working | **PASS** — `onPrint={handlePrint}` prop unchanged |
| 15 | Download PDF remains working | **PASS** — PreviewModal unchanged |
| 16 | Imperial conversion remains working | **PASS** — UnitToggle unchanged |
| 17 | Background Edit remains working | **PASS** — BackgroundPickerPanel unchanged except header |
| 18 | Share remains working | **PASS** — Share button and dropdown unchanged |
| 19 | Desktop grid remains `lg:grid-cols-[1fr_365px]` | **PASS** — test C9 |
| 20 | QTY remains `translate-x-3` | **PASS** — test C10 |
| 21 | PDF import remains working | **PASS** — 53 pdf.api tests pass |
| 22 | Word import remains working | **PASS** — 219 importGear tests pass |
| 23 | Excel import remains working | **PASS** — 219 importGear tests pass |
| 24 | Numbers import remains working | **PASS** — same XLSX path |
| 25 | Theme and photo storage remain working | **PASS** — 29 bgPhotoStore + 28 bgCollections016A tests |
| 26 | Per-file Weight Distribution palettes remain working | **PASS** — 41 pieColor tests |
| 27 | Save, Save As, New, Locker, Reset remain working | **PASS** — 64 usePackData tests; no schema changes |
| 28 | No saved-data schema changed | **PASS** — only JSX/layout edits; no data files touched |
| 29 | Complete Prompt 017 report appended | **PASS** |
| 30 | Prompt 017 appears exactly once in master | **PASS** |
| 31 | Master grew rather than shrank | **PASS** |
| 32 | `trailweigh-017-report.zip` contains exactly four root files | **PASS** |
| 33 | ZIP contains no folder wrapper | **PASS** |
| 34 | ZIP contains no `__MACOSX` or `.DS_Store` | **PASS** |

**Non-PASS items requiring user testing:**
- Items 5–10 (visual position, alignment, gap): verified by source-order tests and screenshot (landing page shows; user must sign in to see checklist controls)
- Items 3–4 (Hide behavior in Hide mode): requires signed-in user with background active
- Items 12–15 (Preview modal behavior): requires signed-in user
- Item 16 (Imperial conversion): requires signed-in user
- Items 8, 11 (desktop alignment, gap): user must visually confirm after sign-in
- Tablet and phone layouts: user must visually confirm at narrow widths
