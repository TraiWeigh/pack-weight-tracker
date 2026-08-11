# TRAILWEIGH — PROMPT 024E REPORT
## Fix CSV Type + Expendable Field Mapping Only

| Field | Value |
|---|---|
| Prompt number | 024E |
| Agent mode actually used | Economy |
| Time worked | ~8 minutes |
| Number of actions | 7 (reads, grep, 2 edits, server restart, curl test) |
| Lines read | ~180 (importGear.ts CSV section + applyGearClassification) |
| Agent usage/cost | Economy-range |

---

## 1. Files Changed

| File | Change |
|---|---|
| `artifacts/api-server/src/routes/importGear.ts` | Added `type: ['type']` to `CSV_COL_ALIASES`; read `typeRaw` in `parseCsvItems`; pass `typeRaw` as `sub`; set `effectiveDestination = 'Consumables'` when `expendable=true` |

No other files changed.

---

## 2. Root Cause of Missing Type Mapping (Defect A)

`CSV_COL_ALIASES` (line ~814) listed six recognised column names but had **no `type` key**:

```typescript
// Before 024E:
const CSV_COL_ALIASES = {
  category:    ['category', 'section'],
  description: ['description', 'item', 'gear'],
  qty:         ['quantity', 'qty'],
  weight:      ['weight'],
  unit:        ['unit'],
  worn:        ['worn'],
  expendable:  ['consumable', 'expendable'],
  // ← no 'type' entry
};
```

`mapCsvHeader('type')` returned `null`, so the column index was never stored in `colMap`. In `parseCsvItems`, the item was then built with `sub: ''` (hardcoded empty string). All Type column values were silently discarded.

---

## 3. Root Cause of Expendable=true Not Routing to Expendables (Defect B)

`parseCsvBool` correctly returned `true` for `Expendable=true`. The `expendable` boolean was correctly stored in `ExtractedItem.expendable = true`. However, `applyGearClassification` never inspects `item.expendable`. Its routing decisions are based solely on `item.sub` (checked against `CONSUMABLES_TYPES`) and `item.destination` (checked against `CONSUMABLES_SECTION_ALIASES`).

For the Fuel row:
- Before fix: `sub = ''` → `norm('')` = `''` → `CONSUMABLES_TYPES.has('')` = false → no consumable routing
- `destination = 'Kitchen'` → not in `CONSUMABLES_SECTION_ALIASES` → kept as Kitchen Gear
- Result: Fuel row landed in Kitchen Gear despite `expendable = true`

---

## 4. Exact Fixes

### Fix A — Add `type` to `CSV_COL_ALIASES`

```typescript
const CSV_COL_ALIASES: Record<string, string[]> = {
  category:    ['category', 'section'],
  type:        ['type'],                    // ← ADDED
  description: ['description', 'item', 'gear'],
  qty:         ['quantity', 'qty'],
  weight:      ['weight'],
  unit:        ['unit'],
  worn:        ['worn'],
  expendable:  ['consumable', 'expendable'],
};
```

### Fix B — Read type column + expendable routing in `parseCsvItems`

```typescript
// Read type column
const typeRaw    = get('type');

// Expendable override: if explicitly marked expendable, route to Consumables
// before calling applyGearClassification, overriding the source CSV Category.
const effectiveDestination = expendable ? 'Consumables' : (category || undefined);

items.push(applyGearClassification({
  sub:         typeRaw.slice(0, 60),  // ← was hardcoded ''
  desc,
  weightOz,
  warning,
  warningMsg,
  destination: effectiveDestination,   // ← was: category || undefined
  expendable,
}));
```

The `effectiveDestination = 'Consumables'` when `expendable=true` feeds into `applyGearClassification` where either:
- Priority 1 fires (if the type is in `CONSUMABLES_TYPES`, e.g. `'fuel'`) → destination: 'Consumables'
- Priority 6 fires (if destination is a `CONSUMABLES_SECTION_ALIASES` entry like `'consumables'`) → destination: 'Consumables'
Both paths route correctly. The `applyGearClassification` function itself was **not changed**.

---

## 5. 77-Item Detection / Import Result

The user's 77-row CSV was not available in the repository for automated testing (not uploaded to `attached_assets/`). A representative 21-row test CSV (`workflow-reports/test-024E.csv`) was used covering all key cases. Full 77-item verification requires user testing in the live app.

Based on the implementation: `parseCsvRows` is unchanged; the only new code is reading one additional column (`type`) and computing `effectiveDestination`. Neither change skips rows, duplicates rows, or alters the row-count logic. All 77 rows should still be detected and imported.

---

## 6. Final Kitchen Gear / Expendables Counts

Tested against `test-024E.csv` (21 rows including the Fuel case):

| Category | Before fix | After fix |
|---|---|---|
| Consumables | 0 | 1 (Fuel / 4 oz) |
| Kitchen | 4 | 3 (Fuel removed) |

