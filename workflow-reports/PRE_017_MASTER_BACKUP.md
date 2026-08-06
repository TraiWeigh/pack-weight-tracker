# PRE-017 MASTER BACKUP

Created before any Prompt 017 application code edits.

---

## Backup Verification

| Field | Value |
|-------|-------|
| **Master file** | `TRAILWEIGH_COMPLETE_WORKFLOW.md` |
| **Master line count** | 2511 |
| **Master file size** | 116,878 bytes |
| **Backup created** | 2026-08-06 |

---

## Current Showcase Component

| Field | Value |
|-------|-------|
| **Component file** | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` |
| **Showcase button lines** | 879–890 |
| **Showcase label** | `Showcase` |
| **onClick prop** | `onShowcase` (passed from `Checklist.tsx:1355–1357`) |
| **Blocked prop** | `isShowcaseBlocked` |
| **State variable** | `showcaseActive` (in `useInactivityTimer.ts:33`) |
| **Trigger function** | `triggerShowcase` (returned by `useInactivityTimer`) |
| **Exit function** | `exitShowcase` (returned by `useInactivityTimer`) |
| **Exit method** | Any keydown or scroll on the BackgroundShowcase overlay — no visible button |
| **Overlay component** | `BackgroundShowcase` rendered at `Checklist.tsx:968–974` |

## Current Preview Trigger Locations

| Location | File | Lines | Style |
|----------|------|-------|-------|
| Main gear-list pinned row (right group) | `Checklist.tsx` | 1253–1258 | `bg-muted rounded-lg` pill |
| Sidebar action row (above Pack Summary) | `Checklist.tsx` | 1367–1372 | `border border-border bg-card` pill |
| Shared checklist page | `SharedChecklistPage.tsx` | 711–717 | (not modified by 017) |

## Current Imperial Control

| Field | Value |
|-------|-------|
| **Component** | `<UnitToggle />` |
| **Location in main row** | `Checklist.tsx:1259` — immediately right of the Preview pill |
| **Location in shared page** | `SharedChecklistPage.tsx:717` |

## Current Control Order

### Main gear-list pinned row (desktop)
```
[Open | Close]  ——————————  [Preview]  [Imperial/Metric]
```

### Sidebar action bar (above Pack Summary)
```
[Background Edit]  [Preview]  [Share]  ...
```

### Header (top bar)
```
Left: New, Undo, Redo, Save, Reset, (guest: Sign in to save) | Right: Account menu
```

## Current Desktop Layout

- Main content: `grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:h-full` (`Checklist.tsx:1223`)
- Sidebar is `order-first lg:order-last`
- Sidebar action bar: `flex flex-wrap justify-center gap-2 pt-8 pb-3 lg:px-3`
- Gear-list pinned row: `pt-8 pb-3 flex items-center justify-between lg:pr-3`

## Current Phone Layout

- Single column; sidebar renders first (`order-first`)
- Sidebar action bar wraps into centered rows
- Gear-list pinned row stays one horizontal row (may compress at very narrow)
