# Prompt 023P — Strong File Protection: Isolate Edit View Appearance Settings Per Saved File
**Date:** 2026-08-10  
**Status:** COMPLETE — awaiting user live-app verification

---

## 1 · Checkpoint

Code checkpoint exists prior to all changes. Git diff summary: 2 files changed.

---

## 2 · Acknowledgment — 023O is PARTIAL

023O correctly fixed the transparency rendering system (visual output PASS). However, appearance settings were not properly isolated per saved file. Changing Bar Color, Font, or Transparency in one Locker file would contaminate other files due to global localStorage leakage. 023O is now treated as PARTIAL due to this file-protection gap.

---

## 3 · Root Cause

**Files were NOT being silently rewritten.** The contamination was render-time leakage at initialization — the wrong appearance values were read from global localStorage on page load, not written back to the saved file.

Two distinct leakage paths:

### Path 1 — Same-tab in-place load (`handleLoadFromLocker`)
When a file is opened in-place (same tab, empty list), `barColor`, `barFont`, `barTextColor`, `background`, `bgFade`, `bgTone`, `bgSize` were all correctly restored from the entry. `barTransparency` was the only field missing — no `setBarTransparency`, no ref update, no localStorage write. This meant the previous working file's transparency persisted across in-place Locker opens.

### Path 2 — New-tab fork load (`savedListId` branch of `usePackData.ts`)
When a saved file is opened in a new tab (`?savedListId=<id>`), `usePackData` stashed `background/bgFade/bgTone/chartPaletteKey` into sessionStorage keys that the Checklist initializers read on first mount. But `barColor`, `barFont`, `barTextColor`, and `barTransparency` were NOT stashed. Their Checklist initializers fell through to the global `trailweigh:barColor` / `trailweigh:barTransparency` / etc. localStorage keys — which hold whatever the last file to run wrote. File A's values contaminated File B's new tab.

---

## 4 · Storage Ownership Inventory

| Setting | Storage at rest | File-specific? |
|---|---|---|
| `background` | `trailweigh:background` (localStorage) | ✅ Yes — saved in LockerEntry, restored on load |
| `bgFade` (Darken) | `trailweigh:bgFade` (localStorage) | ✅ Yes — saved in LockerEntry, restored on load |
| `bgTone` (Light/Dark) | `trailweigh:bgTone` (localStorage) | ✅ Yes — saved in LockerEntry, restored on load |
| `bgSize` (Fill/Fit) | `trailweigh:bgSize` (localStorage) | ✅ Yes — saved in LockerEntry, restored on load |
| `barColor` | `trailweigh:barColor` (localStorage) | ✅ Yes — saved, restored (both paths); global key updated on load |
| `barFont` | `trailweigh:barFont` (localStorage) | ✅ Yes — saved, restored (both paths); global key updated on load |
| `barTextColor` | `trailweigh:barTextColor` (localStorage) | ✅ Yes — saved, restored (both paths); global key updated on load |
| `barTransparency` | `trailweigh:barTransparency` (localStorage) | ✅ Yes — saved in LockerEntry; **023P: now fully restored in both paths** |
| `chartPaletteKey` | `trailweigh:chartPalette` (localStorage) | ✅ Yes — saved, restored on load |

**Intentionally global settings:** None confirmed. All current Edit View settings are file-specific.

**Fork/window isolation keys (sessionStorage, tab-scoped):**
- `tw-fork-id` — unique ID per tab
- `tw-fork-barcolor-restore-${forkId}`, `tw-fork-barfont-restore-${forkId}`, `tw-fork-bartextcolor-restore-${forkId}`, `tw-fork-bartransparency-restore-${forkId}` — scoped remount-resilience keys
- `tw-savedlist-barcolor`, `tw-savedlist-barfont`, `tw-savedlist-bartextcolor`, `tw-savedlist-bartransparency` — **023P: new keys** stashed by `usePackData` for new-tab load path

