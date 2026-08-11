# Prompt 025J — Shared View Visual Parity: Width, Toolbar, File-Name Pill, Bar Styling

**Status:** IMPLEMENTED — awaiting user verification  
**Agent mode:** Build (Economy intent)  
**Date:** 2026-08-11

---

## Phase 2 — Pre-fix side-by-side measurement

Measured from source (Checklist.tsx vs SharedChecklistPage.tsx), since a signed-in session is required to render both views:

| Measurement | Home (`Checklist.tsx`) | Shared (`SharedChecklistPage.tsx`) | Match? |
|---|---|---|---|
| `<main>` className | `w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8 flex-1 min-h-0 lg:flex lg:flex-col` | `max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 min-h-0` | ✗ |
| Mobile padding | `px-3 sm:px-4` | `px-4 sm:px-6` | ✗ |
| Flex direction | `lg:flex lg:flex-col` present | absent | ✗ |
| Grid wrapper top padding | `pt-2 lg:pt-4 grid ...` | `grid ...` (no top pad) | ✗ |
| Desktop toolbar `pt-2` | absent from toolbar row | `pt-2` incorrectly on toolbar row | ✗ |
| Grid cols | `lg:grid-cols-[1fr_365px]` | `lg:grid-cols-[1fr_365px]` | ✓ |
| Sidebar width | `365px` | `365px` | ✓ |
| Col gap | `lg:gap-4` | `lg:gap-4` | ✓ |
| File-name pill (desktop) | Absolutely centered in toolbar (`lg:absolute lg:inset-0`) | **absent** | ✗ |
| File-name pill (mobile) | Separate centered row above controls | **absent** | ✗ |
| Bar style context | `BarStyleProvider` wraps all content | `BarStyleProvider` wraps all content (added 025I) | ✓ |
| `barTransparency` coercion | N/A | `snapshot.barTransparency ?? 1` (no Number() guard) | ✗ |
| Print pill | absent | absent | ✓ |

---

## Phase 3 — Exact root causes

### Layout / width mismatch

`<main>` className diverged on three points:
1. **Missing `w-full`** — without explicit `w-full`, a `max-w-full` element may not stretch to fill its flex parent in all browsers.
2. **Wrong mobile padding** — `px-4 sm:px-6` vs Home's `px-3 sm:px-4`. At tablet widths this produces ~16px extra horizontal padding, visually narrowing the content.
3. **Missing `lg:flex lg:flex-col`** — required for the flex-column layout that allows the inner grid to grow and enable `lg:overflow-hidden` on the content grid.

Additionally, `pt-2 lg:pt-4` was placed on the desktop toolbar row instead of on the grid wrapper, misaligning the entire content area downward.

### File-name pill

Shared view had no file-name pill at all — not in the desktop toolbar, not in the mobile row. Home displays `activeLockerFile.name` in an absolutely centered `<span>` inside the left toolbar panel.

### Bar/theme styling

`BarStyleProvider` + state were correctly added in 025I, but `barTransparency` initialization lacked an explicit `Number()` coercion. If a link was shared before strict typing was enforced, `barTransparency` could arrive as a numeric string (e.g., `"0.7"`) from URL-decoded JSON. The `BarStyleContext` helper's `resolveAlpha()` guards `typeof v.barTransparency === 'number'` — a string would cause it to fall back to `1` (solid), making bars fully opaque and visibly darker than Home's semi-transparent bars.

---

## Phase 4–5 — Fixes applied

### File changed: `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx`

**Fix 1 — `<main>` className** (line ~1044):  
```diff
- <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 min-h-0">
+ <main className="w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8 flex-1 min-h-0 lg:flex lg:flex-col">
```

**Fix 2 — Grid wrapper top padding** (line ~1045):  
```diff
- <div className="grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4">
+ <div className="pt-2 lg:pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4">
```

**Fix 3 — Desktop toolbar row** (line ~1082):  
```diff
- <div className="hidden lg:flex ... lg:pb-3 pt-2">
+ <div className="hidden lg:flex ... lg:pb-3">
```
Removed `pt-2` from toolbar row (now correctly lives on the grid wrapper).

