# Prompt 020D — Separate New Appearance From Saved-File Appearance

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 020D |
| **Prompt title** | Separate New Appearance From Saved-File Appearance |
| **Date** | 2026-08-07 |
| **Starting state** | 020C = PARTIAL/FAIL |
| **Goal** | New → Clear/Light always; Locker file open → restore that file's own background/tone/fade on first open |

---

## Starting State (020C = PARTIAL/FAIL)

**Confirmed working after 020C:**
- New reliably opens with zero categories/items, Clear background, Light mode ✅
- Random backgrounds on New tab remount are gone ✅

**Confirmed failing (020D bug):**
- Saved Locker files opened in-new-tab (`?savedListId=`) no longer restore their own background ❌
- Background shows Clear instead of the file's saved background

---

## Root Cause

### Architecture: both New and savedListId tabs are "fork tabs"

`resolveStorageKey()` in `usePackData.ts` sets `tw-fork-id` in sessionStorage for **both** URL patterns:

```
?newseed=uuid    → sessionStorage['tw-fork-id'] = uuid
?savedListId=id  → sessionStorage['tw-fork-id'] = newUUID
```

This is intentional — both paths need isolated fork storage keys for data. But it means the background initializer cannot distinguish between them using only `tw-fork-id`.

### 020C's if(forkId) block returns too early for savedListId tabs

020C added a `tw-fork-bg-restore` check and a `return null` fallback inside the `if (forkId)` block:

```typescript
const forkId = sessionStorage.getItem('tw-fork-id');
if (forkId) {
  // 1. newseed first render: reads tw-newseed-bg-uuid → stashes restore keys → returns
  const raw = localStorage.getItem(`tw-newseed-bg-${forkId}`);
  if (raw) { ... return parsed.background ?? null; }

  // 2. Remount path: check fork-local restore key
  const restore = sessionStorage.getItem('tw-fork-bg-restore');
  if (restore !== null) { return JSON.parse(restore) ?? null; }

  // 3. No snapshot → return null ← BUG for savedListId tabs
  return null;
}

// 4. tw-savedlist-bg check ← DEAD CODE for any fork tab
try {
  const raw = sessionStorage.getItem('tw-savedlist-bg');
  ...
```

`?savedListId=` tabs set `tw-fork-id`, so step 3 is reached: returns `null` (Clear). Step 4 is never reached.

### Why savedListId tabs had no tw-fork-bg-restore

`usePackData`'s store initializer (runs synchronously before any useState) writes:
```
sessionStorage['tw-savedlist-bg']      = JSON.stringify(entry.background)
sessionStorage['tw-savedlist-bgfade']  = entry.bgFade
sessionStorage['tw-savedlist-bgtone']  = entry.bgTone
```

But the background initializer returned `null` before checking any of these keys.

### bgFade and bgTone: first render correct, remount broken

The bgFade and bgTone initializers already had `tw-savedlist-bgfade/bgtone` checks (added in an earlier pass), and they ran correctly on **first render**. But after consuming those keys, they didn't stash values to `tw-fork-bgfade-restore` / `tw-fork-bgtone-restore`. So on remount (Clerk token refresh), those initializers fell through to global localStorage — which held another tab's values.

---

## The Fix — Three Targeted Changes

### Change 1: Background initializer — add `tw-savedlist-bg` check before `return null`

**Before (020C):**
```typescript
if (forkId) {
  // ...newseed and remount checks...
  const restore = sessionStorage.getItem('tw-fork-bg-restore');
  if (restore !== null) { return JSON.parse(restore) ?? null; }
  return null;  // ← savedListId tabs hit this
}
// tw-savedlist-bg check (dead code for fork tabs)
```

**After (020D):**
```typescript
if (forkId) {
  // ...newseed and remount checks...
  const restore = sessionStorage.getItem('tw-fork-bg-restore');
  if (restore !== null) { return JSON.parse(restore) ?? null; }
  // savedListId tab: check savedlist stash before returning null
  try {
    const savedBg = sessionStorage.getItem('tw-savedlist-bg');
    if (savedBg !== null) {
      sessionStorage.removeItem('tw-savedlist-bg');
      const parsed = JSON.parse(savedBg) ?? null;
      // Stash for remount resilience
      sessionStorage.setItem('tw-fork-bg-restore', JSON.stringify(parsed));
      return parsed;
    }
  } catch {}
  return null;  // Still null for newseed tabs with no snapshot
}
```

