# Prompt 025A — DOCX Import: Plain Bold Category Labels

**Prompt:** 025A  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Confirmed Current Failure (Phase 2)

Running `10_TrailWeigh_DOCX_Plain_Bold_Category_Labels_12_Items.docx` through the pre-025A parser produced 12 items — the table parser was active (the DOCX has tables) — but category assignment was partial:

| Item | Pre-025A destination |
|---|---|
| Backpack | Backpack ✓ (PACK_TYPES semantic rule) |
| Tent | Shelter ✓ (SHELTER_TYPES semantic rule) |
| Quilt | Sleep ✓ (SLEEP_TYPES semantic rule) |
| Sleeping Pad | Sleep ✓ (SLEEP_TYPES semantic rule) |
| Stove | **empty** — no heading context, no semantic override |
| Fuel Canister | Consumables ✓ (CONSUMABLES_TYPES) |
| Hiking Shirt | **empty** — no heading context, no worn signal in this column layout |
| Trail Runners | Clothing Packed (wrong — not Clothing Worn; no Clothing Worn heading context) |
| Power Bank | Electronics ✓ (ELECTRONICS_TYPES) |
| Leukotape | Med Kit ✓ (MED_KIT_TYPES) |
| Repair Tape | Repair Kit ✓ (REPAIR_KIT_TYPES) |
| Dog Pack | **empty** — no heading context, no semantic override |

**Root cause:** The 024Y BLOCK_RE only matched `<h1>`, `<h2>`, and `<table>`. Bold Normal-style paragraphs produce `<p><strong>text</strong></p>` in mammoth HTML — not `<h1>`/`<h2>` — so they were invisible to the walker and never set `currentCategory`.

**What mammoth emits for bold Normal paragraphs (confirmed from live HTML):**
```html
<p><strong>Backpack</strong></p>
<table>...</table>
<p><strong>Shelter</strong></p>
<table>...</table>
...
<p><strong>Trip Notes</strong></p>
<p>This paragraph is intentionally not a gear category...</p>
```

---

## Implementation (Phase 3)

**Changed file: `artifacts/api-server/src/routes/importGear.ts` only.**

### New `isAllBold(pBlock)` helper

Checks whether a `<p>` block is substantially all-bold by comparing the total visible-text length to the text length inside `<strong>` runs (≥ 85% threshold handles minor punctuation):

```typescript
function isAllBold(pBlock: string): boolean {
  const visible = innerText(pBlock);
  if (!visible) return false;
  const strongRuns = pBlock.match(/<strong(?:\s[^>]*)?>[\s\S]*?<\/strong>/gi) ?? [];
  const strongLen = strongRuns.reduce((sum, run) => sum + innerText(run).length, 0);
  return strongLen >= visible.length * 0.85;
}
```

### `pendingBoldCategory` state variable

A `string | undefined` tracking a candidate plain-bold label that has not yet been confirmed by a following gear table.

### Extended `BLOCK_RE` (now includes `<p>`)

```typescript
// Before (024Y):
const BLOCK_RE = /<(h[12]|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;

// After (025A):
const BLOCK_RE = /<(h[12]|table|p)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
```

`<p>` elements nested inside `<table>` cells are already consumed by the `<table>` match (the regex processes left-to-right; the `<table>` outer match fires first and absorbs all inner `<p>` tags), so only top-level paragraphs between tables reach the `<p>` branch.

### `<p>` block handling in the walk loop

```typescript
if (tag === 'p') {
  const visible = innerText(block);
  if (!visible) continue; // empty spacer — preserve pending

  if (isAllBold(block) && visible.length <= 50
      && !DOCX_NON_CATEGORY_HEADINGS.has(norm(visible))) {
    pendingBoldCategory = visible;   // candidate — wait for gear table
  } else {
    pendingBoldCategory = undefined; // interrupts pending
  }
  continue;
}
```

**Category safety filters applied:**
1. `isAllBold` — rejects non-bold and mixed paragraphs (body text, italic explanatory text)
2. `visible.length <= 50` — rejects long sentences (extra guard; structural check is primary)
3. `!DOCX_NON_CATEGORY_HEADINGS.has(norm(visible))` — rejects known non-gear headings (Introduction, Notes, Summary, etc.)

### `<table>` block: confirm or discard pending

When a valid gear table (detected by `detectCols` finding a Type or Weight column) is found:

```typescript
if (pendingBoldCategory !== undefined) {
  currentCategory = pendingBoldCategory;
  pendingBoldCategory = undefined;
}
```

When a heading `<h1>`/`<h2>` is found, `pendingBoldCategory` is cleared — real headings take priority.

When a non-gear-table or empty table is found, `pendingBoldCategory` is cleared.

### Precedence contract preserved

Real Heading 1/2 → clears pending, sets `currentCategory` immediately  
Plain-bold paragraph → sets `pendingBoldCategory` only  
Gear table → promotes `pendingBoldCategory` → `currentCategory`  
`applyGearClassification` → runs after, semantic rules (Consumables, Med Kit, etc.) still override heading context

---

## Test 10 Results — Phase 4

File: `10_TrailWeigh_DOCX_Plain_Bold_Category_Labels_12_Items.docx` (user-supplied)