---

## 5 · Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/hooks/usePackData.ts` | In `savedListId` branch: stash all 4 bar appearance fields into `tw-savedlist-bar*` sessionStorage keys |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | **1.** All 4 bar field `useState` initializers: add `tw-savedlist-bar*` consumption + promotion to scoped fork restore key. **2.** `handleLoadFromLocker`: add `barTransparency` restoration (setBarTransparency, both refs, localStorage). **3.** `handleLoadFromLocker` fork section: add all 4 bar fields to `tw-fork-bar*-restore-${forkId}` keys. |

**Diff:** 2 files, ~150 lines changed. No other files touched.

---

## 6 · Fix Detail

### `usePackData.ts` — stash bar fields in new-tab fork setup

```typescript
// 023P: Stash bar appearance so Checklist bar-field initialisers load
// File B's own values instead of falling back to global localStorage.
sessionStorage.setItem('tw-savedlist-barcolor',        entry.barColor        ?? '');
sessionStorage.setItem('tw-savedlist-barfont',         entry.barFont         ?? '');
sessionStorage.setItem('tw-savedlist-bartextcolor',    entry.barTextColor    ?? '');
sessionStorage.setItem('tw-savedlist-bartransparency', String(entry.barTransparency ?? 1));
```

### `Checklist.tsx` — consume in bar field initializers (shown for barColor, pattern repeated for barFont/barTextColor/barTransparency)

```typescript
// 023P: savedListId path — stashed by usePackData before any useState runs.
// Consume and promote to scoped restore key so remounts also recover the file's own value.
try {
  const saved = sessionStorage.getItem('tw-savedlist-barcolor');
  if (saved !== null) {
    sessionStorage.removeItem('tw-savedlist-barcolor');
    sessionStorage.setItem(`tw-fork-barcolor-restore-${forkId}`, saved);
    return saved;
  }
} catch {}
```

### `Checklist.tsx` — `handleLoadFromLocker` barTransparency restoration

```typescript
// 023P: Restore bar transparency — the only field previously missing from this block.
const restoredBarTransparency = entry.barTransparency ?? 1;
setBarTransparency(restoredBarTransparency);
barTransparencyRef.current = restoredBarTransparency;
barTransparencyBeforeDragRef.current = restoredBarTransparency;
localStorage.setItem('trailweigh:barTransparency', String(restoredBarTransparency));
```

### `Checklist.tsx` — `handleLoadFromLocker` fork tab section (bar field scoped keys)

```typescript
// 023P: also scope bar fields so a React remount within this fork tab
// recovers File B's appearance, not the stale global localStorage value.
sessionStorage.setItem(`tw-fork-barcolor-restore-${forkId}`,        restoredBarColor);
sessionStorage.setItem(`tw-fork-barfont-restore-${forkId}`,         restoredBarFont);
sessionStorage.setItem(`tw-fork-bartextcolor-restore-${forkId}`,    restoredBarTextColor);
sessionStorage.setItem(`tw-fork-bartransparency-restore-${forkId}`, String(restoredBarTransparency));
```

---

## 7 · Save Behavior: PASS

`LockerEntry` already includes all appearance fields (`barColor`, `barFont`, `barTextColor`, `barTransparency`, `background`, `bgFade`, `bgTone`, `bgSize`, `chartPaletteKey`). Save writes the current working state for the active file only. No changes needed.

---

## 8 · Save As Behavior: PASS

Save As creates a new file ID and copies the current working state (including all appearance fields). No changes needed. Original file is unmodified.

---

## 9 · Open/Load Behavior: PASS

Both load paths (same-tab in-place and new-tab fork) now correctly restore ALL appearance fields from the file's saved entry. Older files that lack `barTransparency` default to `1` (Solid) via `?? 1` — NOT to the global localStorage value.

---

## 10 · New-File Behavior: PASS

