---
name: N002 native visual shell
description: Design constants, architecture decisions, and gotchas from the N002 native visual correction pass.
---

# N002 Native Visual Shell

## Rules
- `SUMMARY_BG = '#2A5740'` — v3 list-summary-bar dark forest green. Do not derive from `colors.primary` (#4A6B52 is too light).
- `TILE_W = 58`, `CAT_HEADER_H = 62` — category header identity tile width and min-height.
- Safe-area fix for AppHeader: call `useSafeAreaInsets()` *inside* AppHeader, apply `paddingTop: insets.top + 8`. The tab shell does NOT add top inset to the first child View when `headerShown: false`.
- `clip-path: polygon()` does not exist in React Native. The native wedge equivalent is a plain rectangular `View` with `backgroundColor: theme.bg` and a centred Ionicons icon. Width = TILE_W, height = full card height via `alignItems: 'stretch'` on the parent row.
- `shadow*` props emit deprecation warnings in the Expo web renderer but are the correct API for iOS on Expo SDK 54 (boxShadow is for RN 0.76+ new arch). Do not change them.
- Item display hierarchy: `item.desc` = primary name (14pt/400 normal case); `item.sub` = small uppercase tag (10pt/600, opacity 0.65). Show tag only if both fields are populated.
- Rounded-square checkbox: `borderRadius: 5`, `width/height: 20`. Not a circle (radius 11).
- `getCategoryTheme(name, index)` in `lib/categoryTheme.ts` is native-only; no web imports. Hex colours match web `mobileCategoryTheme.ts`; icons are Ionicons string names.

**Why:** Physical iPhone screenshot proved N001 looked nothing like v3. The two highest-impact gaps were (1) the pale SummaryStrip vs dark-green hero and (2) plain section headers vs coloured wedge cards.

**How to apply:** Any future native milestone that touches the Gear tab or category display should preserve SUMMARY_BG, TILE_W, CAT_HEADER_H, and the `getCategoryTheme` import from `lib/categoryTheme.ts`.
