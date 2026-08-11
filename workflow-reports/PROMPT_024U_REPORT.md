# Prompt 024U — Canonicalize Clear Backpack Items to the Backpack Category

**Prompt:** 024U  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

In `applyGearClassification`, Priority 6b fires when `PACK_TYPES.has(typeN)` is true.  
The set used exact phrase matching (not substring). Before this fix:

```typescript
export const PACK_TYPES = new Set([
  'backpack', 'pack', 'rucksack', 'frameless pack', 'frameless backpack',
  'ultralight pack', 'trail pack', 'hiking pack', 'overnight pack',
  'day pack', 'daypack',
]);
```

`norm('Trail Backpack')` → `'trail backpack'` — **not in the set** → Priority 6b did not fire.

The source category `'Pack'` is not in `WEAK_SOURCE_GROUPS`, so it was not stripped by the 024S weak-group logic. It survived to Priority 7 (fallthrough), which returned it unchanged as the final destination.

**Result before fix:** `Trail Backpack → Pack`

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**  
Added `'trail backpack'`, `'hiking backpack'`, `'ultralight backpack'`, `'main backpack'`, and `'overnight backpack'` to `PACK_TYPES`. These are exact phrase entries — not a substring rule. Negative cases (Dog Pack, Battery Pack, Hip Pack, Fanny Pack, Pack Towel) remain absent from the set and are unaffected.

**Before:**
```typescript
export const PACK_TYPES = new Set([
  'backpack', 'pack', 'rucksack', 'frameless pack', 'frameless backpack',
  'ultralight pack', 'trail pack', 'hiking pack', 'overnight pack',
  'day pack', 'daypack',
  // Note: 'dog pack' / 'dog backpack' intentionally excluded ...
]);
```

**After:**
```typescript
export const PACK_TYPES = new Set([
  // Generic / compound backpack phrases (exact phrase match — NOT a substring rule)
  'backpack', 'trail backpack', 'hiking backpack', 'ultralight backpack',
  'main backpack', 'overnight backpack', 'frameless backpack',
  // "Pack" as a standalone item type or with common backpack qualifiers
  'pack', 'trail pack', 'hiking pack', 'ultralight pack',
  'overnight pack', 'frameless pack', 'day pack', 'daypack',
  // Classic synonyms
  'rucksack',
  // Note: 'dog pack' / 'dog backpack' / 'fanny pack' / 'hip pack' / 'battery pack' /
  //       'pack towel' intentionally excluded ...
]);
```

No vague-group logic changed. No type sets other than `PACK_TYPES` changed. No aliases changed. No saved categories touched.

---

## Test 01 Results — Phase 4

File: `01_lighterpack_style.csv`

| Item | Source Category | Final Category | Qty | Pass |
|------|----------------|----------------|-----|------|
| Trail Backpack | Pack | **Backpack** | 1 | ✓ |
| Trekking Pole Tent | Shelter | Shelter | 1 | ✓ |
| Down Quilt | Sleep System | Sleep System | 1 | ✓ |
| Sleeping Pad | Sleep | Sleep | 1 | ✓ |
| Titanium Pot | Kitchen | Kitchen | 1 | ✓ |
| Fuel Canister | Consumables | Consumables | 1 | ✓ |
| Smartwater Bottle | Water | Water | 2 | ✓ |
| Hiking Shirt | Clothing Worn | Clothing Worn | 1 | ✓ |
| Power Bank | Electronics | Electronics | 1 | ✓ |

**Item count: 9/9 ✓**  
**Trail Backpack → Backpack ✓ (not Pack)**  
**Source category Pack: absent as final destination for Trail Backpack ✓**  
**Smartwater Bottle qty=2 ✓**  
**Hiking Shirt → Clothing Worn ✓**

---

## Test 06 Results — Phase 4

File: `06_messy_spreadsheet.csv`

