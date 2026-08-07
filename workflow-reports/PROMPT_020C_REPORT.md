# Prompt 020C — Make New Deterministically Reset to Clear + Light

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 020C |
| **Prompt title** | Make New Deterministically Reset to Clear + Light |
| **Date** | 2026-08-07 |
| **Starting state** | 020B = PARTIAL |
| **Goal** | Every New click deterministically produces zero categories, zero items, Clear background, Light mode — every time, including after repeated Locker open → New → Locker open cycles |

---

## Starting State (020B = PARTIAL)

**Confirmed working after 020B:**
- New initially opens with zero categories, Clear background, Light mode ✅
- First Locker open after New restores saved appearance immediately ✅
- Saved themes/photos intact ✅

**Confirmed failing (020C bug):**
- After opening a saved file via Locker, clicking New opens a new tab that sometimes shows the file's background instead of Clear ❌
- "Sometimes" / "changing" = triggered by Clerk token refresh cycling `isLoaded → false → true` → React remount

---

## Root Cause

### handleNew() always opens a NEW browser tab

`handleNew()` calls `window.open('...?newseed=uuid', '_blank')` — it never resets the current tab in-place. Each "New" creates a fork tab.

### Fork tab appearance initialisation has two phases

**Phase 1 — First render (correct):**
1. `resolveStorageKey()` in `usePackData` sees `?newseed=uuid` → sets `sessionStorage['tw-fork-id'] = uuid`
2. Background initializer reads `localStorage['tw-newseed-bg-uuid']` → `{background:null, bgFade:1, bgTone:'light'}` → removes key → returns `null` ✅

**Phase 2 — React remount (broken before 020C):**

Clerk token refresh cycles `isLoaded → false → true` → `ChecklistContent` unmounts and remounts → all `useState` initializers run again.

1. `tw-fork-id` is still in sessionStorage = uuid ✓
2. `tw-newseed-bg-uuid` is GONE — consumed and removed on Phase 1 ✗
3. Background initializer falls through to: `localStorage.getItem(BG_STORAGE_KEY)`
4. `BG_STORAGE_KEY` = **the last opened file's background** — written there by the 020B fix
5. New tab shows the file's background instead of Clear ✗

### Why only after 020B?

Before 020B, `handleLoadFromLocker` in-place path did NOT write to `BG_STORAGE_KEY`. It had whatever the user's last manually-chosen background was (often `null`). On Phase 2 remount, falling through to `BG_STORAGE_KEY` returned `null` → no visible issue.

After 020B, `handleLoadFromLocker` in-place path writes the opened file's background to `BG_STORAGE_KEY` (global, shared across tabs). Phase 2 remount of ANY fork tab (including New tabs from a completely different window.open call) falls through to this polluted global value.

### Same issue for bgTone and bgFade

`bgTone` initializer on remount: `tw-newbg-tone` gone → `localStorage.getItem('trailweigh:bgTone')` = file's dark tone → Dark mode applied to New tab.

`bgFade` initializer on remount: similar.

---

## The Fix — Three Coordinated Parts

### Part 1: Stash fork-local restore keys on first render

In the background initializer, after consuming `tw-newseed-bg-uuid` on first render, immediately stash the appearance values in **tab-local sessionStorage** keys:

```typescript
sessionStorage.setItem('tw-fork-bg-restore',     JSON.stringify(parsed.background ?? null));
sessionStorage.setItem('tw-fork-bgtone-restore', parsed.bgTone ?? 'light');
sessionStorage.setItem('tw-fork-bgfade-restore', String(parsed.bgFade ?? 1));
```

These keys are tab-local (sessionStorage) — other tabs cannot see them. On remount, the initializers check these keys before the global localStorage fallback.

### Part 2: Remount path checks fork-local keys first

**Background initializer** — when `tw-newseed-bg-uuid` is gone (remount):
```typescript
// Remount path — newseed-bg key was already consumed
const restore = sessionStorage.getItem('tw-fork-bg-restore');
if (restore !== null) {
  try { return JSON.parse(restore) ?? null; } catch {}
}
// No snapshot — return null (safe Clear default for any New/fork tab)
return null;
```
Fork tabs NO LONGER fall through to `BG_STORAGE_KEY`. The global key is only reached by non-fork (primary) tabs.

