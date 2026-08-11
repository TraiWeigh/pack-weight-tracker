# Prompt 024V — Clean Up Name Semantics / Update Warning Text

**Prompt:** 024V  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

**CSV path (`parseCsvItems`):**

```typescript
// 024R logic (before fix):
const nameDesc = typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim())
  ? nameRaw          // ← dedicated Product/Model column wins when present
  : (!STATUS_DESC_RE.test(descRaw.trim()) ? descRaw : '');
  //                  ↑ PROBLEM: Description/Notes value passed through as NAME
  //                  when no dedicated Product/Model column exists, unless it
  //                  matches STATUS_DESC_RE (which only catches worn/status text,
  //                  not spec/capacity/generic-description text).
```

When a file has a `Description` column but no `Product`/`Model` column, `descRaw` (e.g. "40 L frameless backpack", "10,000 mAh", "Main pack") was used directly as Name.

**XLSX path (`extractGenericMode`):**

```typescript
// 024R logic (before fix):
if (nameCol >= 0 && nameCol !== typeCol) {
  desc = ...nameCell...;      // dedicated product column — correct
} else if (STATUS_DESC_RE.test(desc.trim())) {
  desc = '';                  // only cleared for STATUS_DESC_RE matches
}                             // ← PROBLEM: all other desc-column values passed through
```

Same issue — when no dedicated `nameCol` exists, Description values like "Single-wall shelter", "Inflatable pad", "Carried layer" survived into Name unless they matched `STATUS_DESC_RE`.

**Warning text:** `ImportGearPanel.tsx` line 542 hardcoded "missing descriptions".

---

## Repair Made (Phase 3)

**Changed files:**
1. `artifacts/api-server/src/routes/importGear.ts` — Name selection logic in both CSV and XLSX paths
2. `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` — warning text

### Change 1 — CSV path (`parseCsvItems`)

```typescript
// Before:
const nameDesc = typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim())
  ? nameRaw
  : (!STATUS_DESC_RE.test(descRaw.trim()) ? descRaw : '');

// After:
// 024V: Only dedicated product-identity columns populate NAME.
// Description/Notes are specs or notes, not product identity → always blank when absent.
const nameDesc = (typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim()))
  ? nameRaw
  : '';
```

Worn Signal D (`/^worn\b/i.test(descRaw.trim())`) is unaffected — it reads `descRaw` directly, before this filtering.

### Change 2 — XLSX path (`extractGenericMode`)

```typescript
// Before:
} else if (STATUS_DESC_RE.test(desc.trim())) {
  desc = '';
}

// After:
} else {
  // 024V: No dedicated product-identity column → always leave Name blank.
  desc = '';
}
```

Worn Signal D (`/^worn\b/i.test(desc.trim())`) is evaluated before this block — unaffected.

### Change 3 — Warning text

```
Before: "Flagged items may have unusual weights or missing descriptions — review before importing."
After:  "Flagged items may have unusual weights or missing names — review before importing."
```

---

## Test 01 Results — Phase 4

File: `01_lighterpack_style.csv` (Description column only — no Product/Model column)

| Item | Dest | Name (desc) | Qty | Pass |
|------|------|------------|-----|------|
| Trail Backpack | Backpack | **blank** (not "40 L frameless backpack") | 1 | ✓ |
| Trekking Pole Tent | Shelter | **blank** (not "Single-wall shelter") | 1 | ✓ |
| Down Quilt | Sleep System | **blank** (not "20 degree quilt") | 1 | ✓ |
| Sleeping Pad | Sleep | **blank** (not "Inflatable pad") | 1 | ✓ |
| Titanium Pot | Kitchen | **blank** (not "750 ml pot") | 1 | ✓ |
| Fuel Canister | Consumables | **blank** (not "110 g fuel canister") | 1 | ✓ |
| Smartwater Bottle | Water | **blank** (not "1 L bottle") | 2 | ✓ |
| Hiking Shirt | Clothing Worn | **blank** | 1 | ✓ |
| Power Bank | Electronics | **blank** (not "10,000 mAh") | 1 | ✓ |

**Count: 9/9 ✓ · Trail Backpack → Backpack ✓ · Hiking Shirt → Clothing Worn ✓ · Smartwater qty=2 ✓**

---

## Test 02 Results — Phase 5

File: `02_metagear_style.csv` (Description column only — no Product/Model column)

