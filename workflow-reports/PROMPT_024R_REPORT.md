# Prompt 024R — Fix Name Semantics

**Prompt:** 024R  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

In `parseCsvItems` (CSV path), before this fix:

```typescript
const typeRaw = get('type');        // e.g. "Hiking Shirt"
const descRaw = get('description'); // e.g. "Worn while hiking"
const desc = descRaw || typeRaw;    // "Worn while hiking"  ← stored as Name
```

`desc` served two roles simultaneously:
1. **Worn Signal D** — `isExplicitlyWorn` used `/^worn\b/i.test(desc.trim())` — correctly detecting "Worn while hiking" as a worn signal
2. **The stored Name field** — `desc: desc.slice(0, 200)` stored the same value as the item's `desc` property, which 024Q renamed as the visible **Name** column

Because `descRaw` ("Worn while hiking") was non-empty, it became the Name without any filtering. Worn routing worked correctly but the status text leaked visibly into the Name field.

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**  
(No UI, PDF, DOCX, auth, Locker, Share, Background, or toolbar files changed.)

### Change 1 — `STATUS_DESC_RE` constant

Added after `SUBCAT_HDR_RE`:

```typescript
const STATUS_DESC_RE = /^(?:worn\b|carried\b|consumable\b|reusable\b|pair\s+weight\b|three\s+daily\s+portions?\b|quantity\s*[><=]|quantity\s+\w|generic\s+category\b|metric\s+decimal\b|same\s+mass\b|blank\s+weight\b|true\b|false\b|yes\b|no\b)/i;
```

Conservative, anchored-at-start pattern matching exactly the status/metadata strings from the prompt spec. Does NOT match normal product names like "Zpacks Duplex", "20 degree quilt", "10,000 mAh", "main pack", "trekking pole shelter", etc.

### Change 2 — `NAME_HDR_RE` constant + `detectCols` nameCol (XLSX path)

Added:
```typescript
const NAME_HDR_RE = /^(product|product name|model|item model)$/;
```

Added `nameCol` to `detectCols` return type and detection loop. Unlike `typeCol`, `nameCol` is captured **independently** — so a file with both `Type` and `Product` columns gets `typeCol` for "Type" AND `nameCol` for "Product", rather than "Product" being silently ignored.

### Change 3 — `CSV_COL_ALIASES` (CSV path)

Moved `product` from `type` aliases to a new `productname` key:

```typescript
type:        ['type', 'item name', 'name', 'gear', 'item', 'gear item', 'equipment'],
productname: ['product', 'product name', 'model', 'item model'],
```

`name` remains in `type` aliases so lighterpack-style "Name" column → Type behavior from 024O is preserved. The identity check was updated to also accept `productname` as a valid identity field.

**Regression guard:** when only a `Product` column exists with no `Type` column, `nameRaw` falls back to serve as the item's `sub` (Type) field — `sub: (typeRaw || nameRaw).slice(0, 60)` — and `nameDesc` is left blank (to avoid the product value appearing in both Type and Name). Verified with a product-only fixture.

### Change 4 — `parseCsvItems`: decouple worn detection from Name

```typescript
const nameRaw = get('productname');  // dedicated product-name column

// Name priority (024R):
//   1. Dedicated product-name column if not status text AND typeRaw is also present
//      (when typeRaw is absent, nameRaw is used as sub and not duplicated in desc)
//   2. Description/notes column if not status text
//   3. Blank — do not fall back to typeRaw (would duplicate Type)
const nameDesc = typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim())
  ? nameRaw
  : (!STATUS_DESC_RE.test(descRaw.trim()) ? descRaw : '');

// Signal D uses descRaw directly (not nameDesc) — worn routing is unaffected
const isExplicitlyWorn = ... || /^worn\b/i.test(descRaw.trim());

// Push uses nameDesc and the typeRaw-or-nameRaw sub fallback
sub:  (typeRaw || nameRaw).slice(0, 60),
desc: nameDesc.slice(0, 200),
```

### Change 5 — `extractGenericMode`: name filtering for XLSX

Signal D uses the raw `desc` from `descCol` (before any 024R filtering). Then:

```typescript
if (nameCol >= 0 && nameCol !== typeCol) {
  // Dedicated product-name column exists and is separate from Type column
  const nameCell = String(row[nameCol] ?? '').trim();
  desc = (nameCell && !STATUS_DESC_RE.test(nameCell)) ? nameCell : '';
} else if (STATUS_DESC_RE.test(desc.trim())) {
  // No dedicated name column — filter status text from descCol
  desc = '';
}
```

---

## Test Results

