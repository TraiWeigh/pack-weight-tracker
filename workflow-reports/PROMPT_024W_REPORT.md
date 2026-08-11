# Prompt 024W — Restore Conservative Description → Name Fallback

**Prompt:** 024W  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

024V changed the CSV path `nameDesc` calculation to:

```typescript
const nameDesc = (typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim()))
  ? nameRaw
  : '';   // ← always blank when no dedicated Product/Model column — too strict
```

And the XLSX path to:

```typescript
} else {
  desc = '';   // ← always blank when no nameCol — too strict
}
```

When a file has a `Description` column but no `Product`/`Model` column, the description was always blanked — including real product names like "Zpacks Duplex" and "Nitecore NB10000".

---

## Repair Made (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**  
Added `isLikelyProductIdentityFallback()` plus two supporting constants, then wired it into both import paths.

### New constants and function (placed immediately after `STATUS_DESC_RE`)

```typescript
/** Measurement unit adjacent to a digit — strong spec/capacity signal. */
const SPEC_UNIT_IN_DESC_RE = /\d\s*(?:oz|g|kg|lb|lbs|ml|mAh|Ah|mm|cm|inch|inches|ft|degree|°|kcal|cal\b)|\d\s*[lL]\b/i;

/** Common generic first-word patterns — product attributes/descriptions, not brand identity. */
const GENERIC_LEAD_DESC_RE = /^(?:single|inflatable|main|three|small|canister|travel|
collapsible|folding|lightweight|budget|standard|regular|synthetic|ripstop|rechargeable|
expendable|spare|down\b)/i;

/** Alphanumeric model tokens: NB10000, inReach, NeoAir, XLite, NXT, Kakwa55 */
const MODEL_TOKEN_RE = /[A-Za-z][A-Za-z]*\d+[A-Za-z0-9]*|[a-z][A-Z][a-zA-Z]*|[A-Z]{2,}[a-z][a-zA-Z]*/;

function isLikelyProductIdentityFallback(desc: string): boolean {
  if (!desc || desc.length < 4) return false;
  if (/^\d/.test(desc)) return false;           // starts with digit → spec
  if (SPEC_UNIT_IN_DESC_RE.test(desc)) return false;  // measurement unit → spec
  if (STATUS_DESC_RE.test(desc)) return false;  // known status/metadata
  if (GENERIC_LEAD_DESC_RE.test(desc)) return false;  // generic first word
  if (MODEL_TOKEN_RE.test(desc)) return true;   // model number / camelCase token
  // "Brand Model" — two words both starting with uppercase
  const tokens = desc.trim().split(/\s+/);
  if (tokens.length >= 2 && /^[A-Z]/.test(tokens[0]) && /^[A-Z]/.test(tokens[1]))
    return true;
  return false;  // conservative default
}
```

### CSV path update (`parseCsvItems`)

```typescript
// Before (024V):
const nameDesc = (typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim()))
  ? nameRaw : '';

// After (024W):
const nameDesc = (typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim()))
  ? nameRaw
  : isLikelyProductIdentityFallback(descRaw.trim())
    ? descRaw.trim()
    : '';
```

### XLSX path update (`extractGenericMode`)

```typescript
// Before (024V):
} else { desc = ''; }

// After (024W):
} else { desc = isLikelyProductIdentityFallback(desc) ? desc : ''; }
```

Worn Signal D reads `desc` before these filters in both paths — unaffected.

---

## Test 08 Results — Phase 3/4

File: `08_description_as_name_fallback.csv` (created from prompt spec — Type+Description+Worn+Weight+Unit)

| Type | Description | Name result | Dest | oz | Pass |
|------|-------------|-------------|------|----|------|
| Tent | Zpacks Duplex | **Zpacks Duplex** | Shelter | 18.5 | ✓ |
| Power Bank | Nitecore NB10000 | **Nitecore NB10000** | Electronics | 5.3 | ✓ |
| Hiking Shirt | Worn while hiking (Worn=TRUE) | **blank** | Clothing Worn | 5.2 | ✓ |

**Count: 3/3 ✓ · No items lost ✓**

---

## Test 01 Regression — all NAME blank, all generic specs rejected

File: `01_lighterpack_style.csv`

| Item | Name | Dest | Qty | Pass |
|------|------|------|-----|------|
| Trail Backpack | blank (not "40 L frameless backpack") | Backpack | 1 | ✓ |
| Trekking Pole Tent | blank (not "Single-wall shelter") | Shelter | 1 | ✓ |
| Down Quilt | blank (not "20 degree quilt") | Sleep System | 1 | ✓ |
| Sleeping Pad | blank (not "Inflatable pad") | Sleep | 1 | ✓ |
| Titanium Pot | blank (not "750 ml pot") | Kitchen | 1 | ✓ |
| Fuel Canister | blank (not "110 g fuel canister") | Consumables | 1 | ✓ |
| Smartwater Bottle | blank (not "1 L bottle") | Water | 2 | ✓ |
| Hiking Shirt | blank (not "Worn while hiking") | Clothing Worn | 1 | ✓ |
| Power Bank | blank (not "10,000 mAh") | Electronics | 1 | ✓ |