| # | Type | Name | oz | Qty | Final category | Pass |
|---|---|---|---|---|---|---|
| 1 | Backpack | Durston Kakwa 55 | 30.1 | 1 | **Backpack** | ✓ |
| 2 | Tent | Zpacks Duplex | 18.5 | 1 | **Shelter** | ✓ |
| 3 | Quilt | Enlightened Equipment Enigma 20 | 22.4 | 1 | **Sleep** | ✓ |
| 4 | Sleeping Pad | Therm-a-Rest NeoAir XLite NXT | 13.0 | 1 | **Sleep** | ✓ |
| 5 | Stove | BRS-3000T | 0.9 | 1 | **Kitchen** | ✓ |
| 6 | Fuel Canister | blank | 3.9 | **2** | **Consumables** | ✓ |
| 7 | Hiking Shirt | Outdoor Research Echo | 5.2 | 1 | **Clothing Worn** | ✓ |
| 8 | Trail Runners | Altra Lone Peak 8 | 22.0 | 1 | **Clothing Worn** | ✓ |
| 9 | Power Bank | Nitecore NB10000 | 5.3 | 1 | **Electronics** | ✓ |
| 10 | Leukotape | blank | 1.2 | 1 | **Med Kit** | ✓ |
| 11 | Repair Tape | blank | 0.7 | 1 | **Repair Kit** | ✓ |
| 12 | Dog Pack | Ruffwear Approach | 16.0 | 1 | **Dog Gear** | ✓ |

**Count: 12/12 ✓ · No duplicates ✓ · No dropped items ✓**

Key verifications:
- Document title `<p><strong>TrailWeigh DOCX Plain Bold Category Test</strong></p>` → NOT imported as item or category ✓
- `<p><strong>Trip Notes</strong></p>` → NOT imported as item or category ✓
- `<p><em>Category labels below…</em></p>` (italic, not bold) → NOT pending ✓
- Same Kitchen heading produces Kitchen (Stove) and Consumables (Fuel Canister) ✓

---

## Phase 5 — Formal Heading Regression

File: `03_docx_category_headings_test.docx` (synthetic from 024Y spec, Heading 1 paragraphs)

**Count: 12/12 ✓ · Identical to 024Y/024Z output ✓**

All 12 items route identically to the 024Z verified state. Real Word Heading 1/2 documents are unaffected by the 025A `<p>` walker — the `<h1>` branch fires first, real headings clear any pending state, and results are identical.

---

## Phase 6 — Negative Safety Checks

Tested with synthetic DOCX files:

| Check | Setup | Result | Pass |
|---|---|---|---|
| A | `<p><strong>Trip Notes</strong></p>` → `<p>body text</p>` → gear table | Tent → Shelter (semantic); Trip Notes NOT category | ✓ |
| B | `<p><strong>Packing List</strong></p>` → `<p>body text</p>` → gear table | Tent → Shelter (semantic); Packing List NOT category | ✓ |
| C | `<p><strong>Backpack</strong></p>` → gear table | Backpack → Backpack (plain-bold category applied) | ✓ |
| D | `<p>Shelter</p>` (non-bold) → gear table | Tent → Shelter (semantic only; non-bold para NOT pending) | ✓ |

Check A and B: the body paragraph after the bold label clears `pendingBoldCategory` before the table is seen — the gear items receive only semantic routing (Tent → Shelter via SHELTER_TYPES), not the rejected label.  
Check C: pending confirmed by immediate gear table — Backpack heading context applied, then PACK_TYPES confirms destination.  
Check D: non-bold paragraph does not set `pendingBoldCategory` at all.

---

## Phase 7 — Regression Protection

| Suite | Result | Pass |
|---|---|---|
| 77-item CSV | 77 | ✓ |
| 77-item PDF | 77 | ✓ |
| 024Z Fuel Canister → Consumables (DOCX) | ✓ | ✓ |
| 024X Leukotape → Med Kit · Repair Tape → Repair Kit | ✓ | ✓ |
| 024W Names intact | ✓ | ✓ |
| Backpack routing | ✓ | ✓ |
| Worn routing (Hiking Shirt / Trail Runners → Clothing Worn) | ✓ | ✓ |
| PDF code | not changed | ✓ |
| CSV/XLSX code | not changed | ✓ |

---

## Confirmation Checklist

- [x] Root cause confirmed: `<p><strong>...</strong></p>` bold Normal paragraphs not captured by old BLOCK_RE
- [x] Fix: `<p>` added to BLOCK_RE; `isAllBold()` + `pendingBoldCategory` + structural table-confirmation
- [x] Detection criteria: all-bold (≥85% strong) + short (≤50 chars) + not DOCX_NON_CATEGORY_HEADINGS + next non-empty block is gear table
- [x] Document title NOT treated as category ✓
- [x] Trip Notes NOT treated as category ✓
- [x] 9 plain-bold category labels all correctly inherited ✓
- [x] 12/12 items ✓ · No duplicates ✓ · No lost items ✓
- [x] Fuel Canister → Consumables (024Z preserved) · Qty=2 · Name=blank ✓
- [x] Stove → Kitchen (same Kitchen heading, no semantic override) ✓
- [x] Hiking Shirt / Trail Runners → Clothing Worn ✓
- [x] Leukotape → Med Kit · Repair Tape → Repair Kit ✓
- [x] Backpack → Backpack ✓
- [x] All 9 dedicated Names intact · 3 blank Names blank ✓
- [x] Formal Heading 1/2 DOCX (03): 12/12, identical to 024Z ✓
- [x] Negative safety checks A–D all pass ✓
- [x] 77-item CSV: 77 ✓ · 77-item PDF: 77 ✓
- [x] PDF code not changed ✓
- [x] CSV/XLSX code not changed ✓
- [x] No unrelated changes made ✓
- [x] Changed files: `artifacts/api-server/src/routes/importGear.ts` only

---

**User verification status: PENDING**
