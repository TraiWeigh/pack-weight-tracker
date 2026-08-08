# PRE-021O MASTER BACKUP

**Created:** 2026-08-08  
**Purpose:** Checkpoint before Prompt 021O — Move Toolbar Group Up

## Scope of 021O

Moving the toolbar group upward ~16 px by:
- Adding `pt-4` to the toolbar-group parent div (shared vertical position)
- Removing `pt-8` from the left toolbar panel child
- Removing `pt-8` from the right toolbar panel (action bar) child
- Updating the filename-pill overlay from `pt-8 pb-3` → `pb-3`

## State at backup

All 40 test suites passing (exit 0) after 021N.

## Key state values (before 021O)

| Element | Classes |
|---|---|
| `<main>` | `lg:flex lg:flex-col` |
| Toolbar group parent | `grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4` (no pt) |
| Left toolbar panel | `pt-8 pb-3 flex items-center lg:pr-7 flex-shrink-0 relative` |
| Filename pill overlay | `absolute inset-0 pt-8 pb-3 flex items-center justify-center pointer-events-none` |
| Right toolbar panel | `order-first lg:order-last relative flex flex-wrap justify-center lg:justify-end gap-2 pt-8 pb-3 lg:pl-3 lg:pr-9 flex-shrink-0` |
| Content area | `grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden` |
| Categories scroll | `lg:h-full lg:overflow-y-auto lg:min-h-0 … lg:pr-3 lg:[scrollbar-gutter:stable]` |
| Sidebar scroll | `order-first lg:order-last lg:h-full lg:overflow-y-auto … lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]` |

## File backup

Full file backed up to: `workflow-reports/PRE_021O_CHECKLIST_BACKUP.tsx`
