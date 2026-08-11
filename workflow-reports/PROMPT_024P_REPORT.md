# Prompt 024P — Preserve Worn Status During CSV/XLSX Import

**Prompt:** 024P  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause

Three distinct reasons explicit worn status was being ignored:

1. **`parseCsvItems` never read the Worn column.** Line 1045 had a comment `// worn is parsed but not propagated in v1`. `get('worn')` was never called. The Worn column value was silently discarded every time.

2. **`applyGearClassification` Priority 2 unconditionally overwrote any worn destination.** For items in `CLOTHING_TYPES` (Trail Runners, Sun Hat), Priority 2 fired and returned `destination: 'Clothing Packed'` regardless of what the import path had set. There was no check for an existing `'Clothing Worn'` destination.

3. **`extractGenericMode` had no subcategory column detection.** The Subcategory column (carrying the "Worn" signal in test 05) was never detected or read. `detectCols` / `extractGenericMode` only knew about `catCol`; there was no `subcatCol`.

**Bonus issue discovered during testing:** "Hiking Shirt" is not enumerated in `CLOTHING_TYPES` (which lists specific trail gear types like "trail runners", "sun hat", "rain jacket", etc., but not generic terms like "shirt"). Gating worn routing on `CLOTHING_TYPES` alone silently failed for generic clothing terms. A broader `APPAREL_WORD_RE` pattern was needed as a fallback.

---

## Repair Made

**Changed file: `artifacts/api-server/src/routes/importGear.ts`**  
(No UI, PDF, DOCX, auth, or other files changed.)

### Change 1 — `CSV_COL_ALIASES.worn`: add `'status'`

```
worn: ['worn', 'status']
```

