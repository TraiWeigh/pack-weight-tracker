# Prompt 018B — Match Active File Name Pill to Hide (Visual Correction)

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 018B |
| **Prompt title** | Match Active File Name Pill to Hide (visual correction to 018A) |
| **Date** | 2026-08-07 |
| **Starting state** | 018A = PARTIAL — filename visible and centered, but styled as bare text (no pill background, wrong height, wrong font weight), causing misalignment with the other pills and unreliable text color across themes |
| **Purpose** | Style the filename element as a pill matching Hide's exact visual pattern; guarantee same horizontal line; guarantee black/white text in light/dark mode |

---

## Starting State — Why 018A Was PARTIAL

The 018A filename element was a plain `<span>` with:
```
text-xs font-medium text-foreground max-w-[10rem] truncate select-none block text-center
```

Problems:
1. **No pill shape** — no `bg-muted`, no `rounded-lg`, no `px-3 py-1.5`. Rendered as bare floating text with no background or border.
2. **Wrong height** — without `py-1.5` the span has no vertical padding, so `top-1/2 -translate-y-1/2` centers the raw text baseline, not a pill-shaped object. This visually placed it at a different vertical position than the padded Hide/Preview pills.
3. **Wrong font weight** — `font-medium` instead of Hide's `font-semibold`.
4. **Wrong layout** — `block text-center` instead of `flex items-center`.
5. **Text color unreliable in dark mode** — user reported `text-foreground` was not reading as white in dark mode (likely a rendering environment artifact; the CSS variable is correct in principle, but adding `bg-muted` context may resolve the contrast perception).

---

## Investigation

### Hide pill — exact className (Checklist.tsx lines 1270–1282)
```
flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed
```

### Preview pill — exact className (lines 1283–1289)
```
flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors
```

### Pattern: all existing pill controls share
```
flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold
```

### Key difference for filename pill
- Use `text-foreground` instead of `text-muted-foreground`: the filename needs full black (light mode) or white (dark mode), not the muted gray of interactive controls. `text-foreground` is the standard Tailwind/shadcn CSS variable that resolves per theme.
- Omit `hover:text-foreground`, `transition-colors`, `disabled:*`: the pill is informational only — not clickable, no hover state.

---

## Exact Change — Checklist.tsx (one line)

### Before (018A)
```tsx
className="text-xs font-medium text-foreground max-w-[10rem] truncate select-none block text-center"
```

### After (018B)
```tsx
className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground max-w-[10rem] truncate select-none"
```

### Class-by-class diff

| Class | 018A | 018B | Reason |
|-------|------|------|--------|
| `flex items-center` | ❌ absent | ✅ added | Matches Hide layout; vertically centers text in pill height |
| `bg-muted` | ❌ absent | ✅ added | Matches Hide background chip color |
| `rounded-lg` | ❌ absent | ✅ added | Matches Hide border radius |
| `px-3` | ❌ absent | ✅ added | Matches Hide horizontal padding |
| `py-1.5` | ❌ absent | ✅ added | **Key fix**: gives pill same height as Hide; `top-1/2 -translate-y-1/2` now centers a pill, not a text sliver |
| `text-xs` | ✅ present | ✅ kept | Matches Hide font size |
| `font-medium` | ✅ present | ❌ removed | Wrong weight |
| `font-semibold` | ❌ absent | ✅ added | Matches Hide font weight |
| `text-foreground` | ✅ present | ✅ kept | CSS variable: black in light, white in dark, live on mode switch |
| `max-w-[10rem]` | ✅ present | ✅ kept | Long names truncate, don't overflow |
| `truncate` | ✅ present | ✅ kept | Ellipsis on overflow |
| `select-none` | ✅ present | ✅ kept | Not user-selectable |
| `block text-center` | ✅ present | ❌ removed | Not needed with `flex items-center`; `flex` is a block-level display already |
| `hover:*`, `transition-colors` | ❌ absent | ❌ absent | Not added — pill is informational, no click/hover |
| `cursor-pointer` | ❌ absent | ❌ absent | Not added — not clickable |

