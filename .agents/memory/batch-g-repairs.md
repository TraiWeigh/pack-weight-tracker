---
name: Batch G native parity repairs
description: 12 confirmed parity defects repaired in the G-series pass; F-01–F-20 final status; regression notes.
---

# Batch G Native Parity Repairs

**Why:** After the F-01–F-20 overnight repair pass, a comprehensive code audit found 51 parity gaps (D-01–D-71). Batch G addressed the highest-value Replit-verifiable subset. This file records final status for future reference.

## F-01–F-20 Final Status

| # | Defect | Status |
|---|--------|--------|
| F-01 | NavigationDrawer close spring before unmount | 🔲 NOT YET TESTED (device) |
| F-02 | Handedness moves hamburger | ✅ REPLIT-CONFIRMED |
| F-03 | previewChecked resets on close | ✅ REPLIT-CONFIRMED |
| F-04 | Preview uses formatDisplayWeight | ✅ REPLIT-CONFIRMED |
| F-05 | ItemPhotoSheet auto-launch picker | 🔲 NOT YET TESTED (device) |
| F-06 | Blank item cleanup on cancel | 🔲 NOT YET TESTED (device) |
| F-07 | ItemRow weight formatting (oz/g) | ✅ REPLIT-CONFIRMED |
| F-08 | ItemDetailPanel weight unit — REGRESSION INTRODUCED (D-39, D-41); fixed in G-01/G-02 | ⚠️ REPAIRED |
| F-09 | ChecklistOverlay weight format | ✅ REPLIT-CONFIRMED |
| F-10 | Scroll-to-category via SectionList ref | 🔲 NOT YET TESTED (device) |
| F-11 | Shadow clipping (CategorySwipeRow overflow) | ✅ REPLIT-CONFIRMED |
| F-12 | FilterDropdown below filter bar | ✅ REPLIT-CONFIRMED (minor first-render race noted) |
| F-13 | AddItemBar direct-add — REGRESSION: deleted accordion; fixed in G-03 | ⚠️ REPAIRED |
| F-14 | Locker load toast | ✅ REPLIT-CONFIRMED |
| F-15 | weightUnit saved to Locker entry (AsyncStorage) | 🔲 NOT YET TESTED (device) |
| F-16 | weightUnit restored on startup (AsyncStorage) | 🔲 NOT YET TESTED (device) |
| F-17 | Toast safe-area bottom | 🔲 NOT YET TESTED (device); web: 66px vs spec 76px |
| F-18 | TILE_W=58, CAT_HEADER_H=62 | ✅ REPLIT-CONFIRMED (N002-sanctioned) |
| F-19 | Photo List empty card hidden when locations exist | ✅ REPLIT-CONFIRMED |
| F-20 | Unassigned section only when items exist | ✅ REPLIT-CONFIRMED |

## Batch G Repairs (this session)

| ID | Defect | Fix | Verification |
|----|--------|-----|-------------|
| G-01 | D-41: totalOz in metric treats localWt as oz | `displayToOz(localWt)` instead of `parseFloat` | ✅ TypeScript clean |
| G-02 | D-39: commitWeight stale closure (missing weightUnit dep) | Added `weightUnit` to dep array | ✅ TypeScript clean |
| G-03 | D-35: Add Item Accordion missing (F-13 regression) | Restored 3-option accordion (Name/Photo/Master List) in normal mode; allExpanded stays direct-add | ✅ TypeScript clean, app loads |
| G-04 | D-53: SummaryWeightRow/SummaryCatBar always showed lbs | Both now accept and use `weightUnit` prop; all call sites updated | ✅ TypeScript clean |
| G-05 | D-44: Delete swipe button #EF4444 vs spec #B03A2E | Changed to `#B03A2E` | ✅ Grep confirmed |
| G-06 | D-47/D-48: Save button skips chooser; MoreDeck missing Save row | ActionSheetIOS/Alert chooser for Save; added Save DeckRow to MoreDeck Card 1 | ✅ TypeScript clean |
| G-07 | D-26: Drawer width 280px vs spec max 240px | `Math.min(240, width * 0.55)` | ✅ Code confirmed |
| G-08 | D-27/D-28: Drawer Help/Settings → no-ops | Both now close + `setTimeout(onOpenMore, 300)` | ✅ TypeScript clean |
| G-09 | D-21/D-23: AppBar icons wrong color | Hamburger + decorative icons → `NAV_ACTIVE` | ✅ Code confirmed |
| G-10 | D-55/D-56/D-57/D-58: Preview Overlay gaps | ← Back, banner text, conditional Clear, PAGE_BG bg | ✅ TypeScript clean |
| G-11 | D-38: MoreDeck Card 1 Save row missing | Added Save DeckRow + `onSave` prop | ✅ TypeScript clean |
| G-12 | D-45: Item swipe activates from any X position | Added `evt.nativeEvent.pageX > width * 0.60` guard | ✅ TypeScript clean |

## Key Regression Notes
- **F-08 introduced D-41+D-39**: when F-08 changed `localWt` to store display-unit values, the `totalOz` calculation was NOT updated to convert back to oz before multiplying qty. Always audit all consumers of changed state when unit context is involved.
- **F-13 introduced D-35**: the "direct-add" instruction was correct for `allExpanded=true` mode but was applied universally, eliminating the normal-mode 3-option accordion. Always check mode-conditional behavior paths.

## Remaining Gaps (not in Batch G)
- D-42: Location "Create New Location" option in item detail panel (needs addLocation in context)
- D-46: NavBox active visual state
- D-50/D-51: More Deck Help/Account links are no-ops
- D-52: Summary donut chart missing
- D-54: Add Deck Card 1 doesn't expand/focus new item
- D-59/D-60/D-61/D-62: Checklist Overlay header (← Back, banner, Printer, Share2)
- D-63/D-64: Location bar Rename + Camera buttons
- D-65/D-66: Location accordion full-width photo + Edit button
- D-67: Photo filter mode full-width display
- D-71: Share screen (requires server URL generation)
