---
name: TrailWeigh PDF parser — category detection lessons
description: Documents the greedy regex rule, forward-only category guard, digit-leading type fix, and the resolveDestination normalization fix.
---

## Greedy regex in PDF_ROW_RE
Use `(.+)` (greedy), NOT `(.+?)` (lazy), for the name capture in `PDF_ROW_RE`. Lazy grabs model numbers like "Wapta 30" as the weight instead of the real trailing pair.

## Forward-only category progression
`currentCategoryIndex` prevents the right-side summary table's `X Backpack Description …` headers from resetting `currentCategory` backwards once Kitchen is reached. Only advance — never go backwards.

## Digit-leading types
`PDF_CHECKBOX_RE` uses `(?=[\s\dA-Za-z])` lookahead so `FALSE1 Gal Freezer Bag` (digit immediately after FALSE) is matched.

## Kitchen → Backpack (frontend resolveDestination bug)
**Root cause:** `resolveDestination` used exact `Array.includes()` (case-sensitive, whitespace-sensitive). If the user's stored `categoryOrder` has any case or whitespace difference vs the destination string, it falls through to `categoryOrder[0]` (Backpack) silently.

**Fix (ImportGearPanel.tsx):** `normCat()` helper normalizes both sides (trim + collapse whitespace + lowercase) before every comparison. Steps:
1. Exact match on trimmed destination
2. Case-insensitive + whitespace-normalised scan of categoryOrder
3. Alias lookup with normCat on both sides
4. **Never** fall back to `categoryOrder[0]` for a non-empty destination — return the destination as-is so validation flags it and the user can fix it manually.

**Why:** Backend confirmed correct (`destination="Kitchen"`) via server-side debug logs. The only place the match could fail was the frontend string comparison.

## Two-regex header detection
`PDF_CAT_HDR_RE` (primary, optional X, requires column keyword) + `PDF_CAT_HDR_X_RE` (fallback, X prefix only) so "X Kitchen" alone (column keywords on next line) is also matched.

## applyGearClassification NOT called for PDF items
The PDF parser returns explicit `destination` from section headers. Calling `applyGearClassification` on top would override it. Only XLSX/Numbers use it.