This correctly distinguishes:
- `?newseed=` tab first render → consumed the newseed bundle, stashed restore keys, returned early in step 1
- `?newseed=` tab remount → `tw-fork-bg-restore` is set (stashed in step 1) → returns null is never reached
- `?savedListId=` tab first render → no newseed bundle, no restore key yet → reads `tw-savedlist-bg` → correct background ✅
- `?savedListId=` tab remount → `tw-fork-bg-restore` now set (stashed when savedBg was consumed) → correct background ✅

### Change 2: bgFade initializer — stash `tw-fork-bgfade-restore` when consuming `tw-savedlist-bgfade`

**Before (020D bug):**
```typescript
const raw = sessionStorage.getItem('tw-savedlist-bgfade');
if (raw !== null) {
  sessionStorage.removeItem('tw-savedlist-bgfade');
  return parseFloat(raw);  // no remount stash
}
```

**After:**
```typescript
const raw = sessionStorage.getItem('tw-savedlist-bgfade');
if (raw !== null) {
  sessionStorage.removeItem('tw-savedlist-bgfade');
  const result = isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
  // Stash for remount resilience
  try { sessionStorage.setItem('tw-fork-bgfade-restore', String(result)); } catch {}
  return result;
}
```

### Change 3: bgTone initializer — stash `tw-fork-bgtone-restore` when consuming `tw-savedlist-bgtone`

**Before (020D bug):**
```typescript
const raw = sessionStorage.getItem('tw-savedlist-bgtone');
if (raw !== null) {
  sessionStorage.removeItem('tw-savedlist-bgtone');
  return raw as 'light' | 'dark';  // no remount stash
}
```

**After:**
```typescript
const raw = sessionStorage.getItem('tw-savedlist-bgtone');
if (raw !== null) {
  sessionStorage.removeItem('tw-savedlist-bgtone');
  // Stash for remount resilience
  try { sessionStorage.setItem('tw-fork-bgtone-restore', raw); } catch {}
  return raw as 'light' | 'dark';
}
```

---

## Before / After

| Scenario | Before 020D | After 020D |
|----------|-------------|------------|
| New tab first render | Clear/Light ✅ | Clear/Light ✅ (unchanged) |
| New tab remount | Clear/Light ✅ (020C) | Clear/Light ✅ (unchanged) |
| savedListId tab first render | Clear ❌ (020C regression) | File's bg ✅ |
| savedListId tab remount | Wrong (global localStorage) ❌ | File's bg ✅ |
| savedListId bgFade first render | Correct ✅ | Correct ✅ (unchanged) |
| savedListId bgFade remount | Wrong (localStorage) ❌ | File's fade ✅ |
| savedListId bgTone first render | Correct ✅ | Correct ✅ (unchanged) |
| savedListId bgTone remount | Wrong (localStorage) ❌ | File's tone ✅ |
| In-place Locker open (020B) | Correct ✅ | Correct ✅ (unchanged) |

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Background initializer: add `tw-savedlist-bg` check inside `if (forkId)` before `return null`; stash to `tw-fork-bg-restore` |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | bgFade initializer: stash `tw-fork-bgfade-restore` when consuming `tw-savedlist-bgfade` |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | bgTone initializer: stash `tw-fork-bgtone-restore` when consuming `tw-savedlist-bgtone` |
| `artifacts/pack-checklist/src/hooks/savedListRestore020D.test.mjs` | Created — 30 new tests |
| `package.json` | Added `savedListRestore020D.test.mjs` to `test:importer` chain |
| `workflow-reports/PRE_020D_MASTER_BACKUP.md` | Created before any changes |

---

## Files NOT Changed