**Count: 9/9 ✓ · Trail Backpack → Backpack ✓ · Hiking Shirt → Clothing Worn ✓ · Smartwater qty=2 ✓**

---

## Test 02 Regression — all NAME blank, all generic descriptions rejected

File: `02_metagear_style.csv`

| Item | Name | Dest | Qty | Pass |
|------|------|------|-----|------|
| Backpack | blank (not "Main pack") | Backpack | 1 | ✓ |
| Rain Jacket | blank (not "Carried layer") | Clothing Packed | 1 | ✓ |
| Trail Runners | blank | Clothing Worn | 1 | ✓ |
| Water Filter | blank (not "Reusable") | Hydration | 1 | ✓ |
| Water - 1 Liter | blank | Consumables | 2 | ✓ |
| Dog Food - Daily | blank (not "Three daily portions") | Consumables | 3 | ✓ |
| Headlamp | blank (not "Rechargeable") | Electronics | 1 | ✓ |

**Count: 7/7 ✓ · Trail Runners → Clothing Worn ✓ · Water qty=2 ✓ · Dog Food qty=3 ✓**

---

## Positive Synthetic Tests — product names accepted

| Description value | Accepted as Name | Pass |
|---|---|---|
| Zpacks Duplex | Zpacks Duplex | ✓ |
| Nitecore NB10000 | Nitecore NB10000 | ✓ |
| Durston Kakwa 55 | Durston Kakwa 55 | ✓ |
| Altra Lone Peak 8 | Altra Lone Peak 8 | ✓ |
| Garmin inReach Mini 2 | Garmin inReach Mini 2 | ✓ |

Accept mechanism: Title Case (Brand + Model) for Zpacks/Durston/Altra; MODEL_TOKEN_RE for Nitecore NB10000 (alphanumeric), Garmin inReach (camelCase).

---

## Negative Synthetic Tests — generic/spec values rejected

| Description value | Result | Pass |
|---|---|---|
| 40 L frameless backpack | blank | ✓ (starts with digit) |
| 10,000 mAh | blank | ✓ (starts with digit) |
| Main pack | blank | ✓ (GENERIC_LEAD_DESC_RE "main") |
| Rechargeable | blank | ✓ (GENERIC_LEAD_DESC_RE "rechargeable") |
| Worn while hiking | blank | ✓ (STATUS_DESC_RE "worn") |
| 1 L bottle | blank | ✓ (starts with digit) |
| Single-wall shelter | blank | ✓ (GENERIC_LEAD_DESC_RE "single") |

---

## Phase 4 — Regression Protection

| Suite | Result | Pass |
|---|---|---|
| Test 05 XLSX (12 items) | all correct, Dog Pack → Dog Gear, Sun Hat → Clothing Worn | ✓ |
| 024O (qty/header/weight) | Smartwater ×2, Fuel ×1, all weights correct | ✓ |
| 024P (worn routing) | Hiking Shirt/Trail Runners/Sun Hat → Clothing Worn | ✓ |
| 024R (status text excluded) | "Worn while hiking" → blank ✓ | ✓ |
| 024U (Trail Backpack → Backpack) | ✓ | ✓ |
| 024V warning text ("missing names") | preserved — not reverted | ✓ |
| 77-item CSV | 77 | ✓ |
| 77-item PDF | 77 | ✓ |

---

## How the Heuristic Generalises

The function does not hard-code brand names. Accept logic:
1. **Model token** (letters+digits merged, or internal CamelCase) → accepts any alphanumeric model number
2. **Title Case pair** → accepts any two-word "Brand Model" pattern

Reject logic layers (applied first):
1. Starts with digit → spec/capacity
2. Measurement unit adjacent to digit → spec
3. STATUS_DESC_RE → existing worn/status patterns
4. GENERIC_LEAD_DESC_RE → common generic adjectives/nouns at start

Result: generalises conservatively to future brand/model names without needing a database.

---

## Confirmation Checklist

- [x] Exact 024V over-filtering cause: `nameDesc` always `''` when no `nameRaw`; XLSX always `desc = ''` in `else` branch
- [x] Heuristic implemented: `isLikelyProductIdentityFallback()` with SPEC_UNIT_IN_DESC_RE, GENERIC_LEAD_DESC_RE, MODEL_TOKEN_RE
- [x] Zpacks Duplex → Name ✓
- [x] Nitecore NB10000 → Name ✓
- [x] Worn while hiking → Name blank + Clothing Worn ✓
- [x] All 024V rejected values still rejected ✓
- [x] Blank Name preserved as acceptable default ✓
- [x] 024V "missing names" warning NOT reverted ✓
- [x] 024O/024P/024R/024U/024V regressions all pass ✓
- [x] 77-item CSV: 77 ✓ · 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] DOCX code not changed ✓
- [x] No existing saved item data migrated or blanked ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only

---

**User verification status: PENDING**