**bgTone initializer** — adds check before localStorage fallback:
```typescript
try {
  const restore = sessionStorage.getItem('tw-fork-bgtone-restore');
  if (restore !== null) return restore as 'light' | 'dark';
} catch {}
return (localStorage.getItem('trailweigh:bgTone') as 'light' | 'dark') ?? 'light';
```

**bgFade initializer** — same pattern with `tw-fork-bgfade-restore`.

### Part 3: handleLoadFromLocker in-place path — fork vs. non-fork

**Before (020B, unconditional localStorage writes — the bug source):**
```typescript
localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(entry.background));
localStorage.setItem('trailweigh:bgTone', restoredTone);
localStorage.setItem('trailweigh:bgFade', String(restoredFade));
```

**After (020C, conditional):**
```typescript
const isForkTab = !!sessionStorage.getItem('tw-fork-id');
if (isForkTab) {
  // Tab-local: only this tab sees these keys.
  // Other fork tabs opened via New will NOT inherit these values.
  sessionStorage.setItem('tw-fork-bg-restore',     JSON.stringify(entry.background ?? null));
  sessionStorage.setItem('tw-fork-bgtone-restore', restoredTone);
  sessionStorage.setItem('tw-fork-bgfade-restore', String(restoredFade));
} else {
  // Primary tab: global localStorage for page-refresh recovery.
  if (entry.background) localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(entry.background));
  else localStorage.removeItem(BG_STORAGE_KEY);
  localStorage.setItem('trailweigh:bgTone', restoredTone);
  localStorage.setItem('trailweigh:bgFade', String(restoredFade));
}
```

### Part 4: Manual user changes update restore keys

When the user explicitly changes background, tone, or fade on a fork tab, the restore keys must also update so remounts reflect the user's choice (not the stale Locker-load value):

```typescript
// handleBackgroundChange
try { sessionStorage.setItem('tw-fork-bg-restore', JSON.stringify(bg ?? null)); } catch {}

// handleBgFadeChange
try { sessionStorage.setItem('tw-fork-bgfade-restore', String(v)); } catch {}

// handleBgToneChange
try { sessionStorage.setItem('tw-fork-bgtone-restore', t); } catch {}
```

---

## Before / After

| Scenario | Before 020C | After 020C |
|----------|-------------|-----------|
| New tab first render | Clear/Light ✅ | Clear/Light ✅ (unchanged) |
| New tab after Clerk remount | Shows last file's background ❌ | Clear/Light ✅ |
| File A → New → File B → New | New shows File A or B bg ❌ | New always Clear/Light ✅ |
| File open in-place on fork tab, then remount | File bg restored ✅ | File bg restored ✅ |
| Primary (non-fork) tab page reload | bg from localStorage ✅ | bg from localStorage ✅ (unchanged) |
| Manual background change on fork tab, remount | bg from file's restore ❓ | user's chosen bg ✅ |

---

## 020B First-Open Restoration Preserved

`setBackground(entry.background)`, `setBgTone(entry.bgTone)`, `setBgFade(entry.bgFade)` — all still called in `handleLoadFromLocker` in-place path. The 020B behavior (first Locker open restores full appearance) is fully preserved. Only WHERE the persistence is written changed (sessionStorage for fork tabs, localStorage for non-fork tabs).

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | background/bgTone/bgFade initialisers: stash fork-local restore keys on first render; check them on remount; fork tabs skip global BG_STORAGE_KEY fallback |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `handleBackgroundChange`, `handleBgToneChange`, `handleBgFadeChange`: update sessionStorage restore keys on explicit user changes |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `handleLoadFromLocker` in-place path: fork tab → sessionStorage; non-fork tab → localStorage |
| `artifacts/pack-checklist/src/hooks/newAfterLocker020C.test.mjs` | Created — 30 new tests |
| `artifacts/pack-checklist/src/hooks/lockerFirstOpen020B.test.mjs` | Updated fnBody slice 3000→6000 and inPlaceBlock fallback 2000→4000 for post-020C function body size |
| `package.json` | Added `newAfterLocker020C.test.mjs` to `test:importer` chain |

---

## Files NOT Changed