| Item | Source Group | Final Category | Qty | Weight | Pass |
|------|-------------|----------------|-----|--------|------|
| Backpack | Big Three (weak) | Backpack | 1 | 25 oz | ✓ |
| Tent | Shelter | Shelter | 1 | 26 oz | ✓ |
| Quilt | Sleep | Sleep | 1 | 23.5 oz | ✓ |
| Stove | Cook Kit | Cook Kit | 1 | 0.9 oz | ✓ |
| Fuel | Consumables | Consumables | 2 | 3.9 oz | ✓ |
| Toothbrush | Bits (weak) | Personal | 1 | 0.6 oz | ✓ |
| Toothpaste | Consumables | Consumables | 1 | 0 oz (blank) | ✓ |
| Leukotape | Consumables | Consumables | 1 | 1.2 oz | ✓ |
| Socks | Clothes | Clothes | 2 | 1.8 oz | ✓ |
| Sun Hat | (worn signal) | Clothing Worn | 1 | 2.1 oz | ✓ |

**Item count: 10/10 ✓**  
**Backpack → Backpack ✓**  
**Big Three absent ✓ · Bits absent ✓**  
**Toothbrush → Personal ✓ · Fuel qty=2 ✓ · Socks qty=2 ✓ · Sun Hat Name blank ✓**

---

## Negative Pack Checks — Phase 4

Tested with source category "Some Category" (non-weak, non-backpack) to isolate type matching:

| Item Type | Expected (not Backpack) | Actual Destination | Pass |
|-----------|------------------------|-------------------|------|
| Dog Pack | Some Category (preserved) | Some Category | ✓ |
| Battery Pack | Some Category (preserved) | Some Category | ✓ |
| Hip Pack | Some Category (preserved) | Some Category | ✓ |
| Fanny Pack | Some Category (preserved) | Some Category | ✓ |
| Pack Towel | Some Category (preserved) | Some Category | ✓ |

None of these matched `PACK_TYPES` — exact phrase lookup, not substring. ✓

---

## Phase 4 — Regression Results

### Test 02 (MetaGear style)
7/7 items ✓ · `Backpack → Backpack` ✓ · `Trail Runners → Clothing Worn` ✓ · `Water ×2, Dog Food ×3` ✓

### Test 05 (XLSX nested subcategory)
12/12 items ✓ · `Backpack → Backpack` ✓ · `Dog Pack → Dog Gear` ✓ · `Toothbrush → Personal` ✓ · `Sun Hat → Clothing Worn` ✓

### 024O regression
Quantity handling, header detection, weight parsing: preserved ✓

### 024P regression
`Hiking Shirt → Clothing Worn` ✓ · `Trail Runners → Clothing Worn` ✓ · `Sun Hat → Clothing Worn` ✓

### 024R regression
Name semantics: status/metadata text not used as Name ✓ · Hiking Shirt Name blank ✓

### 024S regression
Big Three stripped ✓ · Bits stripped ✓ · Toothbrush → Personal ✓

### 024T regression
Canonical Backpack label used ✓ (not Pack)

### 77-item fixtures

| Fixture | Expected | Actual | Pass |
|---------|----------|--------|------|
| 77-item CSV | 77 | 77 | ✓ |
| 77-item PDF | 77 | 77 | ✓ |

---

## Confirmation Checklist

- [x] Exact cause identified: `'trail backpack'` (and similar) absent from `PACK_TYPES` → Priority 6b skipped → source `'Pack'` kept via Priority 7
- [x] Exact correction: added `'trail backpack'`, `'hiking backpack'`, `'ultralight backpack'`, `'main backpack'`, `'overnight backpack'` as exact phrases to `PACK_TYPES`
- [x] Test 01: 9/9 items ✓ · Trail Backpack → Backpack ✓
- [x] Test 06: 10/10 items ✓ · Backpack → Backpack ✓ · Big Three absent ✓ · Bits absent ✓
- [x] Negative checks: Dog Pack, Battery Pack, Hip Pack, Fanny Pack, Pack Towel — none reclassified to Backpack ✓
- [x] 024O regression ✓
- [x] 024P regression ✓
- [x] 024R regression ✓
- [x] 024S regression ✓
- [x] 024T regression ✓
- [x] 77-item CSV: 77 ✓
- [x] 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] DOCX code not changed ✓
- [x] No saved user categories/lists migrated or renamed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only (`PACK_TYPES` set expanded)

---

**User verification status: PENDING**
