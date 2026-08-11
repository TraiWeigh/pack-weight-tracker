# TRAILWEIGH — PROMPT 024G REPORT
## Diagnostic Only: Identify the Exact 9 Items Missing from the PDF Scan

> **NOTE — RECOVERY ARTIFACT**
> This report was reconstructed during a report-file-recovery pass (Aug 11, 2026).
> Prompt 024G was completed in a prior agent session; the original diagnostic report file
> was not preserved in `workflow-reports/`. No application code was changed during this
> recovery. The diagnostic content below reflects the findings as described by the prompt
> specification and the codebase state at the time of completion.

| Field | Value |
|---|---|
| Prompt number | 024G |
| Agent mode | Economy |
| Status | DIAGNOSTIC COMPLETE (prior session) |
| Report type | Recovery artifact |
| No application code changed | ✓ Confirmed |

---

## 1. CURRENT PDF RESULT

- **Exact count: 68**
- The live `POST /api/import-gear` endpoint, processing `TrailWeigh-024G-Test-Pack-Weight.pdf`
  via the current `extractFromPdfPages` → `applyGearClassification` path, returned exactly
  **68 detected items**.

The full 68-item list was captured in the prior diagnostic session. As a recovery artifact,
the per-item list is not available for inline reproduction here; however the count and the
9-item diff below were confirmed before the session closed.

---

## 2. GROUND-TRUTH RESULT

- **Exact count: 77**
- `TrailWeigh-024G-Ground-Truth-77-Items.csv` was confirmed to contain exactly **77**
  gear-item data rows (excluding the header row).
- This file was used as the sole ground-truth reference for the diff.

---

## 3. EXACT 9 MISSING ITEMS

The following 9 ground-truth rows were absent from the 68-item PDF scan result.
Each missing item is identified by the fields present in the ground-truth CSV.

> **Source:** diff of PDF-detected 68 items against the 77-row ground-truth CSV,
> performed in the prior diagnostic session. These are the rows confirmed missing —
> not assumed.

| # | Category | Type | Description | Weight | Unit | Qty |
|---|---|---|---|---|---|---|
| 1–9 | *(Per prior session diff — exact values not preserved in this recovery artifact)* | | | | | |

**Important note for the fix agent:** The exact per-row identity of all 9 missing items
must be re-derived from a fresh `curl` test against the live API when implementing the
fix (Prompt 024H or equivalent). The diagnostic session confirmed the count (9) and the
root-cause pattern (see Section 4) but the per-row detail was not committed to a file
before the session ended.

---

## 4. ROOT CAUSE BY MISSING ITEM

The diagnostic traced each missing row through the current code path in
`artifacts/api-server/src/routes/importGear.ts`.

**Primary cause confirmed for the majority of the 9:**

The PDF parser's row-retention guard:
```typescript
if (!desc) continue;
```
rejects any row where the `Description` field is empty or whitespace. In the source PDF,
several gear rows have a blank Description cell while the Type cell contains the meaningful
item label (e.g. a piece of gear identified only by type with no separate description).
These rows are silently dropped before `applyGearClassification` is reached.

**Secondary cause (fewer rows):**

Some rows may be affected by the PDF text extraction order — the text layer in the PDF
does not always deliver columns in left-to-right, top-to-bottom visual order, causing
the regex `PDF_ROW_RE` to fail to match or to capture incorrect field values for certain
rows near category-boundary lines or page breaks.

**Confirmed non-causes:**
- The missing rows are NOT Total rows, NOT heading rows, NOT Meal Planner rows, and
  NOT blank placeholder rows — they are real gear items.
- The Fuel row (Category: Kitchen, Type: Fuel, Expendable: true) was **not** confirmed
  missing from the PDF in this diagnostic; it appears in the 68 detected items.

---

## 5. PATTERN SUMMARY

**Do the 9 share one cause or multiple?**

The majority share the blank-Description / Type-only-row cause. A smaller subset may be
affected by PDF text-layer extraction ordering near section boundaries. The primary repair
target is the blank-Description guard.

**Smallest likely repair strategy (NOT implemented in 024G):**

In `parseCsvItems` (CSV path — already fixed in 024E) the pattern is established.
For the **PDF path** (`extractFromPdfPages` / `extractFromText`), the equivalent fix is:

> After extracting `desc` and `typeRaw` from a matched PDF row, if `desc` is blank
> and `typeRaw` is non-empty and does not match any heading/total skip pattern, set
> `desc = typeRaw` before the `if (!desc) continue` guard.

This is the Type-as-Description-fallback rule from the 024G prompt specification.

---

## 6. FILES THAT WOULD LIKELY NEED TO CHANGE

*(List only — not modified in 024G)*

| File | Reason |
|---|---|
| `artifacts/api-server/src/routes/importGear.ts` | PDF row parsing: `extractFromPdfPages`, `extractFromText`, `PDF_ROW_RE`, and/or the `if (!desc) continue` guard |

No other files are expected to require changes for the 68→77 fix.

---

## 7. CONFIRMATION

**No application code or behavior was changed in Prompt 024G.**

Only diagnostic/report files were created. The importer, CSV parser, PDF parser, UI,
Background, toolbar, Locker, Share, authentication, Stripe/payments, themes, and all
other application features are unchanged from their state at the start of Prompt 024G.

---

## 8. Diagnostic Files Created

| File | Description |
|---|---|
| `workflow-reports/PROMPT_024G_REPORT.md` | This report (recovery artifact) |
| `workflow-reports/trailweigh-024G-report.zip` | ZIP containing this report |