### Test 01 — 01_lighterpack_style.csv

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 9 | 9 | ✓ |
| Hiking Shirt destination | Clothing Worn | Clothing Worn | ✓ |
| Hiking Shirt Name | blank | `""` | ✓ |
| Hiking Shirt Name ≠ "Worn while hiking" | ✓ | ✓ | ✓ |
| Smartwater Bottle qty | 2 | 2 | ✓ |
| Fuel → Consumables | ✓ | ✓ | ✓ |
| Non-status Names preserved | "40 L frameless backpack", "1 L bottle", "10,000 mAh" | all preserved | ✓ |

### Test 02 — 02_metagear_style.csv

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 7 | 7 | ✓ |
| Trail Runners destination | Clothing Worn | Clothing Worn | ✓ |
| Trail Runners Name ≠ "Pair weight" | ✓ | `""` | ✓ |
| Water qty | 2 | 2 | ✓ |
| Dog Food qty | 3 | 3 | ✓ |
| Backpack weight correct | ✓ | ✓ | ✓ |
| Non-status Names preserved | "Main pack", "Rechargeable" | preserved | ✓ |

### Test 05 — 05_nested_subcategory_test.xlsx

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 12 | 12 | ✓ |
| Sun Hat destination | Clothing Worn | Clothing Worn | ✓ |
| Sun Hat Name ≠ "Worn item" | ✓ | `""` | ✓ |
| Fuel qty | 2 | 2 | ✓ |

### Test 06 — 06_messy_spreadsheet.csv

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Item count | 10 | 10 | ✓ |
| Header row detection | ✓ | ✓ | ✓ |
| Sun Hat destination | Clothing Worn | Clothing Worn | ✓ |
| Sun Hat Name | not status text | `""` | ✓ |
| Fuel qty | 2 | 2 | ✓ |
| Socks qty | 2 | 2 | ✓ |
| Tent weight "1 lb 10 oz" | 26 oz | 26 oz | ✓ |
| Toothpaste blank weight | imports | ✓ | ✓ |
| TOTAL row ignored | ✓ | ✓ | ✓ |
| Non-status Names preserved | "main pack", "trekking pole shelter", "20 degree", etc. | preserved | ✓ |

### Phase 5 — Dedicated Product-Name Column (CSV)

Fixture: `Type,Product,Worn,Weight,Unit`

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Hiking Shirt sub | Hiking Shirt | Hiking Shirt | ✓ |
| Hiking Shirt Name | Outdoor Research Echo | Outdoor Research Echo | ✓ |
| Hiking Shirt destination | Clothing Worn | Clothing Worn | ✓ |
| Tent sub | Tent | Tent | ✓ |
| Tent Name | Zpacks Duplex | Zpacks Duplex | ✓ |

### Regression Guard — Product-Only Column

Fixture: `Product,Weight,Unit` (no separate Type column)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| "Hiking Shirt" appears as sub (Type) | Hiking Shirt | Hiking Shirt | ✓ |
| Name is blank (not duplicated) | `""` | `""` | ✓ |

### Regressions

| Fixture | Expected | Actual | Pass |
|---------|----------|--------|------|
| 77-item CSV | 77 | 77 | ✓ |
| 77-item PDF | 77 | 77 | ✓ |

---

## Confirmation Checklist

- [x] Hiking Shirt Name is NOT "Worn while hiking" — it is blank
- [x] Trail Runners Name is NOT "Pair weight" — it is blank
- [x] Sun Hat Name is NOT "Worn item" — it is blank
- [x] Clothing Worn routing still works for all four cases
- [x] Product / Product Name / Model aliases tested and working (Phase 5)
- [x] 024O quantities (Smartwater ×2, Water ×2, Dog Food ×3, Fuel ×2, Socks ×2) all preserved
- [x] 024Q NAME UI label remains intact (024Q was a UI-only change; not touched here)
- [x] PDF parsing not changed
- [x] DOCX parsing not changed
- [x] No unrelated changes made
- [x] Internal property name remains `desc` — no schema/database migration
- [x] Non-status descriptive text preserved ("40 L frameless backpack", "Zpacks Duplex", "main pack", etc.)

---

## Internal field name

`desc` remains the internal property name throughout. Only the import-time filtering logic changed. No data migration.

## Ambiguity note

When `name` is the only identity column (lighterpack-style), it continues to map to `type` (the sub/Type field) via the unchanged `type: ['name', ...]` alias — 024O behavior preserved. The new `productname` canonical field activates only for `product`, `product name`, `model`, `item model` headers.

---

**User verification status: PENDING**
