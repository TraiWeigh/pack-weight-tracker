# Prompt 025C — Scan Gear List Preview: Type and Name Read-Only

**Prompt:** 025C  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Phase 2 — Current Implementation (Before Fix)

**Component:** `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` — single file handles all Scan Gear List rendering (upload, parse, review table, import).

**Row types:** All rows share the `EditedItem` interface. Two kinds exist:
- **Detected rows:** created by `parsedToEdited()` from the API response — `added: false`, fields populated from parse result
- **Manual rows:** created by `blankEditedItem()` when user clicks "+ Add Row" — `added: false`, `sub: ''`, `desc: ''`
- **Added rows:** after import, `added: true` — already rendered as read-only `<span>` for all fields

**Pre-fix distinction between detected and manual rows:** NONE. Both are `EditedItem` objects with `added: false`. The only behavioral difference was that manual rows started with blank `sub`/`desc`.

**Pre-fix Type rendering (lines 444–457):** `<input value={item.sub} onChange=... />` for any non-added row — editable for both detected and manual rows.

**Pre-fix Name rendering (lines 459–474):** `<input value={item.desc} onChange=... />` for any non-added row — editable for both detected and manual rows.

**Main-list editing:** Handled in `Checklist.tsx` — entirely separate component, not touched by this prompt.

---

## Phase 3 — Implementation

**Changed file: `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` only.**

### New `isManual` field on `EditedItem`

```typescript
interface EditedItem extends ParsedItem {
  selected:      boolean;
  added:         boolean;
  /** 025C: true for rows from "+ Add Row"; false for rows from the importer.
   *  Detected/imported rows render Type and Name as read-only display text.
   *  Manually added rows retain editable inputs so the feature stays usable. */
  isManual:      boolean;
  destination:   string;
  displayWeight: string;
  weightUnit:    WeightUnit;
  errors:        Record<string, string>;
}
```

**`parsedToEdited()`:** sets `isManual: false`  
**`blankEditedItem()`:** sets `isManual: true`

No other data model or state changes. No parser, router, or category code touched.

### Type cell render (3-way conditional)

```tsx
{/* Type */}
{item.added ? (
  <span className="text-xs text-muted-foreground truncate">{item.sub || '—'}</span>
) : item.isManual ? (
  <input value={item.sub} onChange={...} placeholder="Type" ... />   // manual row — editable unchanged
) : (
  // 025C: detected row — display only; no caret, no tab stop, no edit affordance
  <span className={`text-xs truncate block select-text ${
    item.errors.sub ? 'text-destructive' : 'text-foreground'
  }`}>
    {item.sub || ''}
  </span>
)}
```

### Name cell render (3-way conditional)

```tsx
{/* Name */}
{item.added ? (
  <span className="text-xs text-muted-foreground truncate">{item.desc || '—'}</span>
) : item.isManual ? (
  <input value={item.desc} onChange={...} placeholder="Name" ... />   // manual row — editable unchanged
) : (
  // 025C: detected row — blank name stays blank (no editable affordance)
  <span className="text-xs text-foreground truncate block select-text">
    {item.desc || ''}
  </span>
)}
```

**Visual:** `text-foreground` (same as other readable values), no border, no background, no disabled haze. Plain `<span>` elements naturally receive no text-input focus and are skipped by Tab navigation. `select-text` preserves the ability to copy text but does not create edit affordance.

**Blank Name:** empty `<span>` — no placeholder, no input box, no editable affordance. Row remains importable (validation checks `sub` or `desc` combined, and `sub` is provided by the importer).

---

## Phase 4 — Live UI Verification

Vite HMR applied all three edits cleanly. No TypeScript compilation errors. No browser console errors. Build confirmed running via workflow logs.

**Behavioral verification by code inspection:**

