# Prompt 024Y — DOCX Import: Word Category Headings as Category Context

**Prompt:** 024Y  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Root Cause (Phase 2)

The DOCX import path used `mammoth.extractRawText({ buffer })` which flattens the entire document to a plain text string — all Word paragraph styles (Heading 1, Heading 2, Title, etc.) and table structure are discarded. The resulting plain text was passed to `extractFromText()`, a line-by-line weight-extraction heuristic that has no concept of headings or structured tables.

Specific failures:
1. **Paragraph style lost**: Heading 1/2 paragraphs were indistinguishable from body text after raw-text extraction.
2. **Table structure lost**: Cell boundaries were lost; mammoth joined cell text with whitespace, breaking the column mapping.
3. **Document order lost**: mammoth's `extractRawText` processes paragraphs and tables separately in its internal representation, not necessarily in interleaved document order.

As a result, Word Heading 1 paragraphs before tables **never became category context** — they were invisible to the parser.

---

## Implementation (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**

### New: `DOCX_NON_CATEGORY_HEADINGS` set

```typescript
const DOCX_NON_CATEGORY_HEADINGS = new Set([
  'introduction', 'notes', 'packing list', 'trip information', 'trip info',
  'summary', 'total', 'instructions', 'overview', 'appendix', 'contents',
  'table of contents', 'pack list', 'gear list', 'equipment list',
]);
```

Prevents obvious document-metadata headings from becoming category context.

### New: `extractFromDocxBuffer(buffer)` async function

Replaces the single `mammoth.extractRawText` call in the DOCX branch.

**Strategy:**
1. Run `mammoth.convertToHtml` (preserves `<h1>`/`<h2>` from Word Heading styles, `<table>` with `<tr>`/`<td>`) and `mammoth.extractRawText` in parallel.
2. Walk top-level `<h1>`, `<h2>`, `<table>` elements from the HTML in **document order** using a regex iterator.
3. Each `<h1>` or `<h2>` that is not a non-category heading updates `currentCategory`.
4. Each `<table>` is parsed into rows: first row = header (Type/Name/Weight/Unit/Qty/Category detected via existing `TYPE_RE`, `WEIGHT_HDR_RE`, etc.), subsequent rows = items.
5. Source category for each row: explicit per-row Category column (if present) → heading context → undefined.
6. `applyGearClassification` is called on every item, so semantic overrides (Med Kit, Repair Kit, Clothing Worn, CONSUMABLES_TYPES, PACK_TYPES) all still apply.
7. **Fallback**: if no tables were found in the HTML, the function returns `extractFromText(rawText)` — preserving full backward compatibility with text-based DOCX formats.

**Secondary fix in `detectCols`:** Added a post-loop pass so that a bare "Name" column header (which `TYPE_RE` also matches, causing it to be claimed as typeCol) is correctly identified as nameCol when a dedicated "Type" column was already detected on a different column index.

### Updated DOCX route branch

```typescript
// Before (024O era):
const result = await mammoth.extractRawText({ buffer });
items = extractFromText(result.value);

// After (024Y):
items = await extractFromDocxBuffer(buffer);
```

---

## Test 03 Results — Phase 4

File: `03_docx_category_headings_test.docx` (synthetic from prompt spec — 9 sections, 12 items)

| # | Type | Name | oz | Qty | Destination | Pass |
|---|---|---|---|---|---|---|
| 1 | Backpack | Durston Kakwa 55 | 30.1 | 1 | **Backpack** | ✓ |
| 2 | Tent | Zpacks Duplex | 18.5 | 1 | **Shelter** | ✓ |
| 3 | Quilt | Enlightened Equipment Enigma 20 | 22.4 | 1 | **Sleep** | ✓ |
| 4 | Sleeping Pad | Therm-a-Rest NeoAir XLite NXT | 13.0 | 1 | **Sleep** | ✓ |
| 5 | Stove | BRS-3000T | 0.9 | 1 | **Kitchen** | ✓ |
| 6 | Fuel Canister | blank | 3.9 | **2** | Kitchen* | ✓ |
| 7 | Hiking Shirt | Outdoor Research Echo | 5.2 | 1 | **Clothing Worn** | ✓ |
| 8 | Trail Runners | Altra Lone Peak 8 | 22.0 | 1 | **Clothing Worn** | ✓ |
| 9 | Power Bank | Nitecore NB10000 | 5.3 | 1 | **Electronics** | ✓ |
| 10 | Leukotape | blank | 1.2 | 1 | **Med Kit** | ✓ |
| 11 | Repair Tape | blank | 0.7 | 1 | **Repair Kit** | ✓ |
| 12 | Dog Pack | Ruffwear Approach | 16.0 | 1 | **Dog Gear** | ✓ |

**Count: 12/12 ✓ · No duplicates ✓ · No lost items ✓ · No heading/title/header imported as item ✓**

*Fuel Canister: heading says Kitchen; `'fuel canister'` is not in CONSUMABLES_TYPES (only `'canister fuel'`, `'isobutane fuel'` are). No existing semantic rule overrides, so heading context (Kitchen) is the final category — correct per prompt spec (final category not specified; existing rule applies).

