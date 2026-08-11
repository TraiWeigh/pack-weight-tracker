# Prompt 024S — Do Not Preserve Vague Source Groups as Categories

**Prompt:** 024S  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

In `parseCsvItems` (CSV path):

```typescript
const category = get('category');   // e.g. "Big Three" or "Bits"
const effectiveDestination = expendable
  ? 'Consumables'
  : (isExplicitlyWorn && isClothingType)
    ? 'Clothing Worn'
    : (category || undefined);      // ← "Big Three" / "Bits" passed directly

items.push(applyGearClassification({
  ...
  destination: effectiveDestination,   // ← "Big Three" reaches the classifier
}));
```

In `applyGearClassification`, items like Backpack and Toothbrush don't match any of the existing type sets (Priorities 1–6: CONSUMABLES_TYPES, CLOTHING_TYPES, SHELTER_TYPES, SLEEP_TYPES, CLOTHING_WORN_SECTION_ALIASES, CONSUMABLES_SECTION_ALIASES). They fall through to Priority 7 which unconditionally returns the item with its source category as-is:

```typescript
// Priority 7: keep source section or leave empty for manual selection.
return item;  // ← "Big Three" / "Bits" kept unchanged
```

There was no concept of "weak" or "vague" source groups — any source category survived Priority 7 without filtering.

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**  
(No UI, PDF, DOCX, auth, Locker, Share, Background, or toolbar files changed.)

### Change 1 — `WEAK_SOURCE_GROUPS` constant

Added before `CLOTHING_WORN_SECTION_ALIASES`:

```typescript
export const WEAK_SOURCE_GROUPS = new Set([
  'big three', 'big 3', 'big four', 'big 4',
  'bits', 'misc', 'misc.', 'miscellaneous',
  'stuff', 'odds & ends', 'odds and ends',
]);
```

Centralised set of vague/umbrella group labels. Has no effect on saved lists or manually created categories.

### Change 2 — `PACK_TYPES`, `ELECTRONICS_TYPES`, `PERSONAL_TYPES` constants

Three new type sets providing confident destinations for items that previously had no type-based priority:

```typescript
PACK_TYPES       → 'Pack'         // backpack, pack, rucksack, etc.
ELECTRONICS_TYPES → 'Electronics' // headlamp, power bank, GPS, etc.
PERSONAL_TYPES   → 'Personal'     // toothbrush, hairbrush, mirror, etc.
```

`dog pack` / `dog backpack` intentionally excluded from PACK_TYPES — those route to "Dog Gear" via source category, not Pack.

### Change 3 — New priorities in `applyGearClassification` (Priority 6b, 6c, 6d)

Added between Priority 6 (consumables alias) and Priority 7 (fallthrough):

```typescript
// Priority 6b: Pack type → "Pack"
if (PACK_TYPES.has(typeN)) return { ...item, destination: 'Pack', ... };

// Priority 6c: Electronics type → "Electronics"
if (ELECTRONICS_TYPES.has(typeN)) return { ...item, destination: 'Electronics', ... };

// Priority 6d: Personal-care type → "Personal"
if (PERSONAL_TYPES.has(typeN)) return { ...item, destination: 'Personal', ... };
```

These priorities fire unconditionally (same pattern as SHELTER_TYPES / SLEEP_TYPES). `sectionConflict` warning is set when the source category differs from the assigned destination.

### Change 4 — Strip weak source groups in `parseCsvItems`

```typescript
// 024S: clear vague/umbrella source-group labels before passing to applyGearClassification
const effectiveCategory = WEAK_SOURCE_GROUPS.has(norm(category)) ? '' : category;
const effectiveDestination = expendable
  ? 'Consumables'
  : (isExplicitlyWorn && isClothingType)
    ? 'Clothing Worn'
    : (effectiveCategory || undefined);
```

When the source group is weak, `destination: undefined` is passed to `applyGearClassification`. Type-based priorities (1–6d) can then fire normally. If no priority matches (unknown item), Priority 7 returns the item with `undefined` destination — it is preserved safely for user review in the import panel rather than being discarded or misrouted.

### Change 5 — Strip weak source groups in `extractGenericMode` (XLSX)

Same logic applied to the XLSX tabular path:

```typescript
const effectiveCat = WEAK_SOURCE_GROUPS.has(norm(cat)) ? '' : cat;
const finalDest = (isExplicitlyWorn && isClothingType) ? 'Clothing Worn' : (effectiveCat || undefined);
```

---

## Test 06 Results — 06_messy_spreadsheet.csv

