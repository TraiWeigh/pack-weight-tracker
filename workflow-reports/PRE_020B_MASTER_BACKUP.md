# PRE_020B_MASTER_BACKUP

Generated before any Prompt 020B changes.
Starting state: 020A = PARTIAL (New opens blank/Clear/Light — confirmed working).

## Confirmed bug

1. Start from New (blank list, Clear background, Light mode)
2. Open Sierra (saved file) from Locker — in-place path triggers (totalItems===0)
3. Sierra's categories/items load ✅, BUT background + Dark mode do NOT restore ✗
4. Open Sierra again — second open opens a new tab (?savedListId=) → full restoration ✅

## Root cause

handleLoadFromLocker has two paths:

### In-place path (totalItems === 0) — BUGGY

When the current list is blank (New), the handler takes this path. It calls:
  - setChartPaletteKey(restoredPalette)  ✅ 
  - replaceStore(entry.store)            ✅
  - writeActiveLockerFileToSS(newFile)   ✅
  - setActiveLockerFile(newFile)         ✅
  
Missing:
  - setBackground(entry.background)      ✗
  - setBgTone(entry.bgTone)              ✗
  - setBgFade(entry.bgFade)              ✗
  - localStorage updates for above       ✗

The comment says "Background is already in React state" — correct for a normal tab,
WRONG for a New tab where state is null/light/1/cover from the 020A Clear+Light change.

### New-tab path (totalItems > 0) — WORKS

Opens ?savedListId=entry.id in a new tab. That tab's useState initializers read
tw-savedlist-bg/bgtone/bgfade/palettekey from sessionStorage and restore everything.

## File to be changed

artifacts/pack-checklist/src/pages/Checklist.tsx
  — handleLoadFromLocker (lines 815–854)
  — in-place path: add setBackground, setBgTone, setBgFade, localStorage updates

## Current handleLoadFromLocker in-place block (lines 820–840)

```typescript
if (totalItems === 0) {
  // ── In-place open path ────────────────────────────────────────────────
  // 1. Background is already in React state — nothing to capture/restore
  //    because replaceStore only touches the gear store, not bg state.
  // 2. Restore the file's Weight Distribution palette key.
  //    Older entries without chartPaletteKey fall back to 'trail' (default).
  const restoredPalette = entry.chartPaletteKey ?? 'trail';
  setChartPaletteKey(restoredPalette);
  localStorage.setItem('trailweigh:chartPalette', restoredPalette);
  // 3. Replace the store (clears undo/redo; does not push history entry).
  replaceStore(entry.store as import('../hooks/usePackData').Store);
  // 4. Track the active file identity ...
  const newActiveFile: ActiveLockerFile = { id: entry.id, name: entry.name };
  writeActiveLockerFileToSS(newActiveFile);
  setActiveLockerFile(newActiveFile);
  // 4. Stay in the same tab — no window.open.
  return;
}
```

## LockerEntry interface fields (LockerPanel.tsx)

- id: string
- name: string
- savedAt: number
- store: Store
- background: Background | null
- bgFade: number
- bgTone: 'light' | 'dark'
- chartPaletteKey?: string  (optional — older entries may omit)

Note: bgSize is NOT in LockerEntry (not persisted per-file).

## State of Test Chain (before 020B)

1017 passed / 0 failed
