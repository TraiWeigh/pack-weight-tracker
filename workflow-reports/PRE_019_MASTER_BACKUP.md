# Pre-019 Master Backup

**Created:** 2026-08-07  
**Prompt:** 019 — Background Edit Pill + Separate Collapsible Summary Panels  
**Starting state:** 018C = USER-TESTED PASS

## Three UI Goals

1. **Background Edit pill active/inactive appearance** — closed = matches normal inactive pills; open = white with contrasting text/icon
2. **Separate Weight Distribution from Pack Summary** — two independent sidebar panels/cards
3. **Pack Summary collapsible** — same pattern as Weight Distribution

## Protected

- 018C filename pill (inset-0 centering, bg-muted, text-foreground, px-3 py-1.5, etc.)
- Active-file identity, "Saved [File Name]" toasts
- 017E background/shaking fix (BackgroundPicker.tsx)
- 017F Scan Gear List / importers
- Background Edit panel contents (Fill/Fit, Darken, Themes, custom photos, IndexedDB, Delete Theme, Undo/Redo)
- Weight Distribution chart, palette selector, legend, calculations, palette persistence
- lg:grid-cols-[1fr_365px], sidebar 365px width
- QTY translate-x-3, Hide/Preview/Imperial-Metric/Open-Close, Share, MOVE column
- All user data / localStorage / IndexedDB / Locker / cross-tab sync

## Test Baseline

925 passed / 0 failed before 019 starts.