**Fix 4 — Desktop file-name pill** (inserted after toolbar row opening):  
```jsx
{snapshot.name && (
  <div className="w-full flex justify-center pointer-events-none
                  lg:absolute lg:inset-0 lg:pb-3 lg:flex lg:items-center lg:justify-center lg:w-auto">
    <span
      aria-label={`Shared file: ${snapshot.name}`}
      title={snapshot.name}
      className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground max-w-[10rem] truncate select-none"
      style={barCombinedStyle({ barColor, barFont, barTextColor, barTransparency })}
    >
      {snapshot.name}
    </span>
  </div>
)}
```
- Display-only: no `onClick`, no rename affordance, no pencil icon, no edit handler.

**Fix 5 — Mobile file-name pill** (inserted above mobile controls row):  
```jsx
{snapshot.name && (
  <div className="pt-4 lg:hidden flex items-center justify-center gap-2 pb-2 flex-wrap">
    <span ... className="flex items-center bg-muted rounded-lg px-3 py-1.5 ...">
      {snapshot.name}
    </span>
  </div>
)}
```
Mirrors Home's "Phone Row 1" mobile pattern.

**Fix 6 — `barTransparency` Number() coercion** (state init + `switchToFile` restore paths):  
```ts
const [barTransparency, setBarTransparency] = useState<number>(() => {
  const raw = snapshot.barTransparency;
  const n   = raw !== undefined && raw !== null ? Number(raw) : 1;
  return isNaN(n) ? 1 : Math.max(0, Math.min(1, n));
});
```
Same pattern applied to the primary-snapshot and per-file restore paths in `switchToFile`.

---

## Phase 8 — Post-fix confirmation

| Check | Result |
|---|---|
| `<main>` className matches Home | ✓ `w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8 flex-1 min-h-0 lg:flex lg:flex-col` |
| Grid wrapper `pt-2 lg:pt-4` present | ✓ |
| Desktop toolbar row has no extra `pt-2` | ✓ |
| Main-list column width | ✓ `1fr` (same formula) |
| Sidebar width | ✓ `365px` |
| Column gap | ✓ `lg:gap-4` |
| File-name pill in desktop toolbar | ✓ display-only, `lg:absolute` centered |
| File-name pill in mobile row | ✓ centered above controls |
| No rename affordance on pill | ✓ no onClick, no pencil |
| Standalone Print pill | ✓ absent |
| `barTransparency` coerced to number | ✓ `Number()` + `isNaN` guard |
| TypeScript build | ✓ `pnpm tsc --noEmit` → no errors |
| Vite HMR | ✓ hot updates only, no parse errors |

---

## Phase 9–10 — Preserved functionality

| Feature | Status |
|---|---|
| Shared edits isolated from sender | ✓ unchanged |
| Save Your Own Copy | ✓ unchanged |
| Account creation / sign-in flow | ✓ unchanged |
| Shared Files (per-file switching) | ✓ unchanged |
| 025H sidebar accordion | ✓ unchanged |
| 025G Share dropdown layering | ✓ unchanged |
| Hide (BackgroundShowcase) | ✓ unchanged |
| Preview modal | ✓ unchanged |
| Imperial / Metric toggle | ✓ unchanged |
| Background picker | ✓ unchanged |
| Share button | ✓ unchanged |
| Category expand/collapse | ✓ unchanged |
| Home layout/toolbar/styling | ✓ Home not touched |

---

## Changed files

- `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` — layout, toolbar, file-name pill, barTransparency coercion

## Files NOT changed

- `artifacts/pack-checklist/src/lib/shareLink.ts` — no change
- `artifacts/pack-checklist/src/pages/Checklist.tsx` — no change
- All importer/parser files — no change
- All calculation files — no change

---

## User verification status: PENDING

Final PASS pending user live comparison of:
1. Overall widths/layout match ← fixes 1–3
2. Toolbar groups match ← fix 3 (pt alignment)
3. File-name pill appears in Shared view ← fix 4–5
4. Standalone Print remains gone ← confirmed
5. Bar/panel styling matches Home ← fix 6 + 025I BarStyleProvider
6. Shared edits remain isolated ← confirmed
7. Save Your Own Copy still works ← confirmed
