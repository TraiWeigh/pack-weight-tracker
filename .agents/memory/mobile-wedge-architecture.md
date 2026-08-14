---
name: Mobile Wedge Category Architecture
description: 026R — how mobile category layout (MobileWedgeCategory) is isolated from desktop GearCategory.
---

## Rule
Mobile category layout is implemented as a completely separate component (`MobileWedgeCategory`) rendered in `lg:hidden` wrappers, alongside the unchanged `GearCategory` in `hidden lg:block` wrappers inside a single keyed `<div>` in the `categoryOrder.map()` in `Checklist.tsx`.

**Why:** This guarantees zero desktop impact. GearCategory.tsx and GearRow.tsx are completely unmodified. The desktop layout is pixel-identical before and after 026R.

**How to apply:** Any future change to mobile category presentation belongs in `MobileWedgeCategory.tsx` only. Do NOT modify GearCategory.tsx for mobile-specific behavior — use `hidden lg:block` / `lg:hidden` splits in Checklist.tsx instead.

## Key files
- `src/components/MobileWedgeCategory.tsx` — mobile category (wedge header + stacked item rows)
- `src/lib/mobileCategoryTheme.ts` — keyword-based icon+color mapping (25 keyword groups, 8-color rotating palette fallback)
- `src/pages/Checklist.tsx` — category map now wraps each category in `<div key={category}>` with desktop and mobile branches

## Breakpoint
`lg` (1024 px) is the mobile/desktop boundary throughout the app.

## MobileWedgeCategory props (same as GearCategory minus drag handlers)
name, categoryIndex (for fallback color), items, meta, forceOpen, forceOpenSeq, order,
updateItem, removeItem, moveItem, addItem, onUpdateMeta, onDelete, onRename, onToggle

## Keep It Simple (KIS)
KIS mode does NOT exist in the codebase as of 026R. MobileWedgeCategory always shows colored wedges with category icons. If KIS is added in the future, check `barStyle.barColor` or a new dedicated boolean, and render a plain neutral header instead of the colored wedge strip.

## PreviewModal compat fix (also in 026R)
`checklistUse`, `onToggle`, `onClear` in `PreviewModalProps` made optional. SharedChecklistPage uses PreviewModal without these (read-only display context). Clear button is hidden when `onClear` is absent.