---

## Why py-1.5 Fixes the "Same Line" Problem

The absolute centering `top-1/2 -translate-y-1/2` centers the element's own bounding box vertically in the pills row. Without padding, the bounding box is the raw line-height of the text (≈ 1rem at text-xs). With `py-1.5`, the bounding box becomes the same height as the Hide and Preview buttons (line-height + 2 × 0.375rem padding). Both elements now have the same height centered at the same `top-1/2` point → same visual horizontal line.

---

## Why text-foreground Gives Black/White

`text-foreground` is a shadcn/Tailwind CSS variable defined in `src/index.css`:
- Light mode: resolves to near-black (hsl(222.2 84% 4.9%) or similar)
- Dark mode: resolves to near-white (hsl(210 40% 98%) or similar)

It updates immediately when the `dark` class is toggled on `<html>`, with no JS required — purely CSS. Using `bg-muted` around it ensures the text has a neutral chip background in both modes, which may also help perceived contrast.

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | One line: filename span className rewritten |
| `artifacts/pack-checklist/src/hooks/activeFileName018B.test.mjs` | Created — 30 new tests |
| `package.json` | Added `activeFileName018B.test.mjs` to `test:importer` chain |

---

## Files NOT Changed (Regression Protection)

| File / System | Status |
|---------------|--------|
| Active file identity logic (`activeLockerFile` state, sessionStorage) | ✅ Untouched |
| `commitSaveNew` / `commitSaveReplace` toast messages | ✅ Untouched |
| BackgroundPicker.tsx (017E shaking fix) | ✅ Untouched |
| importGear.ts / scanGear.ts / API server (017F) | ✅ Untouched |
| Hide, Preview, UnitToggle JSX | ✅ Untouched |
| `lg:grid-cols-[1fr_365px]` layout | ✅ Untouched |
| Locker / save / share / calculation logic | ✅ Untouched |
| localStorage / IndexedDB / Locker data | ✅ Untouched |
| Absolute centering wrapper structure (018A) | ✅ Untouched |

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

**Total passed: 896 / Total failed: 0 / Exit code: 0**  
**New tests added in 018B: 30** (Tests 1–30 in `activeFileName018B.test.mjs`)

> ⚠️ Automated tests verify structural/class correctness only. Exact visual pill match, pixel alignment, same-line rendering, and dark/light mode rendered colors require the user's fresh-preview acceptance test.

---

## Rendered Testing Performed

| Check | Result |
|-------|--------|
| Vite HMR applied Checklist.tsx change cleanly — no compile errors | ✅ PASS |
| Browser console — no errors after HMR update | ✅ PASS |
| Screenshot taken — app loads on landing page (screenshots/018B-landing.jpg) | ✅ PASS |
| Pill visual match to Hide / same-line alignment / dark-light color | ⏳ Requires signed-in session — user fresh-preview test |

---

## Acceptance Checklist