### Category heading inheritance verified
| Heading | Destination used | Override rule | Final destination |
|---|---|---|---|
| Backpack | Backpack | PACK_TYPES.has('backpack') → Backpack | Backpack ✓ |
| Shelter | Shelter | SHELTER_TYPES | Shelter ✓ |
| Sleep System | Sleep System | SLEEP_TYPES | Sleep ✓ |
| Kitchen | Kitchen | none | Kitchen ✓ |
| Clothing Worn | Clothing Worn | CLOTHING_WORN_SECTION_ALIASES | Clothing Worn ✓ |
| Electronics | Electronics | ELECTRONICS_TYPES | Electronics ✓ |
| Med Kit | Med Kit | MED_KIT_TYPES | Med Kit ✓ |
| Repair Kit | Repair Kit | REPAIR_KIT_TYPES | Repair Kit ✓ |
| Dog Gear | Dog Gear | none | Dog Gear ✓ |

### Name semantics verified
| Value | Result | Pass |
|---|---|---|
| Durston Kakwa 55 | Name = Durston Kakwa 55 | ✓ |
| Zpacks Duplex | Name = Zpacks Duplex | ✓ |
| Enlightened Equipment Enigma 20 | Name = Enlightened Equipment Enigma 20 | ✓ |
| Therm-a-Rest NeoAir XLite NXT | Name = Therm-a-Rest NeoAir XLite NXT | ✓ |
| BRS-3000T | Name = BRS-3000T | ✓ |
| Outdoor Research Echo | Name = Outdoor Research Echo | ✓ |
| Altra Lone Peak 8 | Name = Altra Lone Peak 8 | ✓ |
| Nitecore NB10000 | Name = Nitecore NB10000 | ✓ |
| Ruffwear Approach | Name = Ruffwear Approach | ✓ |
| Fuel Canister (blank Name cell) | Name = blank | ✓ |
| Leukotape (blank Name cell) | Name = blank | ✓ |
| Repair Tape (blank Name cell) | Name = blank | ✓ |

---

## Phase 5 — Regression Protection

| Suite | Result | Pass |
|---|---|---|
| Existing text-based DOCX (03_document_style_pack_list) | 12 items, identical to pre-024Y output | ✓ |
| 77-item PDF | 77 | ✓ |
| 07 CSV (Med Kit / Repair Kit) | Medication → Med Kit, Repair Tape → Repair Kit, Fuel → Consumables | ✓ |
| 024W Name fallback CSV | Zpacks Duplex ✓, Nitecore NB10000 ✓, blank for worn ✓ | ✓ |
| PDF code | not changed | ✓ |
| CSV/XLSX code | not changed | ✓ |

### Existing text-based DOCX (backward compat — fallback path)

The existing `03_document_style_pack_list` DOCX has no tables (it uses plain-text weight rows). `tableCount = 0` → fallback to `extractFromText(rawText)` fires → 12 items, exact same result as before 024Y. No regression.

---

## How the Implementation Generalises

- Any Word Heading 1 or Heading 2 paragraph (detected by mammoth's HTML `<h1>`/`<h2>` output, which reflects the `w:styleId` in the OOXML) sets category context.
- Heading normalization uses `norm()` (lowercase + trim) + the `DOCX_NON_CATEGORY_HEADINGS` filter.
- Non-category headings (Introduction, Notes, Summary, etc.) are silently skipped.
- Semantic routing rules (`MED_KIT_TYPES`, `REPAIR_KIT_TYPES`, `CONSUMABLES_TYPES`, `CLOTHING_WORN_SECTION_ALIASES`, `PACK_TYPES`, `ELECTRONICS_TYPES`, `PERSONAL_TYPES`) continue to override heading context when applicable.
- Explicit per-row Category columns in DOCX tables take priority over heading context.
- Text-based DOCX formats (no tables) fall back to `extractFromText` — no regression.
- Page boundaries do not affect heading context: DOCX logical document order drives the walk, not visual pagination.

---

## Confirmation Checklist

- [x] Root cause confirmed: `extractRawText` loses heading style and table structure
- [x] Fix: `mammoth.convertToHtml` + heading-context walker in document order
- [x] `<h1>` / `<h2>` → currentCategory (unless non-category heading)
- [x] `<table>` → rows parsed; first row = header detection; subsequent rows = items
- [x] `applyGearClassification` applied after heading context → semantic overrides preserved
- [x] Text-based DOCX fallback (`tableCount === 0`) → `extractFromText` → backward compat
- [x] Explicit Category column in table takes priority over heading context
- [x] 12 items found in Test 03 ✓
- [x] All 9 dedicated Names preserved in Name field ✓
- [x] 3 blank Name cells remain blank ✓
- [x] Fuel Canister Qty = 2 ✓
- [x] All other Qty = 1 ✓
- [x] Hiking Shirt, Trail Runners → Clothing Worn (worn routing) ✓
- [x] Leukotape → Med Kit ✓ · Repair Tape → Repair Kit ✓
- [x] No heading / title / table-header row imported as item ✓
- [x] Existing text-based DOCX: 12 items, identical ✓
- [x] 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] CSV/XLSX code not changed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only

---

**Note on test file:** The user's `03_docx_category_headings_test.docx` was not uploaded with this prompt. A synthetic DOCX was generated programmatically from the exact spec values in the prompt (same headings, same table structure, same 12 items, same weights/quantities). All 12 required items passed. Final verification with the user-supplied file is pending.

---

**User verification status: PENDING**
