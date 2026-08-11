# Prompt 024O — Tabular Import Compatibility

**Status:** COMPLETE  
**Date:** 2026-08-11  
**File changed:** `artifacts/api-server/src/routes/importGear.ts`, `artifacts/pack-checklist/src/components/ImportGearPanel.tsx`

---

## Summary

Five external-format CSV/XLSX files that previously failed or produced wrong item counts are now imported correctly. All changes are confined to the tabular (CSV/XLSX) code paths. PDF and DOCX paths are untouched. Both 77-item regressions still pass.

---

## Test Results

| File | Expected | Actual | Pass |
|------|----------|--------|------|
| 01_lighterpack_style.csv | 9 | 9 | ✓ |
| 02_metagear_style.csv | 7 | 7 | ✓ |
| 05_nested_subcategory_test.xlsx | 12 | 12 | ✓ |
| 06_messy_spreadsheet.csv | 10 | 10 | ✓ |
| 07_edge_cases.csv | 9 | 9 | ✓ |
| **77-item CSV regression** | 77 | 77 | ✓ |
| **77-item PDF regression** | 77 | 77 | ✓ |

---

## Changes Made

### `artifacts/api-server/src/routes/importGear.ts`

#### 1. `ExtractedItem` — added `qty?` field

Added `qty?: number` so the quantity read from import sources survives through `applyGearClassification` (which uses `{ ...item, … }` spread) and reaches the API response.

#### 2. `CSV_COL_ALIASES` — expanded aliases

| Field | Previous aliases | Added aliases |
|-------|-----------------|---------------|
| `type` | `type` | `item name`, `name`, `gear`, `item`, `gear item`, `equipment`, `product` |
| `description` | `description`, `item`, `gear` | `notes`, `details` (`item`/`gear` moved to `type`) |
| `qty` | `quantity`, `qty` | `count`, `#` |
| `weight` | `weight` | `wt`, `mass` |
| `unit` | `unit` | `units`, `weight unit`, `weightunit` |
| `category` | `category`, `section` | `group`, `system` |
| `subcategory` | _(new)_ | `subcategory`, `sub category` |

Moving `item`, `gear`, `name`, `item name` from `description` to `type` means the import now correctly populates the TrailWeigh **Type** field (the gear model/kind) rather than the Description field for these common identity-column names.

#### 3. `parseTabularWeight` — new helper for compound weight strings

Added before `parseCsvItems`. Handles the "X lb Y oz" compound form (e.g. "1 lb 10 oz" → 26.0 oz) that `parseWeightToOz` cannot parse because its `replace(/[^\d.]/g,'')` strips the embedded unit and `parseFloat` reads only the leading integer.

Used only from `parseCsvItems` (CSV tabular path). All other forms fall through unchanged to `parseWeightToOz`.

```
"1 lb 10 oz"  → compound match → 1×16 + 10 = 26.0 oz ✓
"25 oz"        → no compound match → parseWeightToOz → 25.0 oz ✓
"23.5oz"       → no compound match → parseWeightToOz strips to "23.5" → 23.5 oz ✓
"3.9 oz each"  → no compound match → parseWeightToOz strips trailing "each" → 3.9 oz ✓
```

#### 4. `parseCsvItems` — header-row detection

Previously assumed `rows[0]` is always the header. Now scans the first 20 rows and scores each by how many cells map to a recognized field via `mapCsvHeader`. A row qualifies only if it contains at least one **identity field** (`type` or `description`) plus any other field. The highest-scoring qualifying row is used as the header.

This lets `06_messy_spreadsheet.csv` (title row on row 0, real header on row 1) import correctly without any manual pre-processing.

#### 5. `parseCsvItems` — validation fix

Old check: `colMap['description'] === undefined` → throw.  
New check: `colMap['description'] === undefined && colMap['type'] === undefined` → throw.

Files whose identity column maps to `type` (e.g. those using "Name", "Item", "Gear") were previously rejected. Now accepted.

#### 6. `parseCsvItems` — description fallback from Type

When a row has `typeRaw` (e.g. "Sun Hat") but `descRaw` is empty (no description/notes column or blank cell), `desc = descRaw || typeRaw` ensures the item is not silently dropped by the `if (!desc) continue` guard. The `sub` field still holds `typeRaw`; `desc` is only set from it as a last resort.

#### 7. `parseCsvItems` — quantity propagation

Previously: `qty` was in `colMap` if the header existed, but no `get('qty')` call existed in the row loop — quantity was always discarded.

Now: `const qty = Math.max(1, parseInt(qtyRaw, 10) || 1)` is read per row and passed into the pushed `ExtractedItem`. Defaults to 1 for blank, non-numeric, or absent cells.

#### 8. `parseCsvItems` — TOTAL row guard

Skip rows whose `typeRaw` or `descRaw` starts with `total`, `grand total`, or `sub total` (case-insensitive). This prevents the `TOTAL,,,,,` summary row in messy spreadsheets from becoming an item.

#### 9. Spreadsheet path — `TYPE_RE`, `DESC_RE`, `UNIT_RE`; new `QTY_HDR_RE`, `CAT_HDR_RE`

| Constant | Change |
|----------|--------|
| `TYPE_RE` | Added `item name`, `name`, `gear`, `item`, `gear item`, `equipment`, `product`, `product name` |
| `DESC_RE` | Removed `item`, `item name`, `gear`, `gear item`, `product`, `product name`, `equipment`, `name`; kept `description`; added `notes`, `details` |
| `WEIGHT_HDR_RE` | Added `mass` |
| `UNIT_RE` | Added `units`, `weight unit`, `weightunit` |
| `QTY_HDR_RE` | **New**: `quantity`, `qty`, `count`, `#` |
| `CAT_HDR_RE` | **New**: `category`, `section`, `group`, `system` |

#### 10. `detectCols` — added `qtyCol` and `catCol`

Updated return type and body to detect quantity and category columns. Callers that don't use these new fields (e.g. `extractSectionMode`) are unaffected by the wider return type.

#### 11. `extractGenericMode` — use `qtyCol`, `catCol`

- Added `qtyCol` and `catCol` detection from `detectCols`.
- Category string from `catCol` is passed as `destination` (empty string → `undefined`, so `applyGearClassification` can still override).
- Quantity is parsed from `qtyCol`: numeric XLSX cells used directly, string cells parsed with `parseInt`, defaults to 1.
- `destination` and `qty` are now included in the pushed `ExtractedItem`.

### `artifacts/pack-checklist/src/components/ImportGearPanel.tsx`

- Added `qty?: number` to the `ParsedItem` interface (mirrors the API response shape).
- Updated the `onAddItem` call to pass `qty: it.qty ?? 1`, so quantities read from the import are preserved when items land in the gear list.

---

## What Was NOT Changed

- `extractFromPdfPages` — PDF parser (024M work) untouched
- `extractFromText` — DOCX/text fallback untouched
- `extractSectionMode` — TrailWeigh-format spreadsheet parser untouched
- All UI components except the one-line qty pass-through in `ImportGearPanel.tsx`
- Auth, Locker, Share, Background, screensaver, mobile app

---

## Regression Detail

**77-item CSV** (`TrailWeigh-024M-Ground-Truth-77-Items.csv`): 77/77 — no change.  
**77-item PDF** (`TrailWeigh-024M-Test-Pack-Weight.pdf`): 77/77 — no change (PDF path not touched).