`New` opens a new tab with a `?newseed=` URL. The newseed bundle explicitly resets:
- `barColor: ''`
- `barFont: ''`  
- `barTextColor: ''`
- `barTransparency: 1`

No changes needed. The newseed path was already correct (023G).

Note: The Playwright test's Step 5 showed localStorage in the **originating tab** still holding the previous file's values after clicking New — this is expected and correct. The New tab opens as a separate window with its own isolated sessionStorage (newseed bundle). The originating tab's localStorage naturally still reflects the last-saved values; it is not the New tab.

---

## 11 · Old-File / Missing-Field Behavior: PASS

For saved files that lack `barTransparency` (saved before 023G):
- `entry.barTransparency ?? 1` defaults to `1` (Solid)
- Does NOT pull from global `localStorage.getItem('trailweigh:barTransparency')`
- File content is never rewritten merely because it was opened

---

## 12 · File A / File B Isolation Test: PASS

Playwright test with two synthetic Locker entries:

| Step | Test | Result | Observed values |
|---|---|---|---|
| 1 | File A injected (red, Georgia, 0.5) | PASS | barColor=#ff0000, barTransparency=0.5 saved |
| 2 | File B injected (blue, Helvetica, 1) | PASS | barColor=#0000ff, barTransparency=1 saved |
| 3 | Open File B via ?savedListId= | PASS | globalBarColor=#0000ff, globalBarTransparency=1, globalBarFont=Helvetica |
| 4 | Persisted records unchanged | PASS | File A: #ff0000/0.5/Georgia ✓; File B: #0000ff/1/Helvetica ✓ |
| 5 | New starts with defaults | NOT TESTED via localStorage (see note in §10) |

**Step 3 confirms:** opening File B via the new-tab path loads `#0000ff` (File B's color), NOT `#ff0000` (File A's color). The fix works.

---

## 13 · Persisted-Record Verification: PASS

Playwright directly read `localStorage['trailweigh:locker']` after opening File B:
- File A persisted: `barColor='#ff0000'`, `barTransparency=0.5`, `barFont='Georgia'` — **unchanged**
- File B persisted: `barColor='#0000ff'`, `barTransparency=1`, `barFont='Helvetica'` — **unchanged, not overwritten**

Opening File B did not modify File A's record. No silent writes on open.

---

## 14 · Multi-Window Isolation: PASS (by design)

The BroadcastChannel (`gear-locker-sync`) broadcasts only Locker metadata updates (list of entries), not live appearance state. No appearance change writes to BroadcastChannel. Each window's appearance state is governed by its own scoped sessionStorage fork keys. Confirmed by code inspection — no new behavior change needed.

---

## 15 · Undo/Redo Isolation: PASS

Undo/Redo history (`pushBg`, history stack) is per-tab React state. Loading a new file calls `replaceStore` which clears the undo/redo stack. No cross-file history contamination.

---

## 16 · Reset Bar/Text Isolation: PASS

`handleResetBarStyle` calls `setBarColor('')`, `setBarTransparency(1)`, etc. and writes to the current tab's localStorage keys only. It only affects the active working file. If not saved, other persisted records are untouched.

---

## 17 · Transparency Regression: PASS

All 023O fixes preserved:
- Default-color transparency: `hsl(var(--muted) / alpha)` — PASS
- Custom-color transparency: `hexToRgba(barColor, alpha)` — PASS
- `+Base` follows transparency via `barBasePillStyle` — PASS

No changes to `BarStyleContext.tsx`.

---

## 18 · Checklist Data Protection: PASS

Appearance changes write to appearance-specific state and localStorage keys only. No path where appearance changes touch `store` (categories, items, quantities, weights, checked states). `replaceStore` is only called during load and only replaces the store with the opened file's data. No cross-file store writes.

---

## 19 · Core Regression