| File / System | Status |
|---------------|--------|
| `handleNew()` — blank newseed, Clear, Light, window.open | ✅ Untouched |
| `handleLoadFromLocker` non-empty path (?savedListId) | ✅ Untouched |
| `parseV5()` — `__blank` branch | ✅ Untouched — 020 behavior preserved |
| `LockerEntry` interface | ✅ Untouched |
| `commitSaveNew`, `commitSaveReplace` | ✅ Untouched |
| Background Edit (Fill/Fit, Darken, Themes, custom photos, IndexedDB) | ✅ Untouched |
| 019 Pack Summary / Weight Distribution panels | ✅ Untouched |
| 018C filename pill | ✅ Untouched |
| Save / Save As / Locker / Reset / Share | ✅ Untouched |
| All saved user data (IndexedDB, localStorage Locker) | ✅ Untouched |

---

## Automated Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| All prior suites (1041 total) | 1041 | ✅ PASS |
| `newAfterLocker020C.test.mjs` | 30 | ✅ PASS |

**Total passed: 1071 / Total failed: 0 / Exit code: 0**
**New tests in 020C: 30**

---

## Acceptance Checklist

| Requirement | Test | Status |
|-------------|------|--------|
| bg initializer stashes tw-fork-bg-restore on first render | 020C.1 | ✅ PASS |
| bg initializer stashes tw-fork-bgtone-restore | 020C.2 | ✅ PASS |
| bg initializer stashes tw-fork-bgfade-restore | 020C.3 | ✅ PASS |
| bg initializer checks tw-fork-bg-restore on remount | 020C.4 | ✅ PASS |
| Fork tab returns null when no snapshot (not BG_STORAGE_KEY) | 020C.5 | ✅ PASS |
| bgFade checks tw-fork-bgfade-restore before localStorage | 020C.6 | ✅ PASS |
| bgTone checks tw-fork-bgtone-restore before localStorage | 020C.7 | ✅ PASS |
| in-place path checks isForkTab | 020C.8 | ✅ PASS |
| Fork tab writes tw-fork-bg-restore | 020C.9 | ✅ PASS |
| Fork tab writes tw-fork-bgtone-restore | 020C.10 | ✅ PASS |
| Fork tab writes tw-fork-bgfade-restore | 020C.11 | ✅ PASS |
| Non-fork tab still writes BG_STORAGE_KEY | 020C.12 | ✅ PASS |
| Non-fork tab still writes trailweigh:bgTone | 020C.13 | ✅ PASS |
| setBackground preserved (020B) | 020C.14 | ✅ PASS |
| setBgTone preserved (020B) | 020C.15 | ✅ PASS |
| setBgFade preserved (020B) | 020C.16 | ✅ PASS |
| replaceStore preserved (020B) | 020C.17 | ✅ PASS |
| writeActiveLockerFileToSS preserved (020B) | 020C.18 | ✅ PASS |
| handleBackgroundChange updates restore key | 020C.19 | ✅ PASS |
| handleBgFadeChange updates restore key | 020C.20 | ✅ PASS |
| handleBgToneChange updates restore key | 020C.21 | ✅ PASS |
| handleNew writes background:null | 020C.22 | ✅ PASS |
| handleNew writes bgTone:'light' | 020C.23 | ✅ PASS |
| handleNew writes bgFade:1 | 020C.24 | ✅ PASS |
| handleNew opens new tab | 020C.25 | ✅ PASS |
| handleNew writes __blank:true | 020C.26 | ✅ PASS |
| 019 WeightDistribution | 020C.27 | ✅ PASS |
| 018C filename pill | 020C.28 | ✅ PASS |
| LOCKER_KEY | 020C.29 | ✅ PASS |
| tw-fork-id set by resolveStorageKey | 020C.30 | ✅ PASS |
| All 1071 tests pass | All suites | ✅ PASS |
| **File A → New → Clear/Light (first render)** | Human | ⏳ NOT TESTED |
| **New tab stays Clear/Light after Clerk token refresh** | Human | ⏳ NOT TESTED |
| **File A → New → File B → New → repeated cycle** | Human | ⏳ NOT TESTED |
| **Never random background** | Human | ⏳ NOT TESTED |
| **Saved themes/photos still exist** | Human | ⏳ NOT TESTED |
| **Import into blank New still works** | Human | ⏳ NOT TESTED |
| **Save/filename correct** | Human | ⏳ NOT TESTED |
| **Reset unchanged** | Human | ⏳ NOT TESTED |

---

## Master History Record

| Prompt | Result |
|--------|--------|
| 019 | ✅ USER-TESTED PASS |
| 020 | PARTIAL |
| 020A | PARTIAL |
| 020B | PARTIAL |
| 020C | NOT USER-VERIFIED — pending user's fresh post-completion test |
