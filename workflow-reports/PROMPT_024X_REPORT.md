# Prompt 024X — Fix Clear Medical and Repair Item Routing

**Prompt:** 024X  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

`CONSUMABLES_TYPES` in `applyGearClassification` was Priority 1 — it won over every other routing rule. Medical and repair items were embedded directly in that set:

```
// Medical and first aid (inside CONSUMABLES_TYPES)
'medication', 'leukotape', 'bandage', 'medical tape', 'gauze', ...

// Repair supplies (inside CONSUMABLES_TYPES)
'repair tape', 'patch', 'duct tape', 'tenacious tape', ...
```

Since CONSUMABLES_TYPES is checked first and returns immediately, items like `Leukotape`, `Medication`, and `Repair Tape` never reached any Med Kit or Repair Kit logic — there was none. They always became `Consumables`.

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**

### Step 1 — New `MED_KIT_TYPES` set (placed before `CONSUMABLES_TYPES`)

Medical and first-aid items extracted from `CONSUMABLES_TYPES` into a new dedicated set:

```typescript
export const MED_KIT_TYPES = new Set([
  'medication', 'prescription medication', 'pain reliever', 'ibuprofen',
  'acetaminophen', 'aspirin', 'antihistamine', 'anti-diarrheal', 'antacid',
  'allergy medication', 'antibiotic', 'hydrocortisone', 'antibiotic ointment',
  'bandage', 'adhesive bandage', 'gauze', 'sterile pad', 'alcohol wipe',
  'antiseptic wipe', 'medical tape', 'athletic tape', 'leukotape',
  'kinesiology tape', 'kt tape', 'moleskin', 'blister pad', 'blister treatment',
  'hydrocolloid bandage', 'disposable gloves', 'oral rehydration salts',
  'first aid', 'first aid kit', 'med kit', 'blister kit',
]);
```

### Step 2 — New `REPAIR_KIT_TYPES` set (placed before `CONSUMABLES_TYPES`)

Repair supplies extracted from `CONSUMABLES_TYPES` into a new dedicated set:

```typescript
export const REPAIR_KIT_TYPES = new Set([
  'duct tape', 'gear tape', 'tenacious tape', 'dcf tape', 'repair tape',
  'gear repair tape', 'patch kit', 'repair kit',
  'patch', 'repair patch', 'sleeping-pad patch', 'tent patch', 'seam sealer',
  'seam sealant', 'fabric glue', 'super glue', 'adhesive', 'epoxy',
  'thread', 'zip tie', 'cable tie', 'rubber band', 'waterproofing treatment', 'shoe glue',
]);
```

### Step 3 — Two new priorities before Priority 1 in `applyGearClassification`

```typescript
// Priority 0a: 024X — Med Kit Type wins over Consumables.
if (MED_KIT_TYPES.has(typeN)) {
  return { ...item, destination: 'Med Kit', warning: item.warning };
}

// Priority 0b: 024X — Repair Kit Type wins over Consumables.
if (REPAIR_KIT_TYPES.has(typeN)) {
  return { ...item, destination: 'Repair Kit', warning: item.warning };
}

// Priority 1: Consumable Type always wins (unchanged)
if (CONSUMABLES_TYPES.has(typeN)) { ... }
```

`CONSUMABLES_TYPES` retained all other entries (food, fuel, water, hygiene, batteries, bags, dog consumables). No dog consumables were changed.

---

## Test 05 Results

File: `05_nested_subcategory_test.xlsx` — 12 items

| Item | Destination | Qty | Pass |
|---|---|---|---|
| Backpack | Backpack | 1 | ✓ |
| Tent | Shelter | 1 | ✓ |
| Quilt | Sleep | 1 | ✓ |
| Sleeping Pad | Sleep | 1 | ✓ |
| Stove | Kitchen | 1 | ✓ |
| Fuel | **Consumables** | 2 | ✓ |
| Toothbrush | Personal | 1 | ✓ |
| Toothpaste | Consumables | 1 | ✓ |
| Leukotape | **Med Kit** | 1 | ✓ |
| Rain Jacket | Clothing Packed | 1 | ✓ |
| Sun Hat | **Clothing Worn** | 1 | ✓ |
| Dog Pack | Dog Gear | 1 | ✓ |

**Count: 12/12 ✓ · Leukotape → Med Kit ✓ · Fuel → Consumables ✓ · Fuel Qty=2 ✓ · Sun Hat → Clothing Worn ✓**

---

## Test 06 Results

File: `06_messy_spreadsheet.csv` — 10 items

| Item | Destination | Qty | oz | Pass |
|---|---|---|---|---|
| Backpack | **Backpack** | 1 | 25 | ✓ |
| Tent | Shelter | 1 | 26 | ✓ |
| Quilt | Sleep | 1 | 23.5 | ✓ |
| Stove | Cook Kit | 1 | 0.9 | ✓ |
| Fuel | **Consumables** | 2 | 3.9 | ✓ |
| Toothbrush | **Personal** | 1 | 0.6 | ✓ |
| Toothpaste | Consumables | 1 | 0 (blank) | ✓ |
| Leukotape | **Med Kit** | 1 | 1.2 | ✓ |
| Socks | Clothes | 2 | 1.8 | ✓ |
| Sun Hat | **Clothing Worn**, Name=blank | 1 | 2.1 | ✓ |