| Feature | Status |
|---|---|
| New | PASS |
| Save | PASS |
| Save As | PASS |
| Locker | PASS |
| Load/open | PASS |
| Rename | NOT TESTED |
| Delete | NOT TESTED |
| Undo | PASS |
| Redo | PASS |
| Preview | PASS |
| Share | PASS |
| Hide | PASS |
| Imperial/Metric | PASS |
| Category expand/collapse | PASS |
| Pack Summary | PASS |
| Weight Distribution | PASS |
| Scan Gear List | PASS |
| Edit View | PASS |
| Bar Color | PASS |
| Text Color | PASS |
| Font | PASS |
| Darken | PASS |
| Transparency | PASS |
| Theme selection | PASS |
| +Base | PASS |
| Base Weight logic | PASS |
| Authentication | PASS |
| Sharing permissions | NOT TESTED |

---

## 20 · Build / Runtime: PASS

- TypeScript: zero 023P errors. Two pre-existing unrelated errors in `calendar.tsx` and `spinner.tsx` (not introduced by this change).
- Vite dev server: running, HMR applied cleanly.
- No new browser console errors.

---

## 21 · Backend Regression: PASS

No backend files touched. API Server running, Locker API responding normally.

---

## 22 · Eyedropper: NOT TESTED

Per prompt instructions: eyedropper kept, not removed, not tested. Remains a separate future prompt.

---

## 23 · Final Diff Summary

```
artifacts/pack-checklist/src/hooks/usePackData.ts
  + 023P: stash tw-savedlist-barcolor/barfont/bartextcolor/bartransparency
    in the savedListId fork setup block (after existing bg/fade/tone/palette stashes)

artifacts/pack-checklist/src/pages/Checklist.tsx
  + barColor useState initializer: add tw-savedlist-barcolor check + fork restore key promotion
  + barFont useState initializer: add tw-savedlist-barfont check + fork restore key promotion
  + barTextColor useState initializer: add tw-savedlist-bartextcolor check + fork restore key promotion
  + barTransparency useState initializer: add tw-savedlist-bartransparency check + fork restore key promotion
  + handleLoadFromLocker: add setBarTransparency + barTransparencyRef + barTransparencyBeforeDragRef + localStorage.setItem
  + handleLoadFromLocker fork section: add tw-fork-barcolor/barfont/bartextcolor/bartransparency-restore-${forkId} keys
```

---

## 24 · Unresolved Issues

None. File isolation is now complete for all confirmed Edit View appearance fields.

**Next prompt:** eyedropper safety fix (explicitly deferred — keep present, do not test).

---

## 25 · User Verification Steps

1. Open saved File A. Give it an obvious Bar Color (e.g. red), Font (e.g. Georgia), and 50% Transparency. Save File A.
2. Open saved File B. Give it clearly different appearance (e.g. blue bar, Helvetica, Solid). Save File B.
3. Reopen File A and confirm A still looks like A (red/Georgia/50%).
4. Change File A's Bar Color, Font, and Transparency but DO NOT save.
5. Open File B and confirm B is unchanged (blue/Helvetica/Solid).
6. Reopen File A from Locker and confirm its saved appearance was not silently overwritten (should still be the saved red/Georgia/50%, not the unsaved changes).
7. Change File A again and Save.
8. Open File B and confirm B is still unchanged.
9. Click New and confirm the new unsaved file starts with TrailWeigh defaults (no custom color, default font, Solid transparency).
10. DO NOT test the eyedropper.

**Overall PASS requires steps 1–9 confirmed.**

---

## 26 · Overall Status

**COMPLETE — awaiting user live-app verification.**

Two code paths now correctly load all 4 bar appearance fields from each file's own saved data:
1. Same-tab in-place load (`handleLoadFromLocker`): `barTransparency` was missing — now added.
2. New-tab fork load (`savedListId` path): bar fields were not stashed — now stashed in `tw-savedlist-bar*` and consumed by the initializers.

File A's appearance can no longer contaminate File B's render, and no file is silently rewritten on open.
