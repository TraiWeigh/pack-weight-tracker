# Prompt 019 — Background Edit Pill + Separate Collapsible Summary Panels

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 019 |
| **Prompt title** | Background Edit Pill + Separate Collapsible Summary Panels |
| **Date** | 2026-08-07 |
| **Starting state** | 018C = USER-TESTED PASS |
| **Three goals** | (1) Background Edit pill inactive/open appearance; (2) Separate Weight Distribution from Pack Summary into independent cards; (3) Pack Summary collapsible |

---

## Files Inspected

| File | What was checked |
|------|-----------------|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | `BackgroundPickerButton` props, className, current `active`-driven styling |
| `artifacts/pack-checklist/src/components/WeightSummary.tsx` | Full component — Pack Summary body, Weight Distribution collapse/chevron, palette state |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `BackgroundPickerButton` invocation, `WeightSummary` invocation, sidebar structure |

---

## Goal 1 — Background Edit Pill Active/Inactive Appearance

### Problem found

`BackgroundPickerButton` used `active={!!background}` (whether a background photo is selected) to control styling. This made the pill show `bg-primary` (bright primary color) whenever any background was set — even when the panel was closed. The panel's open/closed state (`backgroundPickerOpen`) had no effect on the pill appearance.

### Changes — BackgroundPicker.tsx

Added `panelOpen: boolean` prop. New className logic:

| State | Old | New |
|-------|-----|-----|
| Panel **open** | `bg-primary text-primary-foreground border-primary` (if background set) | `bg-white text-gray-900 border border-white/80` |
| Panel **closed** | `text-muted-foreground hover:text-foreground border-border ... bg-card` | `bg-muted text-muted-foreground hover:text-foreground border border-transparent` |

- **Open = white:** `bg-white text-gray-900` — explicit white regardless of theme, with dark gray text for contrast. Visually pops as "active/open" in both light and dark modes.
- **Closed = normal:** `bg-muted text-muted-foreground` — matches Hide and Preview pills exactly. Closing the panel immediately returns the pill to the standard inactive appearance.
- `active` prop is retained in the signature (still passed from Checklist.tsx) for forward compatibility but no longer drives the pill color.

### Changes — Checklist.tsx

Added `panelOpen={backgroundPickerOpen}` to the `<BackgroundPickerButton />` call. No other change to the BackgroundPicker invocation.

---

## Goal 2 — Separate Weight Distribution from Pack Summary

### Problem found

Both Pack Summary and Weight Distribution were JSX sections inside a single `WeightSummary` component, wrapped in one `<div className="bg-card border border-card-border rounded-xl shadow-sm">`. They shared a card — Weight Distribution was visually a sub-section of the Pack Summary card.

### Solution

Split `WeightSummary.tsx` into two independently exported components from the same file:

#### `WeightSummary` (Pack Summary card)
- Props: `data`, `categoryOrder`, `categoryMeta` — no longer takes `paletteKey` or `onPaletteChange`
- Its own `<div className="bg-card border border-card-border rounded-xl shadow-sm">` card
- Calculates `baseWeightOz`, `nonBaseTotals`, `grandTotalOz` independently via `calcWeights()` helper

#### `WeightDistribution` (chart card)  
- Props: `data`, `categoryOrder`, `categoryMeta`, `paletteKey`, `onPaletteChange`
- Its own independent `<div className="bg-card border border-card-border rounded-xl shadow-sm">` card
- Full chart, palette selector, legend — all preserved exactly
- **Weight Distribution heading:** changed `text-muted-foreground` → `text-foreground` — resolves to white in dark mode, black in light mode — matching the Pack Summary heading's color

### Shared weight calculation

A private `calcWeights(data, categoryOrder, categoryMeta)` helper in `WeightSummary.tsx` computes `baseWeightOz`, `nonBaseTotals`, `grandTotalOz` from the same inputs. Both components call it — results are identical because they take identical props. No new state, no new API.

### Sidebar — Checklist.tsx

Updated import:
```tsx
import { WeightSummary, WeightDistribution } from '../components/WeightSummary';
```

Updated sidebar render: `<WeightSummary>` and `<WeightDistribution>` are now separate siblings inside the `flex flex-col gap-4` sidebar wrapper, with the standard `gap-4` gap between them:
```tsx
<WeightSummary
  data={data}
  categoryOrder={categoryOrder}
  categoryMeta={categoryMeta}
/>
<WeightDistribution
  data={data}
  categoryOrder={categoryOrder}
  categoryMeta={categoryMeta}
  paletteKey={chartPaletteKey}
  onPaletteChange={handlePaletteChange}
/>
```

