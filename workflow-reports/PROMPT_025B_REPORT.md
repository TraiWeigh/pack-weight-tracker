# Prompt 025B — DOCX Import: Bullet-List Gear Items Under Category Headings

**Prompt:** 025B  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Phase 2 — Confirmed Current Failure (Before Fix)

Running `11_TrailWeigh_DOCX_Bullet_List_12_Items.docx` through the pre-025B parser returned 12 items — but with wrong types, names, and null destinations. These came from the `extractFromText()` fallback, not from bullet parsing.

**How Word List Bullet paragraphs appear in mammoth HTML:**

mammoth emits Word List Bullet paragraphs as `<ul>/<li>` elements:

```html
<h1>Trip Notes</h1>
<ul><li>Remember permits</li><li>Check weather before departure</li></ul>
<h1>Backpack</h1>
<ul><li>Backpack - Durston Kakwa 55 - 30.1 oz</li></ul>
<h1>Shelter</h1>
<ul><li>Tent - Zpacks Duplex - 18.5 oz</li></ul>
...
```

**Why items were wrong pre-fix:**

1. BLOCK_RE only matched `<h1>`, `<h2>`, `<table>`, `<p>` — `<ul>` was invisible.
2. This DOCX has zero tables → `tableCount === 0` → the fallback `return extractFromText(rawResult.value)` fired.
3. `extractFromText()` parsed the raw plain text (without structure) and produced mangled results — wrong Types, Names with trailing ` -`, null destinations.

**Pre-fix sample output (from extractFromText fallback):**

```
[Backpack] name=[Durston Kakwa 55 -] -> None qty=1 oz=30.1
[Repair] name=[Tape -] -> None qty=1 oz=0.7
[Fuel Canister] name=[- Qty 2] -> None qty=1
```

---

## Phase 3 — Implementation

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**

### New `parseBulletItem()` helper

Added inside `extractFromDocxBuffer`. Parses one `<li>` text string into gear fields using a right-to-left, weight-anchored approach:

```
Supported formats (separator is spaced " - " only, not bare "-"):
  TYPE - NAME - WEIGHT            → qty 1
  TYPE - WEIGHT                   → qty 1, name blank
  TYPE - NAME - WEIGHT - Qty N    → qty N
  TYPE - WEIGHT - Qty N           → qty N, name blank
```

**Parsing order (right-side-anchored):**

1. Strip trailing `Qty N` segment via `/^qty\s*(\d+)$/i`
2. Find right-most weight segment via `/^(\d+\.?\d*)\s*(oz|g|lbs?|kg|pounds?)$/i` — the **entire** segment must be weight+unit (not just contain weight text), so `"Remember permits"` and `"Check weather before departure"` never match → `null` returned.
3. `type` = first segment; `name` = middle segments joined with ` - `
4. If no weight found OR weight is the first segment (no Type) → `null`

**Internal hyphens preserved:** split is on spaced ` - ` only, so `Therm-a-Rest` and `BRS-3000T` are never split.

**En/em dash normalization:** ` – ` and ` — ` normalized to ` - ` before splitting (trivial, low risk).

### Extended `BLOCK_RE` (now includes `<ul>`)

```typescript
// Before (025A):
const BLOCK_RE = /<(h[12]|table|p)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;

// After (025B):
const BLOCK_RE = /<(h[12]|table|ul|p)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
```

### `<ul>` handler in the walk loop

```typescript
if (tag === 'ul') {
  if (!currentCategory) continue; // no category context → skip all bullets

  const liRe = /<li(?:\s[^>]*)?>[\s\S]*?<\/li>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = liRe.exec(block)) !== null) {
    const liText = innerText(lm[0]).trim();
    const parsed = parseBulletItem(liText);
    if (parsed === null) continue; // no weight → not a gear bullet
    const raw: ExtractedItem = { sub: parsed.type, desc: parsed.name,
      weightOz: parsed.weightOz, qty: parsed.qty,
      destination: currentCategory, warning: false };
    items.push(applyGearClassification(raw));
  }
  continue;
}
```

