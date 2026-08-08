# PRE-021P MASTER BACKUP

**Created:** 2026-08-08  
**Purpose:** Checkpoint before Prompt 021P — Align Pack Summary Top Edge With Checklist Panel

## Scope of 021P

Remove the `py-2` (8 px) top padding from the inner sidebar content wrapper div so that
WeightSummary (Pack Summary) starts at the same vertical position as the first GearCategory.

## State at backup

All 41 test suites passing (exit 0) after 021O.

## Key state values (before 021P)

| Element | Classes |
|---|---|
| Toolbar group parent | `pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4` |
| Left toolbar panel | `pb-3 flex items-center lg:pr-7 flex-shrink-0 relative` |
| Right toolbar panel | `order-first lg:order-last … pb-3 lg:pl-3 lg:pr-9 flex-shrink-0` |
| Content area | `grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden` |
| Categories scroll (left) | `lg:h-full lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]` |
| Sidebar scroll (right) | `order-first lg:order-last lg:h-full lg:overflow-y-auto lg:min-h-0 lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]` |
| **Sidebar inner content div** | **`flex flex-col gap-4 py-2 pb-8`** ← `py-2` (8 px top) is the cause of the Pack Summary offset |

## Diagnosis

At desktop, both columns in the content-area grid start at y = 0 relative to the grid.
- Left column: categories scroll div → first GearCategory at y = 0 (no top padding)
- Right column: sidebar scroll div → inner content div with `py-2` = 8 px top → WeightSummary at y = 8 px

The `py-2` is the only extra vertical spacing on the right side vs. the left. Removing it
brings WeightSummary to y = 0, aligned with the first GearCategory.

## File backup

Full file backed up to: `workflow-reports/PRE_021P_CHECKLIST_BACKUP.tsx`
