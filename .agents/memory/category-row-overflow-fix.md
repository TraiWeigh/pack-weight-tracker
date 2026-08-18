---
name: Category row responsive overflow fix
description: Three-property fix for iOS Safari WebKit grid-in-flex intrinsic sizing bug that clipped right-side weights on narrow phones.
---

## Rule
Any CSS Grid placed inside a `flex:1, minWidth:0` flex child MUST also have `width:'100%'` explicitly declared. Without it, iOS Safari WebKit sizes the grid's tracks using max-content intrinsic sizing rather than the flex-allocated width, causing the row to overflow the viewport and clip right-side content.

**Why:** iOS Safari WebKit bug: when flex-basis is 0 (from `flex:1` shorthand = `flex:1 1 0%`), the grid layout algorithm runs before flex-grow is applied, using unconstrained content-based sizing. An explicit `width` declaration forces WebKit to resolve the grid's containing block from the real rendered size.

**How to apply:**
- Add `width:'100%'` to any `display:'grid'` container that lives inside `flex:1, minWidth:0`
- Cap the `auto`-sized grid column with a `maxWidth` + `overflow:'hidden'` + `textOverflow:'ellipsis'` on the cell itself (belt-and-suspenders; matches what the location view already does on col-2)
- Add `overflow:'hidden'` to the outer centering div (line 3625) so box shadows on `data-cat` cards cannot inflate the centering div's layout width, which would corrupt `tw-v3-root`'s `width:100%` resolution

## Applied fix (MobileFunctionalV3.tsx)
- Line 3625: outer centering div → `overflow:'hidden'` added
- Line 4041: category content grid → `width:'100%'` added alongside `flex:1, minWidth:0`
- Line 4080: weight cell (col-2) → `maxWidth:96, overflow:'hidden', textOverflow:'ellipsis'` added

## Verification
Confirmed at 375px (iPhone SE) and 393px (iPhone Pro): all six category weights ("72.50 oz", "50.70 oz", etc.) fully visible with no right-edge clipping.

## Outstanding gap
The location view content grid (line 4654-4661) uses the same `flex:1, minWidth:0, display:grid` structure WITHOUT `width:'100%'`. Its col-2 has `maxWidth:130, overflow:hidden` (defensive), which mitigates the visible symptom but does not fix the underlying WebKit bug. That grid also needs `width:'100%'`.