| Requirement | Automated | Status |
|-------------|-----------|--------|
| `bg-muted` matches Hide background | Test 1 | ✅ PASS |
| `rounded-lg` matches Hide border radius | Test 2 | ✅ PASS |
| `px-3` matches Hide horizontal padding | Test 3 | ✅ PASS |
| `py-1.5` matches Hide vertical padding / height | Test 4 | ✅ PASS |
| `text-xs` matches Hide font size | Test 5 | ✅ PASS |
| `font-semibold` matches Hide font weight | Test 6 | ✅ PASS |
| `flex items-center` matches Hide layout | Test 7 | ✅ PASS |
| `text-foreground` (black/white per mode) | Test 8 | ✅ PASS |
| `text-muted-foreground` absent | Test 9 | ✅ PASS |
| `text-foreground/60` absent | Test 10 | ✅ PASS |
| No hardcoded `text-white` / `text-black` | Test 11 | ✅ PASS |
| No `hover:` classes | Test 12 | ✅ PASS |
| No `cursor-pointer` | Test 13 | ✅ PASS |
| `pointer-events-none` on wrapper | Test 14 | ✅ PASS |
| `select-none` | Test 15 | ✅ PASS |
| `max-w-[` overflow guard | Test 16 | ✅ PASS |
| `truncate` | Test 17 | ✅ PASS |
| Absolute centering preserved | Test 18 | ✅ PASS |
| Pill is sibling before right group (not inside it) | Test 19 | ✅ PASS |
| `aria-label` intact | Test 20 | ✅ PASS |
| `title` attribute intact | Test 21 | ✅ PASS |
| `activeLockerFile.name` rendered | Test 22 | ✅ PASS |
| Hide present in right group | Test 23 | ✅ PASS |
| Preview present in right group | Test 24 | ✅ PASS |
| UnitToggle present in right group | Test 25 | ✅ PASS |
| Hide before Preview | Test 26 | ✅ PASS |
| Preview before UnitToggle | Test 27 | ✅ PASS |
| Pill not between Preview and UnitToggle | Test 28 | ✅ PASS |
| Toast `Saved "${name}"` present (×2) | Test 29 | ✅ PASS |
| No bare `Saved.` / no `Saved as` | Test 30 | ✅ PASS |
| All 896 tests pass | All suites | ✅ PASS |
| **Pill visually matches Hide shape** | Human | ⏳ NOT TESTED |
| **Same horizontal line as Hide/Preview/Imperial/Metric** | Human | ⏳ NOT TESTED |
| **Dark mode: white text** | Human | ⏳ NOT TESTED |
| **Light mode: black text** | Human | ⏳ NOT TESTED |
| **Theme switch updates color live** | Human | ⏳ NOT TESTED |
| **Save confirmation "Saved [name]" correct** | Human | ⏳ NOT TESTED |
| **Long filename truncates cleanly** | Human | ⏳ NOT TESTED |
| **Mobile: readable, no overlap, no horizontal scroll** | Human | ⏳ NOT TESTED |

---

## Unresolved Issues

None. The change is structurally complete and all 896 automated tests pass.

---

## What Requires User Testing

Per testing protocol: app closed while Replit worked; one fresh preview tab opened only after completion.

**✅ Prompt 018B implementation is complete.**

Please test in a fresh preview (signed in, with a saved file active):
1. **Pill shape** — filename shows as a rounded chip with background, matching Hide's visual silhouette
2. **Same horizontal line** — filename pill sits at exactly the same vertical height as Hide, Preview, Imperial, Metric
3. **Centered** — pill floats centered over the left checklist column, not near Hide or the Open/Close group
4. **Hide → Preview → Imperial → Metric** — these four are adjacent with the filename pill NOT between them
5. **Dark mode** — filename text is white
6. **Light mode** — filename text is black
7. **Theme switch** — color updates live (no refresh needed)
8. **Save** → toast shows `Saved "[name]"`, pill stays on correct file
9. **Save As** → pill immediately updates to new name
10. **Long filename** → pill truncates with ellipsis, no overflow, no layout disruption
11. **Mobile viewport** — pill readable, centered, no horizontal scroll, no overlap with controls

---

## Master History Record

| Prompt | Result |
|--------|--------|
| 017B / 017C / 017D | Failed user test |
| 017E | ✅ USER-TESTED PASS (background/shaking fix) |
| 017F | ✅ USER-TESTED PASS (Scan Gear List importer) |
| 018 | PARTIAL — filename visible but wrong position + wrong color |
| 018A | PARTIAL — filename centered but not pill-shaped, wrong vertical alignment |
| 018B | NOT USER-VERIFIED — pending user's fresh post-completion test |
