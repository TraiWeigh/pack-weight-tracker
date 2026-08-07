# Prompt 020E — Stop Cross-Tab Background Leakage + Protect Saved Appearance Data

## Starting State

020D = FAIL/PARTIAL. Gear/file identity loads correctly but background, fade, and tone leak between files and tabs. Sierra can open with Ray's psychedelic background; New can inherit a saved file's Dark mode.

## Exact Root Cause

**`window.open()` inherits the opener's entire sessionStorage to the new tab.**

When handleLoadFromLocker opens a saved file (`?savedListId=`) in a new tab via `window.open(url, '_blank')`, the new tab starts with a copy of every key in the opener's sessionStorage. This includes the generic, unscoped keys `tw-fork-bg-restore`, `tw-fork-bgfade-restore`, and `tw-fork-bgtone-restore` that 020C wrote with the *opener's* background.

`resolveStorageKey()` then overwrites `tw-fork-id` with a fresh UUID for the new tab, but the *inherited generic restore keys still contain the opener's appearance*.

The background initializer runs:
1. Check `tw-fork-id` → found → we're in a fork tab ✓
2. Check `tw-newseed-bg-{newForkId}` → not found (it's a savedListId tab, not newseed)
3. Check `tw-fork-bg-restore` → **FOUND (inherited from opener = Sierra's mountain bg)** → **returns Sierra's background on Ray's tab ❌**

Step 3 never distinguishes whose key it is — it just finds whatever is in sessionStorage, which was copied from the opener.

**Every prior 020C/020D attempt was wrong to use these generic (unscoped) keys.** Ordering tweaks can't fix an architectural leak.

## Files Inspected

- `artifacts/pack-checklist/src/pages/Checklist.tsx` — all 15 read/write sites for the three restore keys
- `artifacts/pack-checklist/src/hooks/usePackData.ts` — `resolveStorageKey()`, `tw-fork-id` assignment
- `artifacts/pack-checklist/src/hooks/newAfterLocker020C.test.mjs` — updated assertions
- `artifacts/pack-checklist/src/hooks/savedListRestore020D.test.mjs` — updated assertions + slice size
- `artifacts/pack-checklist/src/hooks/crossTabIsolation020E.test.mjs` — new 020E test (24 tests)

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | 11 targeted edits — all 15 uses of the three generic restore keys replaced with forkId-scoped keys |
| `artifacts/pack-checklist/src/hooks/newAfterLocker020C.test.mjs` | Updated 9 assertions to check scoped key pattern |
| `artifacts/pack-checklist/src/hooks/savedListRestore020D.test.mjs` | Updated 7 assertions + increased bgInit slice from 3500→5000 chars |
| `artifacts/pack-checklist/src/hooks/crossTabIsolation020E.test.mjs` | New — 24 tests for cross-tab isolation |
| `workflow-reports/PRE_020E_MASTER_BACKUP.md` | Backup of 020D backup as checkpoint |

## State-Flow Explanation

### Before Fix (020D)

```
Tab A (Sierra, forkId=AAA):
  sessionStorage: { 'tw-fork-id': 'AAA', 'tw-fork-bg-restore': Sierra_mountain }

User opens Ray → window.open('?savedListId=ray-id')

Tab B (Ray, inherits Tab A's sessionStorage):
  sessionStorage on open: { 'tw-fork-id': 'AAA', 'tw-fork-bg-restore': Sierra_mountain }

resolveStorageKey() runs → overwrites tw-fork-id:
  sessionStorage: { 'tw-fork-id': 'BBB', 'tw-fork-bg-restore': Sierra_mountain }

background initializer:
  forkId = 'BBB'
  localStorage.getItem('tw-newseed-bg-BBB') → not found
  sessionStorage.getItem('tw-fork-bg-restore') → Sierra_mountain ← WRONG ❌
  returns Sierra_mountain on Ray's tab
```

### After Fix (020E)

```
Tab A (Sierra, forkId=AAA):
  sessionStorage: { 'tw-fork-id': 'AAA', 'tw-fork-bg-restore-AAA': Sierra_mountain }

User opens Ray → window.open('?savedListId=ray-id')

Tab B (Ray, inherits Tab A's sessionStorage):
  sessionStorage on open: { 'tw-fork-id': 'AAA', 'tw-fork-bg-restore-AAA': Sierra_mountain }

resolveStorageKey() runs → overwrites tw-fork-id:
  sessionStorage: { 'tw-fork-id': 'BBB', 'tw-fork-bg-restore-AAA': Sierra_mountain }

background initializer:
  forkId = 'BBB'
  localStorage.getItem('tw-newseed-bg-BBB') → not found
  sessionStorage.getItem('tw-fork-bg-restore-BBB') → NOT FOUND (only AAA key exists)
  sessionStorage.getItem('tw-savedlist-bg') → Ray_psychedelic (written by usePackData)
  stash to 'tw-fork-bg-restore-BBB' = Ray_psychedelic
  returns Ray_psychedelic ✅
```

## The 15 Scoped Key Locations in Checklist.tsx

| Location | Key changed |
|----------|-------------|
| bg initializer — newseed bundle stash (×3) | `tw-fork-bg-restore-${forkId}`, `tw-fork-bgtone-restore-${forkId}`, `tw-fork-bgfade-restore-${forkId}` |
| bg initializer — remount read (×1) | `tw-fork-bg-restore-${forkId}` |
| bg initializer — savedListId stash (×1) | `tw-fork-bg-restore-${forkId}` |
| bgFade initializer — savedListId stash (×1) | `tw-fork-bgfade-restore-${forkId}` |
| bgFade initializer — remount read (×1) | `tw-fork-bgfade-restore-${forkId}` |
| bgTone initializer — savedListId stash (×1) | `tw-fork-bgtone-restore-${forkId}` |
| bgTone initializer — remount read (×1) | `tw-fork-bgtone-restore-${forkId}` |
| handleBackgroundChange (×1) | `tw-fork-bg-restore-${forkId}` |
| handleBgFadeChange (×1) | `tw-fork-bgfade-restore-${forkId}` |
| handleBgToneChange (×1) | `tw-fork-bgtone-restore-${forkId}` |
| handleLoadFromLocker in-place (×3) | all three scoped keys |

## Before/After Behaviour

| Scenario | Before | After |
|----------|--------|-------|
| Open Ray from Sierra's tab | Ray inherits Sierra's bg | Ray reads its own `tw-fork-bg-restore-{rayForkId}` (not found → reads `tw-savedlist-bg` = Ray's saved bg) ✅ |
| Open Sierra from Ray's tab | Sierra inherits Ray's psychedelic bg | Sierra reads `tw-fork-bg-restore-{sierraForkId}` (not found → reads `tw-savedlist-bg` = Sierra's saved bg) ✅ |
| Click New (from Sierra) | New tab inherits Sierra's bg | New tab reads `tw-newseed-bg-{newForkId}` (newseed bundle with background:null) → returns null (Clear) ✅ |
| New → remount | Falls through to inherited generic key | Reads `tw-fork-bg-restore-{newForkId}` = null (stashed from newseed bundle) ✅ |
| Saved file → remount | Reads inherited opener key (wrong file) | Reads `tw-fork-bg-restore-{ownForkId}` = correct saved file's bg ✅ |

## Why New Cannot Inherit Another Tab's Background

- `handleNew()` calls `window.open('?newseed={uuid}', '_blank')`
- The new tab inherits sessionStorage including `tw-fork-bg-restore-{openerForkId}`
- `resolveStorageKey()` assigns a NEW `uuid` to `tw-fork-id`
- The background initializer reads `` `tw-fork-bg-restore-${uuid}` `` → **not found** (only the opener's forkId-suffixed key exists)
- Falls through to `localStorage.getItem('tw-newseed-bg-{uuid}')` → finds the newseed bundle with `background: null`
- Returns `null` (Clear) ✅

The opener's key (`tw-fork-bg-restore-{openerForkId}`) sits harmlessly in sessionStorage with a different suffix, never read by the new tab.

## Why Saved Files Cannot Inherit Another File's Appearance

- Each `?savedListId=` tab gets a fresh forkId from `resolveStorageKey()`
- The background initializer constructs the scoped key using the CURRENT tab's forkId
- The opener's scoped key has a different forkId suffix → never matched
- The only source of bg data on the savedListId tab's first render is `tw-savedlist-bg` written synchronously by `usePackData` from the saved locker entry

## Automated Test Results

All tests run from workspace root (`/home/runner/workspace/`):

```
cd /home/runner/workspace && \
  node artifacts/pack-checklist/src/hooks/lockerFirstOpen020B.test.mjs && \
  node artifacts/pack-checklist/src/hooks/newAfterLocker020C.test.mjs && \
  node artifacts/pack-checklist/src/hooks/crossTabIsolation020E.test.mjs && \
  cd artifacts/pack-checklist && \
  node src/hooks/savedListRestore020D.test.mjs
```

| Suite | Tests | Result |
|-------|-------|--------|
| lockerFirstOpen020B.test.mjs | 24 | ✅ 24/24 PASS |
| newAfterLocker020C.test.mjs | 30 | ✅ 30/30 PASS |
| crossTabIsolation020E.test.mjs | 24 | ✅ 24/24 PASS |
| savedListRestore020D.test.mjs | 30 | ✅ 30/30 PASS |
| **Total** | **108** | **✅ 108/108 PASS** |

**020E test coverage includes:**
- Tests 1–6: No unscoped (generic) restore keys exist anywhere in source
- Tests 7–9: Scoped forkId-suffixed keys ARE present in source
- Tests 10–14: handleLoadFromLocker reads forkId and uses scoped keys
- Tests 15–17: All three handlers (bg, bgFade, bgTone) read forkId and write scoped keys
- Test 18: Newseed remount still returns null (Clear) as final fallback
- Tests 19–20: savedListId path still reads and stashes tw-savedlist-bg
- Tests 21–22: No localStorage.clear() or sessionStorage.clear() added
- Tests 23–24: resolveStorageKey still generates unique forkIds for both tab types

## Rendered/Cross-Tab Test

⚠️ **Automated tests verify structural (source-code) correctness only.** Real browser cross-tab sessionStorage inheritance cannot be simulated in Node.js. The user must run the required acceptance test sequence in a real browser session.

## Data-Safety Verification

- ✅ No IndexedDB operations added or modified
- ✅ No localStorage.clear() or sessionStorage.clear() added
- ✅ No locker files read, written, or deleted by the fix
- ✅ No saved-file background/tone/fade data modified
- ✅ Change is limited to the *names* of three sessionStorage temporary keys
- ✅ Non-fork (primary) tabs unchanged — they still write to localStorage (BG_STORAGE_KEY, trailweigh:bgTone, trailweigh:bgFade)
- ✅ Saved themes/photos in IndexedDB untouched
- ✅ Backward compatible: older fork tabs still open correctly (they get new forkIds from resolveStorageKey on every open)
- ✅ No new writes to any locker/saved-file storage path

## Acceptance Checklist

- [x] No generic (unscoped) `tw-fork-bg-restore` setItem/getItem in source
- [x] All 15 restore key sites use `tw-fork-{bg,bgfade,bgtone}-restore-${forkId}`
- [x] handleLoadFromLocker reads forkId before constructing scoped key
- [x] handleBackgroundChange, handleBgFadeChange, handleBgToneChange use scoped key
- [x] Background initializer returns null (Clear) when no newseed bundle and no scoped key exists
- [x] savedListId tabs still read tw-savedlist-bg and stash to scoped key
- [x] Non-fork tabs still write to localStorage (no regression)
- [x] No saved-file data erased/reset/migrated
- [x] No IndexedDB operations added
- [x] No localStorage/sessionStorage cleared
- [x] 020B/020C/020D functionality preserved (108/108 tests)
- [ ] USER ACCEPTANCE TEST — **NOT YET VERIFIED**

## Unresolved Issues

None from the implementation side. The only outstanding item is user acceptance testing in a real browser.

## Exact User Tests Required

A. Open Ray Jardine's → verify psychedelic background
B. Open Sierra once → verify Sierra/mountain background
C. Open Ray once → verify psychedelic background
D. Click New → verify Clear + Light + zero categories/items
E. Open Sierra once → verify Sierra/mountain background
F. Click New → verify Clear + Light
G. Open Packlist 1 once → verify Light + no background
H. Open Ray once → verify psychedelic background
I. Repeat A–H several times

At every step verify:
- correct filename
- correct gear items
- correct background/tone
- no refresh required
- no second open required
- no cross-file background leakage

Also verify:
- all saved themes/photos remain intact
- Saved [File Name] still works
- Scan Gear List still works
- prior saved files unchanged
- importing into blank New still auto-creates categories

## Prompt History

| Prompt | Status |
|--------|--------|
| 019 | USER-TESTED PASS |
| 020 | PARTIAL |
| 020A | PARTIAL |
| 020B | PARTIAL |
| 020C | PARTIAL/FAIL |
| 020D | FAIL/PARTIAL |
| 020E | NOT USER-VERIFIED |