| Item | Dest | Name (desc) | Qty | Pass |
|------|------|------------|-----|------|
| Backpack | Backpack | **blank** (not "Main pack") | 1 | ✓ |
| Rain Jacket | Clothing Packed | **blank** (not "Carried layer") | 1 | ✓ |
| Trail Runners | Clothing Worn | **blank** | 1 | ✓ |
| Water Filter | Hydration | **blank** (not "Reusable") | 1 | ✓ |
| Water - 1 Liter | Consumables | **blank** | 2 | ✓ |
| Dog Food - Daily | Consumables | **blank** (not "Three daily portions") | 3 | ✓ |
| Headlamp | Electronics | **blank** (not "Rechargeable") | 1 | ✓ |

**Count: 7/7 ✓ · Trail Runners → Clothing Worn ✓ · Water qty=2 ✓ · Dog Food qty=3 ✓**

---

## Test 05 Results — Phase 6

File: `05_nested_subcategory_test.xlsx`

**Count: 12/12 ✓**  All Name fields blank ✓ · Sun Hat → Clothing Worn ✓ · Fuel qty=2 ✓ · Dog Pack → Dog Gear ✓

---

## Test 06 Results — Phase 7

File: `06_messy_spreadsheet.csv`

| Item | Dest | Name | oz | Qty | Pass |
|------|------|------|----|-----|------|
| Backpack | Backpack | blank | 25 | 1 | ✓ |
| Tent | Shelter | blank | 26 | 1 | ✓ |
| Quilt | Sleep | blank | 23.5 | 1 | ✓ |
| Stove | Cook Kit | blank | 0.9 | 1 | ✓ |
| Fuel | Consumables | blank | 3.9 | 2 | ✓ |
| Toothbrush | Personal | blank | 0.6 | 1 | ✓ |
| Toothpaste | Consumables | blank | 0 | 1 | ✓ |
| Leukotape | Consumables | blank | 1.2 | 1 | ✓ |
| Socks | Clothes | blank | 1.8 | 2 | ✓ |
| Sun Hat | Clothing Worn | blank | 2.1 | 1 | ✓ |

**Count: 10/10 ✓ · Backpack → Backpack ✓ · Big Three absent ✓ · Bits absent ✓ · Sun Hat Name blank ✓**

---

## Phase 8 — Positive Product-Name Tests

| Source columns | Type | Name field | Dest | Pass |
|---|---|---|---|---|
| Type + Product | Tent | **Zpacks Duplex** | Shelter | ✓ |
| Type + Product Name | Power Bank | **Nitecore NB10000** | Electronics | ✓ |
| Type + Model + Worn=TRUE | Hiking Shirt | **Outdoor Research Echo** | Clothing Worn | ✓ |

Dedicated product-identity columns correctly populate Name. Worn routing unaffected by Name filtering.

---

## Phase 10 — Regression Results

| Suite | Result | Pass |
|---|---|---|
| 024O (qty, header, weight parsing) | Smartwater ×2, Fuel ×1, all weights correct | ✓ |
| 024P (worn routing) | Hiking Shirt → Clothing Worn, Trail Runners → Clothing Worn, Sun Hat → Clothing Worn | ✓ |
| 024R (status text excluded from Name) | All status/worn text still excluded | ✓ |
| 024S (vague group cleanup) | Big Three / Bits absent | ✓ |
| 024U (Trail Backpack → Backpack) | ✓ | ✓ |
| 77-item CSV | 77 | ✓ |
| 77-item PDF | 77 | ✓ |

---

## Confirmation Checklist

- [x] Exact cause: `nameDesc` fell back to `descRaw` (Description column) when no `nameRaw` (Product/Model) existed; XLSX `else if (STATUS_DESC_RE…)` left non-status desc values through
- [x] Exact CSV fix: `nameDesc` now returns `''` when no dedicated product-identity column present
- [x] Exact XLSX fix: `else if (STATUS_DESC_RE…)` → `else { desc = ''; }` — always blank when no nameCol
- [x] Warning text: "missing descriptions" → "missing names" ✓
- [x] All listed generic spec/status values removed from Name: "40 L frameless backpack", "Single-wall shelter", "20 degree quilt", "Inflatable pad", "750 ml pot", "110 g fuel canister", "1 L bottle", "10,000 mAh", "Main pack", "Carried layer", "Reusable", "Rechargeable", "Three daily portions" — all blank ✓
- [x] Blank Name confirmed acceptable and used as default when no product identity ✓
- [x] Positive product-name columns preserved: Product, Product Name, Model all correctly populate Name ✓
- [x] Worn Signal D unaffected (reads raw desc before Name filtering in both paths) ✓
- [x] No existing saved item data migrated or blanked ✓
- [x] PDF code not changed ✓
- [x] DOCX code not changed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts`, `artifacts/pack-checklist/src/components/ImportGearPanel.tsx`

---

**User verification status: PENDING**