| File / System | Status |
|---------------|--------|
| `usePackData.ts` | ✅ Untouched — `resolveStorageKey()`, `tw-savedlist-bg` stash, `tw-fork-id` logic all preserved |
| `handleLoadFromLocker` in-place path (020B) | ✅ Untouched |
| `handleNew()` — newseed bundle, window.open | ✅ Untouched |
| Background Edit (themes, custom photos, IndexedDB) | ✅ Untouched |
| All saved user data (IndexedDB, localStorage Locker) | ✅ Untouched |

---

## Automated Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| All prior suites (1071 total) | 1071 | ✅ PASS |
| `savedListRestore020D.test.mjs` | 30 | ✅ PASS |

**Total passed: 1101 / Total failed: 0 / Exit code: 0**
**New tests in 020D: 30**

---

## Acceptance Checklist

| Requirement | Verified by |
|-------------|-------------|
| bg initializer checks tw-savedlist-bg inside if(forkId) | Test 1 ✅ |
| bg initializer stashes tw-fork-bg-restore from tw-savedlist-bg | Test 2 ✅ |
| bg initializer removes tw-savedlist-bg on consume | Test 3 ✅ |
| bg initializer still checks tw-fork-bg-restore on remount (020C) | Test 4 ✅ |
| bg initializer still stashes tw-fork-bg-restore from newseed (020C) | Test 5 ✅ |
| bg initializer returns null as Clear fallback for newseed | Test 6 ✅ |
| bgFade checks tw-savedlist-bgfade (020D preserved) | Test 7 ✅ |
| bgFade stashes tw-fork-bgfade-restore (020D new) | Test 8 ✅ |
| bgFade checks tw-fork-bgfade-restore on remount (020C) | Test 9 ✅ |
| bgTone checks tw-savedlist-bgtone (020D preserved) | Test 10 ✅ |
| bgTone stashes tw-fork-bgtone-restore (020D new) | Test 11 ✅ |
| bgTone checks tw-fork-bgtone-restore on remount (020C) | Test 12 ✅ |
| usePackData writes tw-savedlist-bg | Test 13 ✅ |
| usePackData writes tw-savedlist-bgfade | Test 14 ✅ |
| usePackData writes tw-savedlist-bgtone | Test 15 ✅ |
| resolveStorageKey tw-fork-id for newseed | Test 16 ✅ |
| resolveStorageKey tw-fork-id for savedListId | Test 17 ✅ |
| handleNew background:null (020A) | Test 18 ✅ |
| handleNew bgTone:'light' (020A) | Test 19 ✅ |
| handleNew opens new tab (020C) | Test 20 ✅ |
| in-place setBackground (020B) | Test 21 ✅ |
| in-place setBgTone (020B) | Test 22 ✅ |
| in-place setBgFade (020B) | Test 23 ✅ |
| in-place replaceStore (020B) | Test 24 ✅ |
| 019 WeightDistribution | Test 25 ✅ |
| 018C filename pill | Test 26 ✅ |
| LOCKER_KEY | Test 27 ✅ |
| tw-fork-id (020C) | Test 28 ✅ |
| parseV5 __blank (020) | Test 29 ✅ |
| handleBackgroundChange tw-fork-bg-restore (020C) | Test 30 ✅ |
| All 1101 tests pass | All suites | ✅ PASS |
| **Sierra → New → Sierra appearance restored immediately** | Human | ⏳ NOT TESTED |
| **New → Clear/Light every time** | Human | ⏳ NOT TESTED |
| **File B opens with own bg (not Sierra's)** | Human | ⏳ NOT TESTED |
| **Full Sierra → New → Sierra → New → File B → New → Sierra cycle** | Human | ⏳ NOT TESTED |
| **No random background on New** | Human | ⏳ NOT TESTED |
| **All saved themes/photos still present** | Human | ⏳ NOT TESTED |
| **Import into blank New creates categories** | Human | ⏳ NOT TESTED |
| **Original saved files unchanged** | Human | ⏳ NOT TESTED |

---

## Master History Record

| Prompt | Result |
|--------|--------|
| 019 | ✅ USER-TESTED PASS |
| 020 | PARTIAL |
| 020A | PARTIAL |
| 020B | PARTIAL |
| 020C | PARTIAL/FAIL |
| 020D | NOT USER-VERIFIED — pending user's fresh post-completion test |