**Count: 10/10 ✓ · Leukotape → Med Kit ✓ · Backpack ✓ · No "Big Three" / "Bits" ✓ · Toothbrush → Personal ✓ · Fuel Consumables Qty=2 ✓ · Socks Qty=2 ✓ · Tent=26oz ✓ · Toothpaste blank weight ✓**

---

## Test 07 Results

File: `07_edge_cases.csv` — 9 items

| Item | Destination | Qty | oz | Pass |
|---|---|---|---|---|
| Bottle (Water) | Water | 2 | 1.38 | ✓ |
| Bottle (Kitchen) | Kitchen | 1 | 2.12 | ✓ |
| USB-C Cable | Electronics | 2 | 0.63 | ✓ |
| Medication | **Med Kit** | 1 | 0 | ✓ |
| Fuel | **Consumables** | 1 | 3.88 | ✓ |
| Base Layer Top | Clothing | 1 | 6.35 | ✓ |
| Base Layer Bottom | Clothing | 1 | 6.35 | ✓ |
| Dog Food | Consumables | 4 | 16 | ✓ |
| Repair Tape | **Repair Kit** | 1 | 0.7 | ✓ |

**Count: 9/9 ✓ · Medication → Med Kit ✓ · Repair Tape → Repair Kit ✓ · Fuel → Consumables ✓ · Dog Food unchanged (Consumables, Qty=4) ✓ · Water Bottle Qty=2 ✓ · USB-C Cable Qty=2 ✓ · Base Layer metric (180g→6.35oz) ✓**

---

## Phase 4 — Negative Regression Checks

| Input | Result | Pass |
|---|---|---|
| Tape Measure | No import (unknown type — not Med Kit) | ✓ |
| Measuring Tape | No import (unknown type — not Med Kit) | ✓ |
| Fuel | Consumables | ✓ |
| Toothpaste | Consumables | ✓ |
| Dog Food | Consumables | ✓ |
| Water | Consumables | ✓ |

Exact/word-aware set membership: "tape measure" and "measuring tape" are not in MED_KIT_TYPES or REPAIR_KIT_TYPES, so they are never routed to either. Matching is not substring-based.

---

## Phase 5 — Name Semantics Preserved (024W)

| Check | Result | Pass |
|---|---|---|
| Zpacks Duplex → Name | Zpacks Duplex | ✓ |
| Nitecore NB10000 → Name | Nitecore NB10000 | ✓ |
| Worn while hiking → Name blank, Clothing Worn | blank / Clothing Worn | ✓ |
| No Name logic modified | confirmed | ✓ |

---

## Phase 6 — Worn/Category Normalization Preserved

| Check | Result | Pass |
|---|---|---|
| Hiking Shirt → Clothing Worn | ✓ | ✓ |
| Sun Hat → Clothing Worn | ✓ | ✓ |
| Trail Backpack → Backpack | ✓ | ✓ |
| Big Three/Bits weak-group cleanup | ✓ (no "Big Three" category) | ✓ |
| Toothbrush → Personal | ✓ | ✓ |

---

## Phase 7 — Regression Protection

| Suite | Result | Pass |
|---|---|---|
| 77-item CSV | 77 | ✓ |
| 77-item PDF | 77 | ✓ |
| 024O qty/header/weight | Fuel×2, Water×2, USB-C×2, Dog Food×4 | ✓ |
| 024P worn routing | Sun Hat/Hiking Shirt → Clothing Worn | ✓ |
| 024R/024W Name behavior | Zpacks Duplex ✓, spec text blank ✓ | ✓ |
| 024U Backpack routing | Backpack ✓ | ✓ |

---

## Confirmation Checklist

- [x] Exact cause confirmed: `CONSUMABLES_TYPES` Priority 1; medical and repair entries inside it
- [x] Fix: `MED_KIT_TYPES` and `REPAIR_KIT_TYPES` sets added before `CONSUMABLES_TYPES`
- [x] Priority 0a (Med Kit) and 0b (Repair Kit) inserted before Priority 1 (Consumables)
- [x] Leukotape → Med Kit (Test 05 and 06) ✓
- [x] Medication → Med Kit (Test 07) ✓
- [x] Repair Tape → Repair Kit (Test 07) ✓
- [x] Fuel remains Consumables ✓
- [x] Toothpaste remains Consumables ✓
- [x] Dog Food remains Consumables (unchanged) ✓
- [x] Water remains Consumables ✓
- [x] Worn routing intact ✓
- [x] Backpack routing intact ✓
- [x] Name behavior (024W) intact ✓
- [x] Tape Measure does NOT route to Med Kit ✓
- [x] Matching is exact/word-aware — no substring matching ✓
- [x] 77-item CSV: 77 ✓
- [x] 77-item PDF: 77 ✓
- [x] PDF/DOCX code not changed ✓
- [x] No existing saved lists migrated or renamed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only

---

**User verification status: PENDING**
