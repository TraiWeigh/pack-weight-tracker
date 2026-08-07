# Prompt 020B — Restore Saved Appearance on First Open After New

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 020B |
| **Prompt title** | Restore Saved Appearance on First Open After New |
| **Date** | 2026-08-07 |
| **Starting state** | 020A = PARTIAL |
| **Goal** | A saved Locker file must restore its complete saved appearance (background, tone, fade, palette) on the **first** open after New — no second open required |

---

## Starting State — What Was Confirmed Working (020A)

- New opens with zero categories / zero items ✅
- New opens with Clear/blank background ✅
- New opens in Light mode ✅
- All saved themes/photos remain available ✅

---

## The Bug

**Repro sequence:**
1. Start from New (blank, Clear, Light mode)
2. Open Sierra file from Locker
3. Sierra's categories/items load — but its saved background and Dark mode **do NOT restore** on first open
4. Open Sierra again — second open restores everything correctly

---

## Root Cause

`handleLoadFromLocker` in `Checklist.tsx` has two paths:

### Path A — In-place open (`totalItems === 0`)

Taken when the current list is blank — i.e. the New tab. The handler:
- ✅ `setChartPaletteKey(restoredPalette)` — palette restored
- ✅ `replaceStore(entry.store)` — gear items loaded
- ✅ `writeActiveLockerFileToSS(newActiveFile)` — identity set
- ✅ `setActiveLockerFile(newActiveFile)` — identity set
- ✗ `setBackground(...)` — **MISSING**
- ✗ `setBgTone(...)` — **MISSING**
- ✗ `setBgFade(...)` — **MISSING**