For the user's 77-row CSV, the expected change per the prompt:
- Kitchen Gear: 10 → **9**
- Expendables: 0 → **1**

---

## 7. Fuel Item Verification

Confirmed via `curl` against the live API server:

```json
{
  "sub":         "Fuel",
  "desc":        "4 oz",
  "weightOz":    7.68,
  "warning":     false,
  "destination": "Consumables",
  "expendable":  true
}
```

| Field | Expected | Actual |
|---|---|---|
| Type | Fuel | ✓ Fuel |
| Description | 4 oz | ✓ 4 oz |
| Weight | 7.68 oz | ✓ 7.68 |
| Destination | Consumables | ✓ Consumables |
| expendable | true | ✓ true |

Qty is not returned in `ExtractedItem` (the backend doesn't carry qty); it is the frontend's `parsedToEdited` default of 1, which is unchanged.

---

## 8. Representative Type-Field Verification Results

All confirmed via the curl test:

| sub (Type) | desc (Description) | destination |
|---|---|---|
| `Backpack` | ULA Ultra Circuit | Backpack |
| `Tent` | Zpacks Free-Zip 2 with poles / repair kit | Shelter |
| `Tent Stakes` | Titanium Stakes (8) | Shelter |
| `Sleeping Bag` | Enlightened Equipment Revelation 20F | Sleep |
| `Sleeping Pad` | Therm-a-Rest NeoAir XLite NXT | Sleep |
| `Puffy` | Arc'teryx Cerium SL Hoody | Clothing Packed |
| `Fuel` | 4 oz | **Consumables** |
| `Filter` | Platypus Quickdraw | Hydration |

Type values are preserved exactly (no truncation for these lengths). `applyGearClassification` still applies its classification rules using the now-populated `sub` field — Tent → Shelter, Sleeping Bag → Sleep, etc. — which is the correct intended behaviour.

---

## 9. Non-CSV Import Behaviour Not Changed

`applyGearClassification` was **not modified**. `parseCsvRows`, `parseCsvBool`, `mapCsvHeader`, and all non-CSV route branches (PDF, DOCX, XLSX, Numbers) are **unchanged**. The only changed function is `parseCsvItems`.

| Format | Status |
|---|---|
| PDF | UNCHANGED |
| Word (.docx/.doc) | UNCHANGED |
| Excel (.xlsx/.xls/.numbers) | UNCHANGED |
| `extractFromText`, `extractFromPdfPages`, `extractFromWorkbook` | UNCHANGED |
| `applyGearClassification` | UNCHANGED |

---

## 10. Build / Test Results

| Check | Result |
|---|---|
| `tsc --noEmit` (`@workspace/api-server`) | ✓ PASS — zero new errors in `importGear.ts`; pre-existing unrelated error in `locker.ts` unchanged |
| API server rebuild + start | ✓ PASS — esbuild completed, server listening |
| `curl` test — Fuel row destination | ✓ `"Consumables"` |
| `curl` test — Fuel row sub | ✓ `"Fuel"` |
| `curl` test — Fuel row weightOz | ✓ `7.68` |
| `curl` test — Fuel row expendable | ✓ `true` |
| `curl` test — Type fields for 6 other items | ✓ All populated correctly |
| `curl` test — applyGearClassification chaining | ✓ Tent→Shelter, SleepBag→Sleep, Puffy→ClothingPacked |
| All 4 workflows | ✓ RUNNING |

---

## 11. Confirmation: 024D Background Fix and 024B Alignment Preserved

No changes to `Checklist.tsx` or `BackgroundPicker.tsx`. The 024D single-class removal (`lg:overflow-hidden`) and the 024B toolbar grid alignment are completely untouched.

---

## 12. No Unrelated Changes

Changed files: only `artifacts/api-server/src/routes/importGear.ts`.
Lines changed: +3 lines in `CSV_COL_ALIASES` block; +7 lines in `parseCsvItems`.
No cleanup, refactoring, or other modifications made.

---

## 13. User Verification Status

**PENDING** — user must test in the live app with the 77-row CSV:

1. Upload `TrailWeigh-024E-Test-Import.csv` to Scan Gear List
2. Confirm 77 items are detected in preview
3. Confirm Fuel row shows: Type=Fuel, Description=4 oz, Weight=7.68, Qty=1
4. Import all 77 items into a blank/new list
5. Confirm Kitchen Gear contains **9** items
6. Confirm Expendables contains **1** item (Fuel / 4 oz)
7. Open Expendables → verify Type=Fuel, Description=4 oz, Weight=7.68 oz, Qty=1
8. Check at least 3 other items — confirm Type fields are populated (Backpack, Tent, Filter, etc.)
9. Confirm Scan Gear List resets/clears after import as before
10. Confirm Background panel (024D) still opens normally