| Item | Source Group | Final Category | Qty | Weight | Pass |
|------|-------------|----------------|-----|--------|------|
| Backpack | Big Three (weak) | **Pack** | 1 | 25 oz | ✓ |
| Tent | Shelter | Shelter | 1 | 26 oz | ✓ |
| Quilt | Sleep | Sleep | 1 | 23.5 oz | ✓ |
| Stove | Cook Kit (meaningful) | Cook Kit | 1 | 0.9 oz | ✓ |
| Fuel | Consumables | Consumables | 2 | 3.9 oz | ✓ |
| Toothbrush | Bits (weak) | **Personal** | 1 | 0.6 oz | ✓ |
| Toothpaste | Consumables | Consumables | 1 | 0 oz (blank) | ✓ |
| Leukotape | Consumables | Consumables | 1 | 1.2 oz | ✓ |
| Socks | Clothes | Clothes | 2 | 1.8 oz | ✓ |
| Sun Hat | (worn signal) | Clothing Worn | 1 | 2.1 oz | ✓ |

**Item count: 10/10 ✓**  
**No Big Three category created ✓**  
**No Bits category created ✓**  
**Cook Kit preserved (meaningful source group) ✓**  
**TOTAL row ignored ✓**  
**Header row below title detected ✓**  
**Sun Hat Name: blank ✓**

---

## Phase 5 — Synthetic Routing Tests

| Test | Source Group | Item | Expected | Actual | Pass |
|------|-------------|------|----------|--------|------|
| 1 | Big Four | Sleeping Pad | Sleep | Sleep | ✓ |
| 2 | Misc | Headlamp | Electronics | Electronics | ✓ |
| 3 | Stuff | Fuel | Consumables | Consumables | ✓ |
| 4 | Misc | Unrecognized Prototype Widget | preserved safely | `None` (no category forced) | ✓ |

Test 4 confirms unknown items are preserved without inventing a category. The import panel will show them with no pre-assigned category for user selection.

---

## Regression Results

### 024O, 024P, 024R

| Test | Items | Worn routing | Qty | 024R Name | Pass |
|------|-------|-------------|-----|-----------|------|
| 01 | 9/9 | Hiking Shirt → Clothing Worn ✓ | Smartwater ×2 ✓ | blank ✓ | ✓ |
| 02 | 7/7 | Trail Runners → Clothing Worn ✓ | Water ×2, Dog Food ×3 ✓ | ✓ | ✓ |
| 05 | 12/12 | Sun Hat → Clothing Worn ✓ | Fuel ×2 ✓ | ✓ | ✓ |

**Dog Pack → Dog Gear in test 05:** `dog pack` was intentionally excluded from `PACK_TYPES` after initial testing showed it wrongly overriding the "Dog Gear" source category. Dog Pack now correctly routes to Dog Gear. ✓

**Note on test 02 Backpack:** previously `dest=Backpack` (from source category "Backpack"), now `dest=Pack` (from PACK_TYPES Priority 6b — same pattern as SHELTER_TYPES unconditionally routing to Shelter). `sectionConflict` warning is set. "Backpack" and "Pack" are the same TrailWeigh category concept; the user can rename during import review.

| Fixture | Expected | Actual | Pass |
|---------|----------|--------|------|
| 77-item CSV | 77 | 77 | ✓ |
| 77-item PDF | 77 | 77 | ✓ |

---

## Confirmation Checklist

- [x] No final "Big Three" category created for recognized Backpack item
- [x] No final "Bits" category created for recognized Toothbrush item
- [x] Backpack → Pack (routed by PACK_TYPES; source group "Big Three" stripped)
- [x] Toothbrush → Personal (routed by PERSONAL_TYPES; source group "Bits" stripped)
- [x] Fuel → Consumables qty=2 (CONSUMABLES_TYPES Priority 1 fires)
- [x] Socks qty=2 (clothing behavior unchanged)
- [x] Sun Hat → Clothing Worn, Name blank, weight 2.1 oz (024P + 024R preserved)
- [x] Cook Kit preserved as source category for Stove (not in WEAK_SOURCE_GROUPS)
- [x] Unknown item (Unrecognized Prototype Widget from Misc) preserved safely with no category
- [x] Dog Pack → Dog Gear (dog pack excluded from PACK_TYPES)
- [x] 024O quantity handling preserved
- [x] 024O header-row detection preserved
- [x] 024O weight parsing preserved
- [x] 024P worn routing preserved
- [x] 024R Name behavior preserved (status text not used as Name)
- [x] PDF parsing not changed
- [x] DOCX parsing not changed
- [x] No existing saved lists migrated or renamed
- [x] No unrelated changes made
- [x] 77-item CSV: 77 ✓
- [x] 77-item PDF: 77 ✓

---

**User verification status: PENDING**