The block contained the comment "Background is already in React state — nothing to capture/restore". This was a correct assumption for a normal tab (the user's preferred background was already displayed), but became wrong after **020A** forced every New tab to start with `background=null`, `bgTone='light'`, `bgFade=1`. After 020A, the "state already in React" was always Clear + Light — not the saved file's appearance.

### Path B — New-tab open (`totalItems > 0`)

Taken when the current list has any gear. Opens `?savedListId=entry.id` in a new browser tab. That new tab's `useState` initializers read `tw-savedlist-bg`, `tw-savedlist-bgtone`, `tw-savedlist-bgfade`, `tw-savedlist-palettekey` from sessionStorage and restore everything correctly. **This path always worked.**

### Why the second open worked

After the first in-place open, the list now has Sierra's gear items (`totalItems > 0`). The second open therefore takes Path B — opens a new tab which restores everything from sessionStorage. The second open was always correct; only Path A was broken.

---

## The Fix — One Targeted Block

In the in-place path of `handleLoadFromLocker`, added restoration of `background`, `bgTone`, and `bgFade` from the entry — matching exactly what `commitSaveNew`/`commitSaveReplace` save, and what Path B already restores:

```typescript
// Restore background image (null = Clear).
setBackground(entry.background as Background | null);
if (entry.background) {
  localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(entry.background));
} else {
  localStorage.removeItem(BG_STORAGE_KEY);
}

// Restore tone (dark/light).  Older entries without bgTone fall back to light.
const restoredTone = entry.bgTone ?? 'light';
setBgTone(restoredTone);
localStorage.setItem('trailweigh:bgTone', restoredTone);

// Restore fade/darken.  Older entries without bgFade fall back to 1 (none).
const restoredFade = entry.bgFade ?? 1;
setBgFade(restoredFade);
localStorage.setItem('trailweigh:bgFade', String(restoredFade));
```

The `??` fallbacks handle older Locker entries that may not have `bgTone`/`bgFade` fields (backward compatibility).

`bgSize` is NOT in `LockerEntry` (never persisted per-file) so it is not restored — this is unchanged from the pre-020B state and the new-tab path.

---

## Before / After

| Scenario | Before 020B | After 020B |
|----------|------------|-----------|
| New → open Sierra (first time) | Gear loads; background = Clear, tone = Light ✗ | Gear + background + Dark mode all restore immediately ✅ |
| New → open Sierra (second time) | Full restoration via new-tab path ✅ | Still works (path B unchanged) ✅ |
| New → open File A → click New → open File B | File B gear loads, bg wrong on first open ✗ | File B full restoration on first open ✅ |
| New (blank/Clear/Light) | ✅ | ✅ Preserved — handleNew untouched |
| Reopen File A after all above | ✅ | ✅ Unchanged |

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `handleLoadFromLocker` in-place path: added `setBackground`, `setBgTone`, `setBgFade` + localStorage writes; updated comment |
| `artifacts/pack-checklist/src/hooks/lockerFirstOpen020B.test.mjs` | Created — 24 new tests |
| `package.json` | Added `lockerFirstOpen020B.test.mjs` to `test:importer` chain |

---

## Files NOT Changed

| File / System | Status |
|---------------|--------|
| `handleLoadFromLocker` non-empty path (`?savedListId`) | ✅ Untouched |
| `handleNew()` — blank newseed, Clear, Light | ✅ Untouched — 020A behavior preserved |
| `parseV5()` — `__blank` branch | ✅ Untouched — 020 behavior preserved |
| `LockerEntry` interface | ✅ Untouched |
| `commitSaveNew`, `commitSaveReplace` | ✅ Untouched |
| Background Edit (Fill/Fit, Darken, Themes, custom photos, IndexedDB) | ✅ Untouched |
| 019 Pack Summary / Weight Distribution panels | ✅ Untouched |
| 018C filename pill | ✅ Untouched |
| Save / Save As / Locker / Reset / Share | ✅ Untouched |
| 017E shaking fix / 017F importers | ✅ Untouched |
| All saved user data | ✅ Untouched — `handleLoadFromLocker` reads from Locker, never writes |

---

## Why 020A New Behavior Is Fully Preserved

`handleNew()` was not touched. It still writes:
- `background: null` (Clear)
- `bgTone: 'light'`
- `bgFade: 1`
- `bgSize: 'cover'`
- `__blank: true`

The fix only changes what `handleLoadFromLocker` does **after** a saved file is opened. Clicking New still gives a blank, Clear, Light workspace.

---

## Automated Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| All prior suites (1017 total) | 1017 | ✅ PASS |
| `lockerFirstOpen020B.test.mjs` | 24 | ✅ PASS |

**Total passed: 1041 / Total failed: 0 / Exit code: 0**
**New tests in 020B: 24**

---

## Acceptance Checklist

| Requirement | Test | Status |
|-------------|------|--------|
| In-place path calls setBackground | 020B.1 | ✅ PASS |
| In-place path writes BG_STORAGE_KEY | 020B.2 | ✅ PASS |
| In-place path removes BG_STORAGE_KEY for null background | 020B.3 | ✅ PASS |
| In-place path calls setBgTone | 020B.4 | ✅ PASS |
| In-place path writes trailweigh:bgTone | 020B.5 | ✅ PASS |
| In-place path calls setBgFade | 020B.6 | ✅ PASS |
| In-place path writes trailweigh:bgFade | 020B.7 | ✅ PASS |
| chartPaletteKey still restored | 020B.8 | ✅ PASS |
| replaceStore still called | 020B.9 | ✅ PASS |
| writeActiveLockerFileToSS still called | 020B.10 | ✅ PASS |
| setActiveLockerFile still called | 020B.11 | ✅ PASS |
| Stale "already in React state" comment removed | 020B.12 | ✅ PASS |
| bgTone ?? 'light' fallback for older entries | 020B.19 | ✅ PASS |
| bgFade ?? 1 fallback for older entries | 020B.20 | ✅ PASS |
| Non-empty path still opens ?savedListId= | 020B.13 | ✅ PASS |
| New still writes background:null | 020B.14 | ✅ PASS |
| New still writes bgTone:'light' | 020B.15 | ✅ PASS |
| New still writes __blank:true | 020B.16 | ✅ PASS |
| 019 WeightDistribution preserved | 020B.17 | ✅ PASS |
| 019 panelOpen preserved | 020B.18 | ✅ PASS |
| 018C filename pill preserved | 020B.21 | ✅ PASS |
| parseV5 __blank branch preserved | 020B.22 | ✅ PASS |
| Save toast unchanged | 020B.23 | ✅ PASS |
| LOCKER_KEY preserved | 020B.24 | ✅ PASS |
| All 1041 tests pass | All suites | ✅ PASS |
| **New → open Sierra once → background restores immediately** | Human | ⏳ NOT TESTED |
| **Dark mode restores on first open** | Human | ⏳ NOT TESTED |
| **Fade/darken restores on first open** | Human | ⏳ NOT TESTED |
| **Palette restores on first open** | Human | ⏳ NOT TESTED |
| **Filename pill shows Sierra on first open** | Human | ⏳ NOT TESTED |
| **New after the above → still blank/Clear/Light** | Human | ⏳ NOT TESTED |
| **Open File B once → File B's appearance restores immediately** | Human | ⏳ NOT TESTED |
| **Reopen File A → unchanged** | Human | ⏳ NOT TESTED |
| **Saved themes/photos still available in Background Edit** | Human | ⏳ NOT TESTED |

---

## Master History Record

| Prompt | Result |
|--------|--------|
| 017E | ✅ USER-TESTED PASS |
| 017F | ✅ USER-TESTED PASS |
| 018C | ✅ USER-TESTED PASS |
| 019 | ✅ USER-TESTED PASS |
| 020 | PARTIAL (categories blank — 020A carries this forward) |
| 020A | PARTIAL (Clear+Light confirmed working; first-open appearance bug found) |
| 020B | NOT USER-VERIFIED — pending user's fresh post-completion test |
