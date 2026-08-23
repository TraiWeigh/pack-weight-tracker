---
name: Batch J native parity repairs
description: Corrections from the full Batch J audit pass — confirmed mismatches fixed, JSX pitfalls, and remaining gaps
---

## Key corrections applied

| Item | Old value | New value | Source |
|---|---|---|---|
| TILE_W constant | 58 (code) | **72** | v3 VF §1 (memory was right; code was wrong) |
| CAT_HEADER_H | 62 (code) | **64** | v3 VF §1 |
| navBox.paddingTop | 9 | **7** | v3 VF §11 "padding: 7px 0 8px" |
| Filter label | "View:" | "Filter:" | v3 §4.1 |
| AddItemBar icon (closed) | add-circle-outline/16 | add-outline/14 | v3 §7.1 |
| AddItemBar icon (open) | chevron-up | chevron-down/14 | v3 §7.1 |
| AddItemBar label | contextual catName string | always "Add Item" | v3 §7.1 |
| Hero chevron size | 16 | **36** | v3 VF §5 |
| Toast bottom | NAV_H + insets.bottom + 8 | insets.bottom + **76** | v3 §24 |
| Toast borderRadius | 10 | **12** | v3 §24 |
| Toast toastText.fontSize | 13.5 | **14** | v3 §24 |
| ItemDetailPanel DIVIDER | rgba(0,0,0,0.08) | rgba(0,0,0,0.06) | v3 VF §9 |
| ItemDetailPanel row padding | paddingHorizontal:16 | paddingLeft:14, paddingRight:34 | v3 VF §9 |
| ItemDetailPanel total row height | minHeight:44 (via styles.row) | height:42 fixed | v3 VF §19 |
| ItemDetailPanel photo height | 160 | **300** | v3 VF §9 |
| ItemDetailPanel photo radius | 10 | **0** | v3 VF §9 |
| ItemDetailPanel photo resizeMode | cover | **contain** | v3 VF §9 |
| ItemDetailPanel photo bg | none | **#111111** | v3 VF §9 |
| ItemDetailPanel row icons | none | pencil/barbell/cube/swap-horizontal/location/camera/checkmark-circle (size=14, MUTED) | v3 §6.4 |
| ChecklistOverlay title | "Trail Checklist" | "Checklist" | v3 §15.1 |
| ChecklistOverlay banner | wrong wording | "Showing your selected items. Tick boxes track trail progress separately." | v3 §15 |
| MoreDeck Card 1 | "Save As…" row present; "Checklist Mode" sub wrong | Save As removed; "Checklist"; correct sub | v3 §12.5 |
| MoreDeck Card 2 unit labels | "lbs / oz" / "kg / g" | **"Imperial"** / **"Metric"** | v3 §12.5 |
| MoreDeck Card 3 | 4 rows (incl. TrailWeigh.com, "Report an Issue") | 6 rows: Help, About, How It Works, Sources & References, Report a Problem, Contact | v3 §12.5 |
| MoreDeck Card 4 | 3 rows ("Terms of Service") | 5 rows (Terms of Use, Affiliate Disclosure, Accessibility added) | v3 §12.5 |

## JSX pitfalls discovered

**JSX comment inside `&&(...)` is invalid:**
```tsx
// WRONG — TS error: ")" expected, Unexpected token ">"
{!!toastMsg && (
  {/* comment */}
  <View ...>...</View>
)}

// CORRECT — comment goes before the conditional
{/* comment */}
{!!toastMsg && (
  <View ...>...</View>
)}
```

**JSX comment inside a prop is invalid:**
```tsx
// WRONG
<Image resizeMode="contain" {/* comment */} />

// CORRECT — comment on its own line inside JSX element or before element
{/* comment */}
<Image resizeMode="contain" />
```

## Remaining confirmed mismatches (not yet fixed)

- **ND-04**: Navigation drawer Home action only calls `onClose()` — should also call `setScreenStack([])` to truly reset to list root
- **ND-37**: Navigation drawer "Help & Tutorials" opens More deck — should navigate to help content (no Help screen exists in native yet)
- **B-43**: Summary tab is a flat list; v3 has 3-section card deck (Base / Non-base / Grand Total)
- **B-44**: Share screen is unimplemented
- **AB-04**: Hamburger tap target ~42px vs v3 minimum 44px (add `minWidth`/`minHeight: 44` or `hitSlop`)
- **B-52–B-85**: 34 items still unconfirmed — require device testing or dedicated visual pass

## TypeScript status

Mobile project (`artifacts/pack-checklist-mobile`) is clean after Batch J. The `typecheck` workflow fails on `mockup-sandbox` — pre-existing React ref type mismatch in `calendar.tsx` / `spinner.tsx`, unrelated to this work.