`lg:grid-cols-[1fr_365px]` and sidebar width: untouched.

---

## Goal 3 — Pack Summary Collapsible

### Pattern reused from Weight Distribution

Weight Distribution already uses:
```tsx
const [chartOpen, setChartOpen] = useState(true);
<button onClick={() => setChartOpen(o => !o)} className="flex-1 flex items-center gap-2 px-4 sm:px-5 py-3 text-left hover:bg-muted/30 transition-colors">
  {chartOpen ? <ChevronDown /> : <ChevronRight />}
  <span>Weight Distribution</span>
</button>
{chartOpen && <div>...</div>}
```

Pack Summary now uses the same pattern exactly:
```tsx
const [summaryOpen, setSummaryOpen] = useState(true);
<button
  onClick={() => setSummaryOpen(o => !o)}
  className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-xl"
  aria-expanded={summaryOpen}
>
  {summaryOpen ? <ChevronDown /> : <ChevronRight />}
  <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Pack Summary</span>
</button>
{summaryOpen && (
  <div className="p-4 sm:p-5 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
    {/* Base Weight, non-base categories, Grand Total */}
  </div>
)}
```

- `summaryOpen` is local state in `WeightSummary`, completely independent of `chartOpen` in `WeightDistribution`
- Default: expanded (`useState(true)`) — same as Weight Distribution
- Collapsing hides only the body (weights content); the chevron header stays visible
- No calculations or state lost on collapse — everything recalculates from props when re-expanded
- No new localStorage/sessionStorage persistence — matches Weight Distribution (which also has no persistence)

### Independence

`summaryOpen` lives in `WeightSummary`; `chartOpen` lives in `WeightDistribution`. They are separate component instances with no shared state. Collapsing one has zero effect on the other.

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | `BackgroundPickerButton`: added `panelOpen` prop, new open/closed className logic |
| `artifacts/pack-checklist/src/components/WeightSummary.tsx` | Full rewrite: split into `WeightSummary` (collapsible Pack Summary) + `WeightDistribution` (independent chart card, text-foreground heading) |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | 3 targeted edits: import, BackgroundPickerButton call, sidebar renders |
| `artifacts/pack-checklist/src/hooks/sidebar019.test.mjs` | Created — 36 new tests |
| `package.json` | Added `sidebar019.test.mjs` to `test:importer` chain |

---

## Files NOT Changed

| File / System | Status |
|---------------|--------|
| BackgroundPickerPanel (panel contents, Fill/Fit, Darken, Themes, custom photos, IndexedDB) | ✅ Untouched |
| 018C filename pill (inset-0, bg-muted, text-foreground, px-3 py-1.5) | ✅ Untouched |
| Active file identity, `commitSaveNew`/`commitSaveReplace` toasts | ✅ Untouched |
| BackgroundPicker.tsx (017E shaking fix — willChange, paddingTop, Math.max) | ✅ Untouched |
| importGear.ts / scanGear.ts / API server (017F) | ✅ Untouched |
| Hide, Preview, UnitToggle, Open/Close JSX | ✅ Untouched |
| Share button and dropdown | ✅ Untouched |
| `lg:grid-cols-[1fr_365px]` sidebar layout | ✅ Untouched |
| Weight Distribution chart, palette selector, legend, calculations, palette persistence | ✅ Untouched |
| PALETTES constant and color definitions | ✅ Untouched |
| `chartPaletteKey` state and `handlePaletteChange` in Checklist.tsx | ✅ Untouched |
| localStorage / IndexedDB / Locker / cross-tab sync | ✅ Untouched |

---

## Before / After

### Background Edit pill

| Scenario | Before | After |
|----------|--------|-------|
| Panel closed, no background | `bg-card` border-heavy inactive | `bg-muted` — matches Hide/Preview |
| Panel closed, background selected | `bg-primary` (bright) | `bg-muted` — same as inactive |
| Panel **open** | `bg-primary` (if background set) | `bg-white text-gray-900` — explicit white |
| Closing panel | Reverts to `bg-card` or `bg-primary` | Immediately returns to `bg-muted` |

### Sidebar panels

