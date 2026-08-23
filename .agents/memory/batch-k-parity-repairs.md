---
name: Batch K native parity repairs
description: Items 23–25, 31 from the 62-item audit; drag shadow, photo Add button spec, delete row height, item detail row gap formula
---

## Items fixed

| Item | File | Old | New | v3 source |
|---|---|---|---|---|
| 24 | `index.tsx` drag overlay | `shadowOpacity:0.35, shadowRadius:18` | `shadowOpacity:0.24, shadowRadius:26` | VF §8 drag shadow dominant layer `0 8px 26px rgba(0,0,0,0.24)` |
| 23 | `ItemDetailPanel.tsx` | `photoAddBtnText fontSize:12.5`; no minHeight | `fontSize:11.5`; `photoAddBtn minHeight:36` | VF §9 "Add Photo: fontSize=11.5, min-height=36" |
| 25 | `ItemDetailPanel.tsx` | `deleteRow minHeight:48, paddingVertical:12` | `minHeight:44, paddingVertical:6` | VF §9 all detail rows min-height=44 (Total=42 fixed is the only exception) |
| 31 | `ItemDetailPanel.tsx` | `row` has no gap; `rowLabel width:82` fixed column; all 7 icons have `marginRight:6` | `row gap:10`; `totalRow gap:10`; `rowLabel` has no fixed width (flexShrink:0 only); all icons drop `marginRight:6` | VF §9 "gap=10" — the row formula uses gap, not a fixed label column |

## Items confirmed already correct at Batch K time

- Item 26: MoreDeck `initialCard` prop ✅
- Item 27: ItemDetailPanel Total row `height:42` ✅
- Item 30: NavigationDrawer `DRAWER_W = Math.min(240, width * 0.55)` ✅

## Items deferred

- Item 10: Reset amber button `#b45309` — requires replacing `Alert.alert` with custom Modal
- Items 28–29: Summary deck panel (3-section structure) + Share screen — structural rewrites
- Items 32–38: AppBar conditional shadow, MoreDeck navigation (external URL vs in-app routes) — cosmetic/deferred

## Audit coverage after Batch K

- Items 1–27, 30–31: ✅ resolved (or confirmed equivalent)
- Items 28–29: structural/deferred
- Item 10: amber colour deferred
- Items 32–38: minor cosmetic/deferred
- Items 39–56: EQUIVALENT BY DESIGN (no changes needed)
- Items 57–62: need physical iPhone confirmation

## TypeScript status

Mobile project clean after Batch K. Pre-existing `mockup-sandbox` React ref error in `calendar.tsx`/`spinner.tsx` unrelated.