Maps the "Status" column header (used in test 06's `group,gear,count,wt,notes,status` format) to the existing `'worn'` field, so `get('worn')` picks it up automatically.

### Change 2 — `applyGearClassification` Priority 2: honour explicit Clothing Worn

Before overriding to `Clothing Packed`, check if the import path already resolved a worn destination:

```typescript
if (CLOTHING_TYPES.has(typeN)) {
  // 024P: honour explicit Clothing Worn set during import
  if (CLOTHING_WORN_SECTION_ALIASES.has(destN)) {
    return { ...item, destination: 'Clothing Worn', warning: item.warning };
  }
  // ... existing Clothing Packed logic
}
```

This means Priority 2 no longer silently overwrites a `'Clothing Worn'` destination for items in `CLOTHING_TYPES` (Trail Runners, Sun Hat, etc.).

### Change 3 — `parseCsvItems`: read and apply worn signals

Replaced the ignored worn comment with full signal detection:

- **Signal A** — Dedicated `Worn` column: `parseCsvBool(wornRaw) === true` catches `TRUE`, `Yes`, `1`
- **Signal B** — `Status` column: `/^worn$/i.test(wornRaw)` catches `worn`, `WORN` (via the 'status' alias)
- **Signal C** — Subcategory column: `CLOTHING_WORN_SECTION_ALIASES.has(norm(subcatRaw))` catches `Worn`, `Worn Gear`, etc.
- **Signal D** — Description/notes prefix: `/^worn\b/i.test(desc)` catches `Worn item`, `Worn while hiking` (tight; won't match unrelated worn-word fragments)

Gated on `isClothingType = CLOTHING_TYPES.has(norm(typeRaw)) || APPAREL_WORD_RE.test(typeRaw)` to prevent non-apparel items from being misdirected.

When `isExplicitlyWorn && isClothingType`, `effectiveDestination = 'Clothing Worn'` instead of the source category.

### Change 4 — `APPAREL_WORD_RE`: broader clothing recognition

Added module-level constant:

```typescript
const APPAREL_WORD_RE = /\b(shirt|tee|t-shirt|shorts|pants|tights|leggings|dress|skirt|socks?|hat|cap|beanie|jacket|hoody|hoodie|sweater|jersey|top|bra|underwear|boots?|shoes?|sneakers?|runners?|sandals?|gaiters?|gloves?|mittens?|vest)\b/i;
```

Catches generic clothing terms (e.g. "Hiking Shirt" → "shirt") not individually listed in `CLOTHING_TYPES`. Used only when an explicit worn signal is already present — never triggers standalone.

### Change 5 — `detectCols` / `extractGenericMode`: subcategory column

Added `SUBCAT_HDR_RE = /^(subcategory|sub category|sub-category)$/` and `subcatCol` to `detectCols` return. `extractGenericMode` now reads `subcatRaw` from this column and evaluates it as worn Signal C for XLSX files.

---

## Test Results

### Test 01 — 01_lighterpack_style.csv

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 9 | 9 | ✓ |
| Hiking Shirt destination | Clothing Worn | Clothing Worn | ✓ |
| Smartwater Bottle qty | 2 | 2 | ✓ |
| Fuel Canister destination | Consumables | Consumables | ✓ |
| No items lost | — | — | ✓ |

Signals active for Hiking Shirt: Signal A (`Worn = TRUE`) + Signal D (`desc = "Worn while hiking"`).

### Test 02 — 02_metagear_style.csv

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 7 | 7 | ✓ |
| Trail Runners destination | Clothing Worn | Clothing Worn | ✓ |
| Water qty | 2 | 2 | ✓ |
| Dog Food qty | 3 | 3 | ✓ |
| Backpack 1.55 lb weight | 24.8 oz | 24.8 oz | ✓ |
| Water 1 kg weight | 35.27 oz | 35.27 oz | ✓ |
| No items lost | — | — | ✓ |

Signals active for Trail Runners: Signal A (`Worn = Yes`). Category column also said "Worn Gear" (Signal C via category fallback pathway).

### Test 05 — 05_nested_subcategory_test.xlsx

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 12 | 12 | ✓ |
| Sun Hat destination | Clothing Worn | Clothing Worn | ✓ |
| Fuel destination | Consumables | Consumables | ✓ |
| Fuel qty | 2 | 2 | ✓ |
| No items lost | — | — | ✓ |

Signals active for Sun Hat: Signal C (`Subcategory = Worn` → `subcatCol` newly detected) + Signal D (`Notes = "Worn item"`).

### Test 06 — 06_messy_spreadsheet.csv

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 10 | 10 | ✓ |
| Header below title detected | ✓ | ✓ | ✓ |
| Sun Hat destination | Clothing Worn | Clothing Worn | ✓ |
| Fuel qty | 2 | 2 | ✓ |
| Socks qty | 2 | 2 | ✓ |
| Tent weight ("1 lb 10 oz") | 26 oz | 26 oz | ✓ |
| Toothpaste blank weight | imports (0 oz) | 0 oz | ✓ |
| TOTAL row ignored | ✓ | ✓ | ✓ |
| No items lost | — | — | ✓ |

Signals active for Sun Hat: Signal B (`status = worn` via `status` alias now mapped to `worn` field).

### Confirmation checklist

| Item | Destination | Pass |
|------|-------------|------|
| Hiking Shirt (Worn = TRUE) | Clothing Worn | ✓ |
| Trail Runners (Worn = Yes) | Clothing Worn | ✓ |
| Sun Hat (Subcategory = Worn, test 05) | Clothing Worn | ✓ |
| Sun Hat (Status = worn, test 06) | Clothing Worn | ✓ |
| Smartwater Bottle qty = 2 | ✓ | ✓ |
| Water qty = 2 | ✓ | ✓ |
| Dog Food qty = 3 | ✓ | ✓ |
| Fuel qty = 2 (test 05) | ✓ | ✓ |
| Fuel qty = 2 (test 06) | ✓ | ✓ |
| Socks qty = 2 | ✓ | ✓ |

---

## Regressions

| Fixture | Expected | Actual | Pass |
|---------|----------|--------|------|
| 77-item CSV | 77 | 77 | ✓ |
| 77-item PDF | 77 | 77 | ✓ |

---

## Scope Verification

- **PDF parser:** not changed ✓
- **DOCX parser:** not changed ✓
- **024O aliases/qty/header-row detection:** all preserved ✓
- **Fuel → Consumables:** unchanged ✓
- **Background, toolbar, Share, Locker, Auth, Stripe:** not touched ✓
- **Application files changed:** `artifacts/api-server/src/routes/importGear.ts` only

---

**User verification status: PENDING**