| Scenario | Before | After |
|----------|--------|-------|
| Pack Summary | Non-collapsible; Weight Distribution is a sub-section of same card | Separate card; collapsible with chevron header |
| Weight Distribution | Inside Pack Summary card; `text-muted-foreground` heading (gray) | Independent card; `text-foreground` heading (white in dark mode) |
| Collapse Pack Summary | Not possible | Chevron click hides body, retains header |
| Collapse Weight Distribution | Collapses as before | Unchanged; still collapses independently |
| Pack Summary affects WD state | N/A | No: independent state variables |
| WD affects Pack Summary state | N/A | No: independent state variables |

---

## Automated Test Results

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
| `bgCollections.test.mjs` | — | ✅ PASS |
| `bgCollections016A.test.mjs` | — | ✅ PASS |
| `bgPhotoStore016B.test.mjs` | — | ✅ PASS |
| `controls017.test.mjs` | 24 | ✅ PASS |
| `landscapeHover017B.test.mjs` | 24 | ✅ PASS |
| `landscapeActiveBackground017C.test.mjs` | 22 | ✅ PASS |
| `landscapeShake017D.test.mjs` | 26 | ✅ PASS |
| `landscapeShake017E.test.mjs` | 38 | ✅ PASS |
| `activeFileName018.test.mjs` | 20 | ✅ PASS |
| `activeFileName018A.test.mjs` | 20 | ✅ PASS |
| `activeFileName018B.test.mjs` | 30 | ✅ PASS |
| `activeFileName018C.test.mjs` | 29 | ✅ PASS |
| `sidebar019.test.mjs` | 36 | ✅ PASS |

**Total passed: 961 / Total failed: 0 / Exit code: 0**  
**New tests in 019: 36** (Tests 1–36 in `sidebar019.test.mjs`)

> ⚠️ Automated tests verify structural/class correctness only. Visual appearance of the white open pill, the visual panel separation in the sidebar, Pack Summary collapse animation, dark/light mode heading colors, and runtime independence of collapse states require the user's fresh-preview acceptance test.

---

## Rendered Testing Performed

| Check | Result |
|-------|--------|
| Vite HMR applied all changes cleanly — no compile errors | ✅ PASS |
| Browser console — no errors after HMR update | ✅ PASS |
| Screenshot taken — app loads on landing page (screenshots/019-landing.jpg) | ✅ PASS |
| Background Edit pill open/closed visual, Pack Summary collapse, WD separate card | ⏳ Requires signed-in session — user fresh-preview test |

---

## Acceptance Checklist

