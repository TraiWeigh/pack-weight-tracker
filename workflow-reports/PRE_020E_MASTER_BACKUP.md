# PRE_020C_MASTER_BACKUP

Generated before any Prompt 020C changes.
Starting state: 020B = PARTIAL (first Locker open after New restores appearance — confirmed working).

## Confirmed Bug (020C)

After opening a saved file via Locker (in-place path), clicking New opens a new tab
that initialises correctly (Clear/Light). But if React's ChecklistContent remounts
(e.g. Clerk token refresh cycles isLoaded → false → true), that new tab falls back
to the global localStorage keys — which 020B now populates with the opened file's
background — and shows the wrong (file's) background.

## Root Cause

### handleNew() opens a NEW BROWSER TAB via window.open()

It never resets the current tab in-place. Each "New" creates a fork tab with ?newseed=uuid.

### Fork tab background initialisation has two phases:

Phase 1 — First render:
  forkId = sessionStorage.getItem('tw-fork-id')    // set by usePackData's resolveStorageKey()
  raw = localStorage.getItem('tw-newseed-bg-' + forkId)  // written by handleNew()
  → reads {background:null, bgFade:1, bgTone:'light', bgSize:'cover'}
  → stashes bgFade/bgTone/bgSize/paletteKey to sessionStorage for their own initializers
  → removes 'tw-newseed-bg-' + forkId from localStorage
  → returns null  ✅

Phase 2 — Remount (Clerk token refresh or any React remount):
  forkId = sessionStorage.getItem('tw-fork-id')    // still 'uuid'
  raw = localStorage.getItem('tw-newseed-bg-' + forkId)  // GONE — already removed
  → raw is null, no newseed-bg key
  → falls through to: localStorage.getItem(BG_STORAGE_KEY)
  BG_STORAGE_KEY = file A's background  ← 020B wrote this when the file was opened
  → returns file A's background  ✗ (Wrong! New tab should be Clear/null)

### Why only after 020B?

Before 020B, handleLoadFromLocker in-place path did NOT write to BG_STORAGE_KEY
(or trailweigh:bgTone / trailweigh:bgFade). Those keys had the user's last explicitly
chosen values (often null = Clear). On remount of a fork tab, falling through to
BG_STORAGE_KEY returned null → no visible issue.

After 020B, handleLoadFromLocker in-place path writes the file's background to
BG_STORAGE_KEY + trailweigh:bgTone + trailweigh:bgFade. These are global (shared
across all tabs). On remount of a fork tab, falling through to BG_STORAGE_KEY
now returns the file's background → New tab shows wrong background.

## bgTone / bgFade also affected

bgTone initializer (line 237): on remount, tw-newbg-tone is gone → falls to
  localStorage.getItem('trailweigh:bgTone') = file's bgTone ('dark')
  → dark mode applied even on New tab remount

bgFade initializer (line 209): similar — falls to trailweigh:bgFade = file's fade

## Fix Strategy

Two-part fix:

### Part 1 — Background initializer (lines 141-189):
After consuming tw-newseed-bg-uuid (first render), stash the background in a
tab-local sessionStorage key: sessionStorage.setItem('tw-fork-bg-restore', JSON.stringify(bg))
Also stash tone and fade: tw-fork-bgtone-restore, tw-fork-bgfade-restore

On the remount path (fork tab, newseed-bg gone): check tw-fork-bg-restore first.
If present → use it. If absent → return null (safe default for any fork/New tab).
Do NOT fall through to global BG_STORAGE_KEY on fork tabs.

### Part 2 — handleLoadFromLocker in-place path:
Determine if current tab is a fork tab: !!sessionStorage.getItem('tw-fork-id')

IF fork tab:
  Update sessionStorage restore keys (tw-fork-bg-restore, tw-fork-bgtone-restore,
  tw-fork-bgfade-restore). These are tab-local — other tabs cannot see them.
  Do NOT write to BG_STORAGE_KEY / trailweigh:bgTone / trailweigh:bgFade.

IF non-fork tab (primary checklist tab):
  Write to localStorage as before — needed for full page-reload recovery.

### Part 3 — manual bg/tone/fade changes (handleBackgroundChange, handleBgToneChange, handleBgFadeChange):
When the user explicitly changes appearance on a fork tab, also update the sessionStorage
restore keys so that remounts use the user's choice, not the stale file value.

### Part 4 — bgTone/bgFade initializers:
Before falling through to global localStorage, check the fork-local restore keys.

## Files to be changed

artifacts/pack-checklist/src/pages/Checklist.tsx:
  - background useState initializer (~line 141)
  - bgFade useState initializer (~line 209)
  - bgTone useState initializer (~line 237)
  - handleBackgroundChange (~line 199)
  - handleBgFadeChange (~line 232)
  - handleBgToneChange (~line 256)
  - handleLoadFromLocker in-place path (~line 820)

## Current Test Chain (before 020C)

1041 passed / 0 failed (1017 prior + 24 from 020B)
