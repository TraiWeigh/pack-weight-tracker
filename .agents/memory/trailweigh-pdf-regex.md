---
name: TrailWeigh PDF parser regex
description: Why the PDF gear row regex must use greedy name capture, not lazy.
---

## Rule

`PDF_ROW_RE` in `importGear.ts` uses a **greedy** name capture group `(.+)`, not lazy `(.+?)`.

**Why:** The gear row format is `Type Description... Weight Add [oz] [qty]`. When a
model name contains a bare number (e.g. "Durston Wapta 30"), a lazy `(.+?)` stops at
the first consecutive number pair it sees — "30 18.3" — treating the model number
"30" as the weight. Greedy `(.+)` forces the engine to backtrack from the right, so
it finds the *rightmost* consecutive digit pair before the optional `oz`/`lb` unit,
which is always the (Weight, Add) pair from the TrailWeigh spreadsheet format.

**How to apply:** Any regex that parses "name ... Weight Add [unit] [qty]" from
TrailWeigh PDF text must use greedy capture for the name field. Also: trailing
per-row summary columns ("Sleep 0.8125 lb") are absorbed by `(?:\s+[A-Za-z].*)?$`
at the end of the regex so they don't corrupt the weight capture.

## Forward-only category progression

The right-side summary table in the PDF also emits `X Backpack Description Weight Add…`
header lines (identical format to the main table headers). These appear mid-Kitchen
section and reset `currentCategory` back to "Backpack" without the guard.

**Fix:** Track `currentCategoryIndex` against `PDF_CATEGORY_ORDER`. Only update
`currentCategory` when the new candidate's index ≥ the current index — this prevents
any backwards movement through the canonical order (Backpack → Shelter → … → Miscellaneous).

## Digit-leading types (FALSE1 Gal Freezer Bag)

`PDF_CHECKBOX_RE` must allow digits after TRUE/FALSE: `(?=[\s\dA-Za-z])` not `(?=\s|[A-Z])`.
Without this, "FALSE1 Gal Freezer Bag" never matches the checkbox pattern and is silently dropped.