| Requirement | Test | Status |
|-------------|------|--------|
| BackgroundPickerButton has `panelOpen` prop | 019.1 | ✅ PASS |
| Open state uses `bg-white` | 019.2 | ✅ PASS |
| Open state uses contrasting text (text-gray-900) | 019.3 | ✅ PASS |
| Closed state uses `bg-muted` (matches Hide/Preview) | 019.4 | ✅ PASS |
| Styling driven by `panelOpen` | 019.5 | ✅ PASS |
| `bg-primary` no longer used for open state | 019.6 | ✅ PASS |
| Checklist.tsx passes `panelOpen={backgroundPickerOpen}` | 019.7 | ✅ PASS |
| WeightSummary has `summaryOpen` state | 019.8 | ✅ PASS |
| WeightSummary uses `setSummaryOpen` toggle | 019.9 | ✅ PASS |
| WeightSummary has ChevronDown | 019.10 | ✅ PASS |
| WeightSummary has ChevronRight | 019.11 | ✅ PASS |
| Pack Summary body conditionally rendered | 019.12 | ✅ PASS |
| Pack Summary has collapse button | 019.13 | ✅ PASS |
| WeightSummary no longer accepts `paletteKey` | 019.14 | ✅ PASS |
| Base Weight preserved | 019.15 | ✅ PASS |
| Grand Total preserved | 019.16 | ✅ PASS |
| WeightDistribution is separate exported function | 019.17 | ✅ PASS |
| WeightDistribution has its own card | 019.18 | ✅ PASS |
| WD heading uses `text-foreground` | 019.19 | ✅ PASS |
| WD heading does NOT use `text-muted-foreground` | 019.20 | ✅ PASS |
| WD still has `chartOpen` state | 019.21 | ✅ PASS |
| WD still has palette selector | 019.22 | ✅ PASS |
| WD still has PieChart/ResponsiveContainer | 019.23 | ✅ PASS |
| WD still has `onPaletteChange` | 019.24 | ✅ PASS |
| Checklist imports WeightDistribution | 019.25 | ✅ PASS |
| WeightSummary call has no paletteKey | 019.26 | ✅ PASS |
| WeightDistribution call has paletteKey + onPaletteChange | 019.27 | ✅ PASS |
| Both are sidebar siblings, WS before WD | 019.28 | ✅ PASS |
| 018C filename pill centering preserved | 019.29 | ✅ PASS |
| Filename pill text-foreground preserved | 019.30 | ✅ PASS |
| Hide button present | 019.31 | ✅ PASS |
| Preview button present | 019.32 | ✅ PASS |
| UnitToggle present | 019.33 | ✅ PASS |
| Save toast `Saved "${name}"` | 019.34 | ✅ PASS |
| PALETTES preserved | 019.35 | ✅ PASS |
| `summaryOpen` and `chartOpen` are separate state variables | 019.36 | ✅ PASS |
| All 961 tests pass | All suites | ✅ PASS |
| **Background Edit closed = matches Hide/Preview visually** | Human | ⏳ NOT TESTED |
| **Background Edit open = white pill with readable label** | Human | ⏳ NOT TESTED |
| **Closing panel immediately restores normal appearance** | Human | ⏳ NOT TESTED |
| **Pack Summary is its own visible card (separate from WD)** | Human | ⏳ NOT TESTED |
| **Weight Distribution is its own visible card** | Human | ⏳ NOT TESTED |
| **WD heading is white in dark mode** | Human | ⏳ NOT TESTED |
| **Pack Summary collapses/expands correctly** | Human | ⏳ NOT TESTED |
| **WD collapses/expands independently** | Human | ⏳ NOT TESTED |
| **Collapsing PS does not affect WD, and vice versa** | Human | ⏳ NOT TESTED |
| **Weight Distribution values/chart/palette unchanged** | Human | ⏳ NOT TESTED |
| **Pack Summary totals correct after expand** | Human | ⏳ NOT TESTED |
| **Light mode: pill closed = theme-correct; open = white** | Human | ⏳ NOT TESTED |
| **017E background/shaking fix intact** | Human | ⏳ NOT TESTED |
| **017F Scan Gear List intact** | Human | ⏳ NOT TESTED |

---

## Unresolved Issues

None. All three goals are structurally implemented and verified.

---

## What Requires User Testing

Per testing protocol: app closed while Replit worked; one fresh preview tab opened only after completion.

**✅ Prompt 019 implementation is complete.**

Please test in a fresh preview (signed in, with gear items added):

**Background Edit pill:**
1. **Closed** → pill looks like Hide/Preview (muted background, no bright color)
2. **Click to open panel** → pill turns white with dark text/icon
3. **Close panel** → pill immediately returns to normal muted appearance
4. **Light mode** → same behavior, readable in light theme

**Pack Summary:**
5. **Separate card** → Pack Summary and Weight Distribution are two visually distinct cards, not one combined panel
6. **Pack Summary collapsible** → clicking the chevron header collapses/expands the weights content
7. **Values preserved** → Base Weight, Grand Total (and any non-base categories) correct after expand

**Weight Distribution:**
8. **Own card** → Weight Distribution is its own independent panel below Pack Summary
9. **White heading** → "WEIGHT DISTRIBUTION" heading is white in dark mode
10. **Independent collapse** → collapsing Pack Summary doesn't affect WD, and vice versa
11. **Chart/palette unchanged** → pie chart, palette selector, legend all work as before

**Functional regression:**
12. Filename pill still aligned and showing correct active file
13. `Saved "[name]"` toast still fires on Save and Save As
14. Background controls (Fill/Fit, Darken, Themes, custom photos) still work inside the open panel

---

## Master History Record

| Prompt | Result |
|--------|--------|
| 017B / 017C / 017D | Failed user test |
| 017E | ✅ USER-TESTED PASS (background/shaking fix) |
| 017F | ✅ USER-TESTED PASS (Scan Gear List importer) |
| 018 | PARTIAL |
| 018A | PARTIAL |
| 018B | PARTIAL |
| 018C | ✅ USER-TESTED PASS (filename pill vertical alignment) |
| 019 | NOT USER-VERIFIED — pending user's fresh post-completion test |
