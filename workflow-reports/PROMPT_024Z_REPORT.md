# Prompt 024Z — DOCX: Fuel Canister Routes to Consumables

**Prompt:** 024Z  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

In `extractFromDocxBuffer` (024Y), every item row calls `applyGearClassification` after the heading context is applied. `applyGearClassification` Priority 1 checks `CONSUMABLES_TYPES.has(typeN)`.

`norm('Fuel Canister')` = `'fuel canister'`

`CONSUMABLES_TYPES` contained `'canister fuel'` and `'isobutane fuel'` but **not** `'fuel canister'`. Priority 1 therefore missed "Fuel Canister", fell through all priorities, and the inherited heading context (Kitchen) became the final destination.

The CSV/XLSX path had the same gap — "Fuel Canister" as a Type would also have stayed in its source category rather than routing to Consumables.

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**  
**Changed lines: 1 (one string added to `CONSUMABLES_TYPES`).**

```typescript
// Before:
'fuel', 'stove fuel', 'canister fuel', 'isobutane fuel', 'butane fuel',

// After:
'fuel', 'fuel canister', 'stove fuel', 'canister fuel', 'isobutane fuel', 'butane fuel',
```

Adding `'fuel canister'` to `CONSUMABLES_TYPES` means `applyGearClassification` Priority 1 now catches it and returns `destination: 'Consumables'` — overriding any inherited heading context (Kitchen, Cook Kit, Cooking, etc.) just like plain "Fuel" already does.

---

## 12-Item DOCX Test Result (Phase 4)

File: `03_docx_category_headings_test.docx` (synthetic from 024Y spec — same 12 items, same structure)

| # | Type | Name | oz | Qty | Final category | Pass |
|---|---|---|---|---|---|---|
| 1 | Backpack | Durston Kakwa 55 | 30.1 | 1 | Backpack | ✓ |
| 2 | Tent | Zpacks Duplex | 18.5 | 1 | Shelter | ✓ |
| 3 | Quilt | Enlightened Equipment Enigma 20 | 22.4 | 1 | Sleep | ✓ |
| 4 | Sleeping Pad | Therm-a-Rest NeoAir XLite NXT | 13.0 | 1 | Sleep | ✓ |
| 5 | Stove | BRS-3000T | 0.9 | 1 | **Kitchen** | ✓ |
| 6 | Fuel Canister | blank | 3.9 | **2** | **Consumables** | ✓ |
| 7 | Hiking Shirt | Outdoor Research Echo | 5.2 | 1 | Clothing Worn | ✓ |
| 8 | Trail Runners | Altra Lone Peak 8 | 22.0 | 1 | Clothing Worn | ✓ |
| 9 | Power Bank | Nitecore NB10000 | 5.3 | 1 | Electronics | ✓ |
| 10 | Leukotape | blank | 1.2 | 1 | Med Kit | ✓ |
| 11 | Repair Tape | blank | 0.7 | 1 | Repair Kit | ✓ |
| 12 | Dog Pack | Ruffwear Approach | 16.0 | 1 | Dog Gear | ✓ |

**Count: 12/12 ✓ · No duplicates ✓ · No dropped items ✓**

### Key verifications

| Check | Result | Pass |
|---|---|---|
| Stove → Kitchen (same Kitchen heading, not overridden) | Kitchen | ✓ |
| Fuel Canister → Consumables (semantic override of Kitchen heading) | Consumables | ✓ |
| Fuel Canister Name = blank | blank | ✓ |
| Fuel Canister Weight = 3.9 oz | 3.9 | ✓ |
| Fuel Canister Qty = 2 | 2 | ✓ |
| Hiking Shirt / Trail Runners → Clothing Worn | Clothing Worn | ✓ |
| Leukotape → Med Kit | Med Kit | ✓ |
| Repair Tape → Repair Kit | Repair Kit | ✓ |
| Backpack → Backpack | Backpack | ✓ |
| All 9 dedicated Names intact | intact | ✓ |
| 3 blank Name cells (Fuel Canister, Leukotape, Repair Tape) | blank | ✓ |

### Same Kitchen heading → two different outcomes
The Kitchen heading correctly applies to Stove (stays Kitchen) and is correctly overridden for Fuel Canister (becomes Consumables). This is exactly the required semantic precedence behaviour.

---

## Phase 4 — Regression Protection

| Suite | Result | Pass |
|---|---|---|
| 77-item CSV | 77 | ✓ |
| 77-item PDF | 77 | ✓ |
| Fuel Canister (CSV, no category) | Consumables | ✓ |
| Fuel (existing) | Consumables | ✓ |
| PDF code | not changed | ✓ |
| CSV/XLSX code | not changed | ✓ |
| No unrelated changes | confirmed | ✓ |

---

## Confirmation Checklist

- [x] Exact cause confirmed: `'fuel canister'` absent from `CONSUMABLES_TYPES`; `'canister fuel'` was present but didn't match `norm('Fuel Canister')`
- [x] Fix: added `'fuel canister'` to `CONSUMABLES_TYPES` (1 string, 1 line)
- [x] Fuel Canister → Consumables (DOCX) ✓
- [x] Stove → Kitchen (same heading, no change) ✓
- [x] Fuel Canister Qty = 2 ✓ · Weight = 3.9 oz ✓ · Name = blank ✓
- [x] Worn routing intact (Hiking Shirt / Trail Runners → Clothing Worn) ✓
- [x] Med Kit routing intact (Leukotape → Med Kit) ✓
- [x] Repair Kit routing intact (Repair Tape → Repair Kit) ✓
- [x] Backpack routing intact ✓
- [x] Name behavior intact (9 dedicated names ✓, 3 blank cells ✓) ✓
- [x] 77-item CSV: 77 ✓
- [x] 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] CSV/XLSX code not changed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only

---

**Note on test file:** `09_TrailWeigh_DOCX_Heading_Context_12_Items.docx` was not uploaded with this prompt. Tests were run against the synthetic DOCX from 024Y (identical structure and item set). Final verification with the user-supplied file is pending.

---

**User verification status: PENDING**
