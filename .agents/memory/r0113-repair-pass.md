---
name: R0113 repair pass architecture
description: All 12 regressions fixed in the native app — new components, context changes, index.tsx integration decisions
---

## Components Written

| File | Purpose |
|---|---|
| NavigationDrawer.tsx | Slide-in left drawer; props: visible/onClose/onMyLists/handedness/onToggleHandedness |
| PreviewOverlay.tsx | Full-screen modal; local previewChecked state; Share.share export |
| MoreDeck.tsx | 4-card accordion sheet; Card1=ListActions, Card2=Settings(weightUnit), Card3=Help, Card4=Account |
| ChecklistOverlay.tsx | Full-screen modal; shows only item.checked=true; uses checklistUse from context |
| FilterDropdown.tsx | Absolute-positioned 3-option dropdown; FilterViewMode='category'|'location'|'photo' |
| ItemDetailPanel.tsx | Inline below item row; DETAIL_BG=#F5F0E8; 9 rows; autoFocus Name |
| CategorySwipeRow.tsx | Wraps SectionHeader with right-40%-zone PanResponder swipe reveal; 88px buttons |
| CategoryPickerSheet.tsx | Category picker for contextual camera/photos case 3 (nothing open) |
| ItemPhotoSheet.tsx | Camera/Photos/Delete for standard-list item photos; expo-image-picker |

## Context Changes (PackDataContext.tsx)

- `weightUnit: 'imperial' | 'metric'` + `setWeightUnit()` — persisted to AsyncStorage key 'twm-weight-unit'
- `checklistUse: Record<string, boolean>` + `toggleChecklistItem(id)` + `clearChecklistUse()`
- `addItem()` now returns `string` (new item ID) — callers that ignore return value still work

## Key Architectural Decisions

- **filterView** replaces `photoListView`; type is `FilterViewMode = 'category' | 'location' | 'photo'`
- **expandedItemKey** `{ cat: string; id: string } | null` tracks open detail panel; one per screen
- **ItemRow split**: checkbox zone = `toggleItem`; name+weight zone = `handleTapItemName` → expandedItemKey
- **Category swipe + sticky**: CategorySwipeRow with overflow:hidden wraps the SectionHeader element returned from renderSectionHeader — stickySectionHeadersEnabled sticks the entire element
- **filterDDContainer**: `position: absolute, zIndex: 100` overlay; FilterDropdown's panel sits at `top: 0` of the backdrop view
- **showPhotoListEmpty**: moved from `if(showPhotoListEmpty) <ScrollView>` to `ListHeaderComponent` — SectionList always rendered
- **handleContextualMediaAction**: 3 cases for camera/photos in standard list — expandedItemKey → existing item; openCatName → addItem (returns id) → detail+photo; neither → CategoryPickerSheet

## weightUtils Changes

- Added `formatDisplayWeight(oz, system)` — switches oz→lb at ≥16oz, g→kg at ≥1000g, always includes suffix
- Added `calcWeights(data)` — computes 5 TrailWeigh buckets from checked items
- `calcTotalOz`, `formatWeight`, `ozToLbs`, `ozToGrams` all preserved

## SWIPE_BTN_W

Corrected from 80 → 88 throughout (items and CategorySwipeRow both use 88px).

**Why:** v3 visual-formula audit specifies 88px swipe buttons; 80px was a regression.
