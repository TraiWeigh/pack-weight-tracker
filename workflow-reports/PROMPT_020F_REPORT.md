# PROMPT 020F — Report

**Date:** 2026-08-07  
**Status:** COMPLETE  
**Files changed:** `usePackData.ts`, `Checklist.tsx`, `activeFileName018.test.mjs`, `activeFileName018A.test.mjs` (updated), `inheritedSessionStorage020F.test.mjs` (new)

---

## Root Cause

### Bug 1: Inherited sessionStorage forkId winning over URL-provided identity (FIXED)

**Symptom:** New tab initially renders blank/Clear/Light, then ~1 second later inherits the previously-opened saved file's background + Dark mode. Sierra tab could also open with the wrong background.

**Mechanism:**

`window.open()` copies the opener's **entire sessionStorage** to the new tab. The opener's `tw-fork-id` (and all `tw-fork-bg-restore-{openerForkId}`, `tw-fork-bgtone-restore-{openerForkId}`, `tw-fork-bgfade-restore-{openerForkId}` keys) land in the new tab's sessionStorage before any JavaScript runs.

The Clerk auth gate (`if (!isLoaded) return <spinner>`) blocks rendering of `ChecklistContent` (and therefore all of its `useState` hooks, including `usePackData`) until Clerk finishes loading — typically **~1 second**.

During that 1-second window, `resolveStorageKey()` had **not yet run**. When Clerk finally loads and `resolveStorageKey()` runs for the first time, the OLD code checked `sessionStorage.getItem('tw-fork-id')` **first**:

```ts
// OLD — WRONG ORDER
function resolveStorageKey(userId?) {
  try {
    const forkId = sessionStorage.getItem('tw-fork-id');  // ← inherited value wins!
    if (forkId) return { key: `pack-checklist-v5-fork-${forkId}`, isFork: true };

    const params = new URLSearchParams(window.location.search);
    const seedId = params.get('newseed');   // ← never reached for new tab
    ...
  }
}
```

The inherited `tw-fork-id=openerForkId` was found, so the function returned early with the **opener's fork identity** — completely ignoring the `?newseed=newUUID` or `?savedListId=xxx` URL parameter that identifies the NEW tab.

Consequence: the background initializer read `forkId=openerForkId`, found the inherited `tw-fork-bg-restore-openerForkId=ray_psychedelic` key, and returned Ray's background. The ~1 second delay is exactly how long Clerk takes to call `useUser()` and flip `isLoaded=true`.

**Fix — `usePackData.ts` `resolveStorageKey()`:**

```ts
// NEW — CORRECT ORDER: URL params are authoritative for fresh-tab identity
function resolveStorageKey(userId?) {
  try {
    const params = new URLSearchParams(window.location.search);

    // Check URL params FIRST — they are specific to THIS tab.
    // window.open() may have copied tw-fork-id from the opener; we must
    // ignore that inherited value when a URL param says who THIS tab is.

    const seedId = params.get('newseed');
    if (seedId) {
      sessionStorage.setItem('tw-fork-id', seedId);
      return { key: `pack-checklist-v5-fork-${seedId}`, isFork: true };
    }

    const savedListId = params.get('savedListId');
    if (savedListId) {
      const newForkId = crypto.randomUUID();
      sessionStorage.setItem('tw-fork-id', newForkId);
      return { key: `pack-checklist-v5-fork-${newForkId}`, isFork: true };
    }

    // Remount fallback: URL params already consumed (e.g. ?savedListId cleaned
    // up by store initializer, or Clerk re-render after token refresh).
    const forkId = sessionStorage.getItem('tw-fork-id');
    if (forkId) return { key: `pack-checklist-v5-fork-${forkId}`, isFork: true };

  } catch { /* ignore */ }
  return { key: V5_KEY(userId), isFork: false };
}
```

This ensures:
- New (newseed) tab: `?newseed=newUUID` is processed first → `tw-fork-id=newUUID` → background initializer reads `tw-newseed-bg-newUUID` → returns `null` (Clear) ✓
- Sierra (savedListId) tab: `?savedListId=sierraId` is processed first → fresh UUID → background initializer reads `tw-savedlist-bg` → Sierra's own background ✓  
- Remounts (Clerk token refresh): URL params consumed/cleaned → sessionStorage fallback → correct existing forkId ✓
- Primary non-fork tab: no URL params, no sessionStorage forkId → `V5_KEY(userId)` ✓

---

### Bug 2: Save toast wrapped filename in quotes (FIXED)

**Symptom:** After saving, the toast read `Saved "Sierra/Dutch/0826"` instead of `Saved Sierra/Dutch/0826`.

**Fix — `Checklist.tsx`:**

Both `commitSaveNew` (line 832) and `commitSaveReplace` (line 864):
```ts
// Before:
toast({ description: `Saved "${name}"` });

// After:
toast({ description: `Saved ${name}` });
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/usePackData.ts` | `resolveStorageKey()`: URL params checked before sessionStorage |
| `src/pages/Checklist.tsx` | Both save toasts: removed quotes around `${name}` |
| `src/hooks/activeFileName018.test.mjs` | Updated tests 2 & 4 to expect `Saved ${name}` format |
| `src/hooks/activeFileName018A.test.mjs` | Updated tests 12 & 13 to expect `Saved ${name}` format |
| `src/hooks/inheritedSessionStorage020F.test.mjs` | **New** — 28 structural tests for 020F fixes |

---

## Tests

| Suite | Tests | Result |
|-------|-------|--------|
| inheritedSessionStorage020F | 28 | ✅ All pass |
| crossTabIsolation020E | 24 | ✅ All pass (020E invariants intact) |
| savedListRestore020D | 30 | ✅ All pass |
| newAfterLocker020C | 30 | ✅ All pass |
| lockerFirstOpen020B | 24 | ✅ All pass |
| activeFileName018A | 30 | ✅ All pass (updated assertions 12/13) |
| activeFileName018 | 30+ | ✅ All pass (updated assertions 2/4) |
| All other suites | — | ✅ All pass |

---

## What Was NOT Touched

- Share serialization / share URL parsing / shared-view store hydration
- Any mobile artifact (`artifacts/pack-checklist-mobile`)
- Any API server (`artifacts/api-server`)

---

## Acceptance Test Required

The structural tests verify code shape but cannot simulate real browser cross-tab behaviour. The user must run the following manual cycle:

1. Open the primary workspace.
2. Open a Locker file (e.g. Ray, with psychedelic bg + Dark mode) via "Load This List" → new tab.
3. From WITHIN that tab, click New → another new tab opens.
4. **Assert:** New tab shows Clear background + Light mode from the first render (no ~1s flip to Ray's bg).
5. Close New. Return to Ray tab. Click a different Locker file (Sierra, mountain bg).
6. **Assert:** Sierra opens with its own mountain bg + its own tone.
7. Save any file → read the toast.
8. **Assert:** Toast reads `Saved [filename]` (no quotation marks around the name).