**Trip Notes safety:** "Remember permits" and "Check weather before departure" appear under the "Trip Notes" Heading 1 heading. `currentCategory` IS set to "Trip Notes" — but `parseBulletItem` returns `null` for both because neither has a parseable weight segment. ✓

### Fixed fallback condition

```typescript
// Before:
if (tableCount === 0) { return extractFromText(rawResult.value); }

// After:
if (tableCount === 0 && items.length === 0) { return extractFromText(rawResult.value); }
```

Bullet-list DOCXs have `tableCount === 0` but populate `items[]` via the `<ul>` handler. Without this fix, the fallback overwrote the correctly parsed items.

---

## Phase 4 — Test 11 Results

File: `11_TrailWeigh_DOCX_Bullet_List_12_Items.docx` (user-supplied)

| # | Source heading | Bullet text | Type | Name | oz | Qty | Final category | Pass |
|---|---|---|---|---|---|---|---|---|
| 1 | Backpack | Backpack - Durston Kakwa 55 - 30.1 oz | Backpack | Durston Kakwa 55 | 30.1 | 1 | **Backpack** | ✓ |
| 2 | Shelter | Tent - Zpacks Duplex - 18.5 oz | Tent | Zpacks Duplex | 18.5 | 1 | **Shelter** | ✓ |
| 3 | Sleep System | Quilt - Enlightened Equipment Enigma 20 - 22.4 oz | Quilt | Enlightened Equipment Enigma 20 | 22.4 | 1 | **Sleep** | ✓ |
| 4 | Sleep System | Sleeping Pad - Therm-a-Rest NeoAir XLite NXT - 13.0 oz | Sleeping Pad | **Therm-a-Rest NeoAir XLite NXT** | 13.0 | 1 | **Sleep** | ✓ |
| 5 | Kitchen | Stove - BRS-3000T - 0.9 oz | Stove | **BRS-3000T** | 0.9 | 1 | **Kitchen** | ✓ |
| 6 | Kitchen | Fuel Canister - 3.9 oz - Qty 2 | Fuel Canister | blank | 3.9 | **2** | **Consumables** | ✓ |
| 7 | Clothing Worn | Hiking Shirt - Outdoor Research Echo - 5.2 oz | Hiking Shirt | Outdoor Research Echo | 5.2 | 1 | **Clothing Worn** | ✓ |
| 8 | Clothing Worn | Trail Runners - Altra Lone Peak 8 - 22.0 oz | Trail Runners | Altra Lone Peak 8 | 22.0 | 1 | **Clothing Worn** | ✓ |
| 9 | Electronics | Power Bank - Nitecore NB10000 - 5.3 oz | Power Bank | Nitecore NB10000 | 5.3 | 1 | **Electronics** | ✓ |
| 10 | Med Kit | Leukotape - 1.2 oz | Leukotape | blank | 1.2 | 1 | **Med Kit** | ✓ |
| 11 | Repair Kit | Repair Tape - 0.7 oz | Repair Tape | blank | 0.7 | 1 | **Repair Kit** | ✓ |
| 12 | Dog Gear | Dog Pack - Ruffwear Approach - 16.0 oz | Dog Pack | Ruffwear Approach | 16.0 | 1 | **Dog Gear** | ✓ |

**Count: 12/12 ✓ · No duplicates ✓ · No dropped items ✓**

Key verifications:
- Trip Notes bullets ("Remember permits", "Check weather before departure") → NOT imported ✓
- Document title → NOT imported ✓
- Therm-a-Rest NeoAir XLite NXT — internal hyphens preserved ✓
- BRS-3000T — internal hyphen preserved ✓
- Fuel Canister → Consumables (024Z semantic override preserved) · Qty = 2 ✓

---

## Phase 5 — Existing DOCX Regressions

| File | Expected | Got | Pass |
|---|---|---|---|
| Test 09 — formal Heading 1/2 + tables (12 items) | 12 | 12 | ✓ |
| Test 10 — plain bold labels + tables (12 items) | 12 | 12 | ✓ |

Stove → Kitchen ✓ · Fuel Canister → Consumables ✓ · Heating Shirt → Clothing Worn ✓  
All 12 types/names/categories identical to 024Z/025A verified output.

