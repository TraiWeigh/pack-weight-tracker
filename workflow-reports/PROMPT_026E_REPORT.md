# Prompt 026E — Fix Review Background Initial State

**Status:** IMPLEMENTED  
**Scope:** Review/sandbox page only — no auth, no schema, no deployment changes.

---

## Root Cause

### The Global Key Pollution Problem

`seedFromLiveFiles` (ReviewPage.tsx) writes the owner's saved background to the
**global** `trailweigh:background` localStorage key (025Q fix).  
`ChecklistContent`'s `background` useState initializer reads from the same key as
its final fallback on the normal (non-fork, non-savedListId) path.

This key is **shared across all browser tabs** in the same origin.  
The owner's ChecklistContent writes to `trailweigh:background` on every
`handleBackgroundChange` call — including unsaved changes.

### CASE B Failure (Most Common)

When the reviewer reloads a share link that hasn't changed since their last visit
(`localSV === newSourceVer`), CASE B applies: `seedFromLiveFiles` is **not**
called. ChecklistContent reads `trailweigh:background` as-is.

If the owner is browsing their own checklist in another tab and selects a new
background (even without saving), that write pollutes the global key. The reviewer
sees the owner's **unsaved** background, or — if the reviewer is the same person
testing from their owner session — the global key may hold a **custom-format** bg
object (`{ type:'custom', photoId:'...' }`) rather than the normalized preset.

### CASE A / C Subcase (Pre-026D saves)

Even when CASE A or C fires, `seedFromLiveFiles` normalizes `{ type:'custom',
photoId }` entries via `LEGACY_PHOTO_ID_MAP`. The normalization logic is correct,
but the global key write is still fragile for CASE B on subsequent reloads.

---

## Data Confirmation

DB query on 2026-08-13 showed the most recent locker entry:

```
id: ed2e848c-…, background: { type:'custom', photoId:'a259f90c-…' }
LEGACY_PHOTO_ID_MAP['a259f90c-…'] = 'psychedelic-04'
```

The UUID **is** in the map, so normalization would produce `{ type:'preset',
id:'psychedelic-04' }`. The 026D code is correct; the failure is the global-key
pollution in CASE B.

---

## Fix (3 parts, all minimal)

### Part 1 — ReviewPage.tsx / seedFromLiveFiles

Added a **review-scoped** background key write:
```
trailweigh:review:${token}:background
```
(key derived from `packKey` by replacing `:pack` with `:background`).

Applies the same normalization as the existing global-key write so the review
namespace always holds a clean `{ type:'preset', id }` value (or is absent for
unknown custom photos).

### Part 2 — Checklist.tsx / background useState initializer

In **review mode** (`reviewToken` truthy), the initializer now reads from
`trailweigh:review:${reviewToken}:background` **before** falling through to the
global `trailweigh:background` key.

If the review-namespace key is absent (first-ever open before `seedFromLiveFiles`
wrote it), the initializer falls through to the global key as a last resort —
preserving the 025Q mechanism as a safety net.

### Part 3 — Checklist.tsx / handleBackgroundChange

When the reviewer explicitly changes background in the Review sandbox, also write
to the review-namespace key so CASE B reloads preserve the reviewer's choice over
the seeded default.

The existing global `BG_STORAGE_KEY` write is kept for remount resilience in
non-review mode and as a fallback.

---

## Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | `seedFromLiveFiles` — added review-namespace bg key write after global key block |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `background` useState initializer — added review-namespace read before normal path; `handleBackgroundChange` — added review-namespace write |

---

## Behavior After Fix

| Case | Before | After |
|---|---|---|
| CASE A (first visit, preset bg saved) | ✓ (global key seeded) | ✓ (review namespace + global key seeded) |
| CASE A (first visit, legacy-custom bg saved) | ✓ (normalized via LEGACY_PHOTO_ID_MAP) | ✓ (same, stored in review namespace) |
| CASE A (first visit, no bg saved) | White ✓ | White ✓ |
| CASE B (reviewer reloads, same source) | ❌ Global key may be polluted by owner tab | ✓ Review namespace holds seeded value, isolated from owner tab |
| CASE C (owner saved again, source changed) | ✓ (reseed) | ✓ (reseed writes review namespace) |
| Reviewer changes bg, then reloads | Preserved (global key) | Preserved (review namespace) |
