---
name: Native visual shell — N002/N003 design constants
description: v3 geometry constants, layout rules, and RN limitations for the mobile gear screen
---

## Constants (N003 / R0111 — current)

All defined inline at the top of `artifacts/pack-checklist-mobile/app/(tabs)/index.tsx`:

```
SUMMARY_BG   = '#2A5740'   hero/bar background
NAV_ACTIVE   = '#2A5740'   active icons, checked weight text, done-badge
NAV_INACTIVE = '#6E7672'   inactive icons, subtitle text
CB_CHECKED   = '#4E7D5C'   checkbox fill when checked
PRIMARY_TEXT = '#1A2920'   all body/heading text
PAGE_BG      = '#F2EDE4'   page/list background (between cards)
DIVIDER      = 'rgba(0,0,0,0.06)'

TILE_W        = 72   category tile width (was 58 in N002)
CAT_HEADER_H  = 64   section header height (was 62 in N002)
RIGHT_INSET   = 44   category weight right padding (= CATEGORY_WEIGHT_RIGHT_INSET)
ITEM_R_INSET  = 34   item row right padding (= CHECKLIST_RIGHT_INSET)
FILTER_H      = 50   filter bar slot height
NAV_H         = 58   bottom box content height
APPBAR_H      = 52   app bar content height (below insets.top)
CHECKBOX_HIT  = 44   checkbox touch area width
```

## Component geometry (v3 measurements)

**AppBar**: single row, paddingL 14 paddingR 44, borderBottom 1px rgba(0,0,0,0.07). Title 19px/600/PRIMARY. Shadow 0 2px 10px 0.08.

**ListSummaryHero**: horizontal row — 66×66 icon tile (radius 14, rgba(0,0,0,0.20) overlay) | content col (name 15.5px/700/white, count 40px/700/white ls-1.5 + "items" 17px/500) | right stack (packed 13px/600 rgba(.58), indicator 18×18, bw 12px/600 rgba(.62)). paddingL 14, paddingR 44, paddingT 10, paddingB 12, gap 14. Shadow 0 4px 12px 0.22.

**FilterControl**: bar height 50, paddingV 5 paddingH 14. Button: minH 36, paddingV 6 paddingH 10, radius 8, border 1px DIVIDER, inner gap 7. Icons: sliders 15px NAV_ACTIVE, chevron 17px NAV_INACTIVE. Label 13px/600/PRIMARY. Shadow 0 3px 8px 0.08 downward.

**SectionHeader**: minH 64, white, shadow 0 3px 10px 0.18. Tile: 72px wide, full height, theme.bg, icon 26px rgba(.93). Tile right: 2px border rgba(0,0,0,0.08) (drop-shadow substitute). Text: paddingL 12, paddingV 8, col gap 10. Name: 17px/500/PRIMARY lh 20 ls -0.1. Subtitle: 12.5px/NAV_INACTIVE. Weight: paddingR 44, 13px/600/PRIMARY, maxW 96.

**ItemRow**: minH 44, white (no checked-bg), borderBottom 1px DIVIDER, paddingR 34. Checkbox area: 44px wide. Visual checkbox: 20×20 radius 5 border 1.5. Checked fill: CB_CHECKED. Check: 11px white. Name: 14.5px/500/PRIMARY. No sub-tag.

**BottomBox**: minH 58 content + bottomPad. 4 equal NavBox columns. NavBox: paddingT **7** paddingB 8, col, gap 2 (prior doc said 9 — corrected to v3 VF §11 spec). Icon 21px. Label 10px/700-active 400-inactive. Active bg rgba(42,87,64,0.10). Shadow 0 -3px 10px 0.07 upward. Border-top 1px rgba(0,0,0,0.07).

## RN limitations vs v3

- clip-path polygon → rectangular tile (borderRightWidth 2 rgba(.08) simulates right drop-shadow)
- drop-shadow(rightward) → thin right-edge border on tile
- font-weight 800 → PlusJakartaSans_700Bold (max available)
- font-weight 450 → PlusJakartaSans_500Medium
- shadow* props trigger web deprecation warnings — correct on native iOS
- backdrop-filter blur → not used; hero is opaque

## bottomPad formula

```ts
const isNativeTabs = isLiquidGlassAvailable();
const bottomPad =
  Platform.OS === 'web' ? 84
  : isNativeTabs        ? insets.bottom
  :                       insets.bottom + 49;
```

**Why:** NativeTabs (iOS 18+) manages its own bar inset; ClassicTabs bar is position:absolute 49pt, needs manual clearance.

## How to apply

Any future visual pass should start from these constants, not from N001/N002 values. The only file for visual changes is `app/(tabs)/index.tsx`; `categoryTheme.ts` is already correct.