---

## Phase 6 — Negative Parser Tests

All four behaviors are directly confirmed by Test 11 itself (the user-supplied DOCX):

| Check | Evidence in Test 11 | Pass |
|---|---|---|
| A — "Remember permits" ignored (no weight) | Test 11 COUNT=12; neither Trip Notes bullet appears | ✓ |
| B — "Check weather before departure" ignored (no weight) | Test 11 COUNT=12; neither Trip Notes bullet appears | ✓ |
| C — "BRS-3000T - 0.9 oz" (model-only Type) | Not in Test 11; acceptable to import or ignore per prompt | N/A |
| D — Therm-a-Rest NeoAir XLite NXT internal hyphens | Item 4: name=[Therm-a-Rest NeoAir XLite NXT] ✓ | ✓ |
| E — Fuel Canister - 3.9 oz - Qty 2 | Item 6: qty=2, name=blank ✓ | ✓ |

**Key mechanism:** `parseBulletItem` returns `null` when no weight segment is found (entire segment must match `/<number> <unit>/`). "Remember permits" and "Check weather before departure" contain no such segment → silently dropped. Gear items in the same `<ul>` continue parsing normally.

Note: Synthetic DOCX files created for isolated checks did not produce proper `<h1>` headings in mammoth (Python-generated style definitions weren't recognized), so those fell back to `extractFromText`. Test 11 (the real user DOCX) is the authoritative confirmation of all four behaviors.

---

## Phase 7 — Regression Protection

| Suite | Result | Pass |
|---|---|---|
| 77-item CSV | 77 | ✓ |
| 77-item PDF | 77 | ✓ |
| 024W Name semantics (names intact) | ✓ | ✓ |
| 024X Med Kit / Repair Kit routing | ✓ | ✓ |
| 024Z Fuel Canister → Consumables | ✓ | ✓ |
| 025A plain-bold table support | ✓ | ✓ |
| PDF code | not changed | ✓ |
| CSV/XLSX code | not changed | ✓ |

---

## How Word List Bullet Paragraphs Are Represented

mammoth converts Word List Bullet paragraphs to `<ul><li>text</li></ul>` HTML — a single `<ul>` block per consecutive group of bullets under the same heading. Heading 1/2 paragraphs remain `<h1>`/`<h2>`. There are no nested `<p>` elements inside `<li>` for simple text bullets.

The separator character in the test file is ASCII space-hyphen-space (` - `, U+0020 U+002D U+0020) — confirmed via hex inspection of the mammoth HTML output.

---

## Confirmation Checklist

- [x] Root cause confirmed: `<ul>` not in BLOCK_RE + `tableCount === 0` fallback overwrote bullet items
- [x] Fix: `<ul>` added to BLOCK_RE; `parseBulletItem()` + `<ul>` handler; fallback condition tightened
- [x] Safety gate: `parseBulletItem` returns null when no weight found → "Remember permits" and "Check weather before departure" ignored ✓
- [x] Category gate: `<ul>` handler only runs when `currentCategory` is set ✓
- [x] 12/12 items ✓ · No duplicates ✓ · No lost items ✓
- [x] Trip Notes bullets (both) NOT imported ✓
- [x] Document title NOT imported ✓
- [x] Therm-a-Rest NeoAir XLite NXT — hyphen preserved ✓
- [x] BRS-3000T — hyphen preserved ✓
- [x] Fuel Canister → Consumables (024Z preserved) · Qty = 2 ✓
- [x] Stove → Kitchen (no semantic override) ✓
- [x] Hiking Shirt / Trail Runners → Clothing Worn ✓
- [x] Leukotape → Med Kit · Repair Tape → Repair Kit ✓
- [x] All 9 dedicated Names intact · 3 blank Names blank ✓
- [x] 025A plain-bold table DOCX (Test 10): 12/12 ✓
- [x] Formal Heading DOCX (Test 09): 12/12 ✓
- [x] Negative safety checks A, B, D, E all pass ✓
- [x] 77-item CSV: 77 ✓ · 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] CSV/XLSX code not changed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only

---

**User verification status: PENDING**
