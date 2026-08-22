---
name: R0112 N004 native lessons
description: Key facts learned implementing the N004 Expo native pass — wedge shape, tab bar hiding, react-native-svg, SectionList collapse pattern, PackDataContext limits.
---

## react-native-svg already installed
`react-native-svg` 15.12.1 is in `pack-checklist-mobile/package.json`. Use `Svg, Polygon` from `react-native-svg` directly — no install needed. Two white Polygon triangles over the rightmost `WEDGE_POINT=17` px of a tile exactly replicate the v3 `clip-path` pentagon.

**Why:** Avoids the border-trick approach (which is hard to reason about in your head) and no new dep.

**How to apply:** Any future wedge/polygon shape in the native artifact can use SVG without asking.

## Hiding the Expo tab bar
Replace both `NativeTabLayout` / `ClassicTabLayout` branches in `_layout.tsx` with a single `<Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none', height: 0 } }}>`. Drop the `isLiquidGlassAvailable` import — it's only needed for the capsule decision.

**Why:** N003 left the old Gear/Summary capsule because `_layout.tsx` was never touched; both branches showed a tab bar.

## SectionList collapse pattern
Collapsed sections use `data: []` in the array passed to SectionList — the header still renders. Filter allSections stats separately so headers always show correct counts. Never remove the section from the array to "hide" a collapsed header.

## PackDataContext has no list name
`usePackData()` returns `{ data, toggleItem, isLoading }`. No `listName` field. Hardcode the list name and document the limitation. Do not add a field to the context without explicit scope.

## Ionicons glyph names
`"checkmark-square-outline"` does not exist. Use `"checkbox-outline"`. Trust the TS2820 "Did you mean X?" suggestion — it points to the correct name. The full glyph list is in the `@expo/vector-icons` type definitions.

## `shadow*` deprecation (web renderer only)
RN 0.81 Expo web preview logs `"shadow* style props are deprecated. Use boxShadow"`. These warnings only appear in the web renderer — `shadow*` props work correctly on iOS native in Expo Go. Do not fix for iOS-targeted work.