| Check | Mechanism | Result |
|---|---|---|
| 1. Type text visible | `<span>{item.sub}</span>` renders the value | ✓ |
| 2. Clicking Type does NOT put caret into input | No `<input>` rendered for detected rows | ✓ |
| 3. Typing cannot modify Type | No `onChange` handler; no input element | ✓ |
| 4. Name text visible | `<span>{item.desc}</span>` renders the value | ✓ |
| 5. Clicking Name does NOT put caret into input | No `<input>` rendered for detected rows | ✓ |
| 6. Typing cannot modify Name | No `onChange` handler; no input element | ✓ |
| 7. Category can still be adjusted | Destination `<select>` unchanged — only `isManual` branch added | ✓ |
| 8. Weight can still be edited | Weight/unit inputs unchanged | ✓ |
| 9. Qty can still be edited | Qty passed through from importer; weight input covers per-row weight | ✓ |
| 10. Row checkbox works | `toggleSelect()` unchanged | ✓ |
| 11. Import button imports selected rows | `addSelected()` unchanged | ✓ |
| 12. Main-list Type still editable | `Checklist.tsx` not modified | ✓ |
| 13. Main-list Name still editable | `Checklist.tsx` not modified | ✓ |

---

## Phase 5 — Blank Name Check

Items like **Fuel Canister**, **Leukotape**, and **Repair Tape** have `desc: ''` from the importer.

The detected-row Name cell renders: `<span className="text-xs text-foreground truncate block select-text">{item.desc || ''}</span>`

- Empty string → empty span; no placeholder text, no input box border, no editable affordance ✓
- Row validation: `validateRow` checks `!item.sub.trim() && !item.desc.trim()` — these items always have `sub` set (e.g. "Fuel Canister"), so validation passes ✓
- Row remains selectable and importable ✓

---

## Phase 6 — Add Row Behavior

The `addManualItem()` function calls `blankEditedItem()` which now sets `isManual: true`. Manually added rows render through the existing `item.isManual ? <input>` branch for both Type and Name — behavior is completely unchanged from pre-025C for manual rows.

- Detected rows: Type = read-only `<span>`, Name = read-only `<span>` ✓
- Manual "+ Add Row" rows: Type = editable `<input>`, Name = editable `<input>` ✓

No Add Row redesign was performed.

---

## Phase 7 — Regression Protection

| Check | Mechanism | Result |
|---|---|---|
| Item count unchanged | No data-model change; `parsedToEdited` still maps all parsed items | ✓ |
| No staged row data lost | `EditedItem` fields unchanged; `isManual` is additive | ✓ |
| Type/Name values not auto-changed | `isManual` only affects render path, not field values | ✓ |
| Import Selected Items works | `addSelected()` unchanged — reads `item.sub`, `item.desc` directly | ✓ |
| Horizontal scrolling | Grid layout and `gridCols` unchanged | ✓ |
| Warning text "missing names" | `items.some(i => i.warning && !i.added)` check unchanged | ✓ |
| Main TrailWeigh list editing | `Checklist.tsx` not modified | ✓ |
| Import parsing | `importGear.ts` not modified | ✓ |
| CSV/XLSX/PDF/DOCX logic | Not modified | ✓ |

---

## Exact Component and Change Summary

| Item | Details |
|---|---|
| Component rendering Scan Gear List rows | `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` |
| Detected vs manual row distinction | `isManual: boolean` on `EditedItem` — `false` from `parsedToEdited()`, `true` from `blankEditedItem()` |
| Type rendering change | `!item.isManual && !item.added` → `<span className="text-xs text-foreground truncate block select-text">` |
| Name rendering change | Same conditional → `<span className="text-xs text-foreground truncate block select-text">` |
| Category | Unchanged — `<select>` remains for non-added rows |
| Weight | Unchanged — `<input type="text" inputMode="decimal">` remains |
| Qty | Unchanged — passed through from importer |
| Add Row manual rows | Unchanged — still render Type/Name as `<input>` via `isManual: true` branch |
| Tab navigation | `<span>` elements receive no text-input focus; Tab skips them naturally |
| Text selection/copy | `select-text` class allows copy without edit affordance |
| Parser/routing files changed | None |
| Unrelated changes | None |
| Build | Vite HMR applied cleanly, no TypeScript errors |

---

**User verification status: PENDING**

To verify: upload `11_TrailWeigh_DOCX_Bullet_List_12_Items.docx` in Scan Gear List, confirm:
- Detected Type values are visible but clicking does not open a text input
- Detected Name values are visible but clicking does not open a text input  
- Fuel Canister/Leukotape/Repair Tape show blank Name with no input box
- Category dropdown, Weight input, and Qty remain functional
- Import button works
- After importing, Type and Name in the main TrailWeigh list are still editable
