# Prompt 024T — Route Recognized Backpack Items to Backpack, Not Pack

**Prompt:** 024T  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

In `applyGearClassification` (added in 024S), Priority 6b read:

```typescript
// Priority 6b: Pack type → "Pack".
if (PACK_TYPES.has(typeN)) {
  return { ...item, destination: 'Pack', warning: item.warning || sectionConflict('Pack') };
}
```

The destination string `'Pack'` did not match the canonical TrailWeigh category label `'Backpack'`. The `WEAK_SOURCE_GROUPS` stripping was correct (cleared "Big Three" before passing to the classifier), and `PACK_TYPES.has('backpack')` fired correctly — but the label it produced was the wrong string.

**Single-location fix:** change `'Pack'` → `'Backpack'` in that one return statement.

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**  
One string constant changed in one location. No other files touched.

**Before:**
```typescript
return { ...item, destination: 'Pack', warning: item.warning || sectionConflict('Pack') };
```

**After:**
```typescript
return { ...item, destination: 'Backpack', warning: item.warning || sectionConflict('Backpack') };
```

No vague-group logic changed. No type sets changed. No aliases changed. No saved categories touched.

---

## Test 06 Results — Phase 4

File: `06_messy_spreadsheet.csv`

| Item | Source Group | Final Category | Qty | Weight | Pass |
|------|-------------|----------------|-----|--------|------|
| Backpack | Big Three (weak, stripped) | **Backpack** | 1 | 25 oz | ✓ |
| Tent | Shelter | Shelter | 1 | 26 oz | ✓ |
| Quilt | Sleep | Sleep | 1 | 23.5 oz | ✓ |
| Stove | Cook Kit (preserved) | Cook Kit | 1 | 0.9 oz | ✓ |
| Fuel | Consumables | Consumables | 2 | 3.9 oz | ✓ |
| Toothbrush | Bits (weak, stripped) | Personal | 1 | 0.6 oz | ✓ |
| Toothpaste | Consumables | Consumables | 1 | 0 oz (blank) | ✓ |
| Leukotape | Consumables | Consumables | 1 | 1.2 oz | ✓ |
| Socks | Clothes | Clothes | 2 | 1.8 oz | ✓ |
| Sun Hat | (worn signal) | Clothing Worn | 1 | 2.1 oz | ✓ |

**Item count: 10/10 ✓**  
**Backpack → Backpack ✓ (not Pack, not Big Three)**  
**Big Three category: absent ✓**  
**Bits category: absent ✓**  
**No Pack category created solely for Backpack ✓**  
**TOTAL row ignored ✓**  
**Toothpaste blank weight retained ✓**  
**Sun Hat Name blank ✓**

---

## Phase 5 — Canonical Backpack Checks

| Source Group | Item | Expected | Actual | Pass |
|---|---|---|---|---|
| Big Three (weak) | Backpack | Backpack | Backpack | ✓ |
| Backpack (meaningful) | Backpack | Backpack | Backpack | ✓ |

Meaningful source category "Backpack" is not changed — it already produces "Backpack" via Priority 7 fallthrough (since `WEAK_SOURCE_GROUPS` does not include "Backpack"), and now Priority 6b also produces "Backpack" if the type matches first. Either path gives the same correct result.

---

## Phase 6 — Regression Results

### Test 01 (LighterPack style)
9/9 items ✓ · `Hiking Shirt → Clothing Worn` ✓ · `Power Bank → Electronics` ✓ · `Smartwater ×2` ✓  
`Trail Backpack → Pack` (source category is "Pack"; "Trail Backpack" is not in PACK_TYPES so Priority 6b does not fire; source "Pack" preserved via Priority 7) ✓

### Test 02 (MetaGear style)
7/7 items ✓ · `Backpack → Backpack` ✓ · `Trail Runners → Clothing Worn` ✓ · `Water ×2, Dog Food ×3` ✓

### Test 05 (XLSX nested subcategory)
12/12 items ✓ · `Backpack → Backpack` ✓ · `Dog Pack → Dog Gear` ✓ · `Toothbrush → Personal` ✓ · `Sun Hat → Clothing Worn` ✓

### 77-item fixtures
| Fixture | Expected | Actual | Pass |
|---|---|---|---|
| 77-item CSV | 77 | 77 | ✓ |
| 77-item PDF | 77 | 77 | ✓ |

---

## Confirmation Checklist

- [x] Exact cause identified: Priority 6b returned `'Pack'` instead of `'Backpack'`
- [x] Exact correction: one string constant changed in one location
- [x] Test 06: 10/10 items ✓
- [x] Backpack → Backpack ✓
- [x] Big Three absent ✓
- [x] Bits absent ✓
- [x] No Pack category created for recognized Backpack item ✓
- [x] Toothbrush → Personal ✓ (024S preserved)
- [x] Fuel → Consumables qty=2 ✓
- [x] Sun Hat → Clothing Worn, Name blank, weight 2.1 oz ✓
- [x] 024O regression: quantity handling, header detection, weight parsing preserved ✓
- [x] 024P regression: worn routing (Hiking Shirt, Trail Runners, Sun Hat) preserved ✓
- [x] 024R regression: Name semantics preserved ✓
- [x] 024S regression: Big Three/Bits weak-group stripping preserved ✓
- [x] 77-item CSV: 77 ✓
- [x] 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] DOCX code not changed ✓
- [x] No saved user categories/lists migrated or renamed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only (one string in one line)

---

**User verification status: PENDING**
