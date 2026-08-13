# PROMPT 026B REPORT
## MAKE ALL PERMANENT THEMES USE LANDSCAPE'S WORKING PERMANENT/SHARE ARCHITECTURE

**Internal Version ID:** 026B-PERMANENT-THEME-PARITY-GOLD-2026-08-13-R3  
**Agent mode:** Economy  
**Generated:** 2026-08-13 (pre-implementation — root-cause gate report)  
**replit.md reviewed read-only:** YES  
**Active render/save/share path verified:** YES  

---

## USER-VERIFIED STARTING STATE

- Landscape background transfers to Share/Review = **PASS**  
- Psychedelic, Retro-Outdoors, Topo, Trails US backgrounds in Share/Review = **FAIL**  
- Locker file-open issue in Share/Review = OUT OF SCOPE (not changed)  
- All five themes are visible in the live Themes dropdown

---

## SUPERSEDED / DISPROVEN EARLIER FINDINGS

**SUPERSEDED:** Prior diagnostic reports stated that only Landscape existed in source and the other themes had been removed from code.  

**CURRENT TRUTH:** The other four themes exist in the user's live UI as user-created *custom collections* stored in `localStorage['trailweigh:photoCollections']`, not as built-in code entries. Their photos are binary blobs in IndexedDB. The prior conclusion was correct about source code (no built-in entries existed) but wrong in inferring those themes were "missing from the UI" — they are present as custom collections seeded by the user.

---

## LANDSCAPE END-TO-END TRACE

| Step | File / Symbol | Detail |
|---|---|---|
| A. Theme menu definition | `BackgroundPicker.tsx:89-100` | `PRESETS` array — 10 entries with `{ id, label, photoId }` |
| B. Stable theme ID | `BackgroundPicker.tsx:290, 355` | `activeThemeId === 'landscapes'` → dropdown shows "Landscape" |
| C. Image source | `BackgroundPicker.tsx:103-108` | `getFullUrl(photoId)` → `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop` |
| D. Selected-background state | `BackgroundPicker.tsx:1413` | `onBackgroundChange({ type: 'preset', id: p.id })` |
| E. Persistence | `Checklist.tsx:BG_STORAGE_KEY` | `localStorage['trailweigh:background'] = JSON.stringify({ type:'preset', id:'rocky-mountains' })` |
| F. Save serialization | `Checklist.tsx:1641-1654` | `entry.background = background` — stored as `{ type:'preset', id:'...' }` |
| G. Locker payload | `lockerApi.ts:serverSaveNew/Replace` | Sends `background: { type:'preset', id:'...' }` to server |
| H. Saved-file load resolver | `Checklist.tsx:912-913` | `PRESETS.find(p => p.id === background.id)?.photoId` → Unsplash URL |
| I. Public/share DTO | `shareLink.ts:SharePayload` | `background?: Background` — serialized as-is |
| J. Review seed | `ReviewPage.tsx:357-363` | `if (bg?.type === 'preset')` → writes to `trailweigh:background` localStorage ✓ |
| K. Review background resolver | `Checklist.tsx:912-913` | Same PRESETS lookup — works for reviewer because Unsplash URL needs no auth |
| L. Final rendered image | `Checklist.tsx:2021` | `background-image: url(${bgImageUrl})` via CSS inline style |

**Why Landscape works:** `{ type:'preset' }` → passes through ReviewPage filter → resolved via Unsplash URL → no IndexedDB blob needed by reviewer.

---

## NON-LANDSCAPE TRACE (Psychedelic / Retro-Outdoors / Topo / Trails US)

| Step | Current State | Difference from Landscape |
|---|---|---|
| A. Theme menu definition | Entries in `localStorage['trailweigh:photoCollections']` as `PhotoCollection` objects | NOT in source code — user-created custom collections |
| B. Stable theme ID | UUID (e.g., `"a3f8b1c2-..."`) — changes per browser | NOT a stable built-in ID |
| C. Image source | IndexedDB blob in `trailweigh/bgPhotos` by `photoId` | Owner-only; no public URL |
| D. Selected-background state | `onBackgroundChange({ type: 'custom', photoId: '...' })` | **DIFFERENT TYPE** — `'custom'` not `'preset'` |
| E. Persistence | `localStorage['trailweigh:background'] = { type:'custom', photoId:'...' }` | Custom type persisted |
| F. Save serialization | `entry.background = { type:'custom', photoId:'...' }` | Custom type sent to server |
| G. Locker payload | `background: { type:'custom', photoId:'...' }` in DB | ⚠️ Custom type in server payload |
| H. Saved-file load resolver | `Checklist.tsx:914` → `customBgObjectUrl` → IndexedDB lookup | ✓ Works for owner on their own device |
| **I. FIRST FAILURE: ReviewPage filter** | `ReviewPage.tsx:362-363` `else { localStorage.removeItem('trailweigh:background') }` | **Custom type is discarded** — reviewer's browser cannot access owner's IndexedDB |
| J. Review seed | `background` set to `null` | No background seeded for reviewer |
| K. Review resolver | `background === null` → `bgImageUrl === null` | No image rendered |
| L. Final render | White/transparent — no background | **FAIL** |

---

## OBSERVED FACTS

1. `BackgroundPicker.tsx` has exactly ONE built-in theme ID: `'landscapes'` (`BUILT_IN_IDS = ['landscapes']`, line 516).
2. The 10 Landscape photos are in `PRESETS[]`, each with `{ id, label, photoId }`.
3. `Checklist.tsx:913` resolves preset background URL via: `PRESETS.find(p => p.id === background.id)?.photoId` — searches ONLY the 10 PRESETS entries.
4. Psychedelic, Retro-Outdoors, Topo, Trails US are currently **user custom collections** in localStorage/IndexedDB, NOT built-in entries.
5. `ReviewPage.tsx:seedFromLiveFiles:358` only passes `type === 'preset'` backgrounds to reviewers. `type === 'custom'` is explicitly cleared.
6. Selecting a photo from any non-Landscape theme calls `onBackgroundChange({ type: 'custom', photoId })` — the wrong type for Share/Review portability.

---

## CONFIRMED ROOT CAUSE

**Two-part failure, same architectural gap:**

**Part 1 — Wrong storage type:** Psychedelic/Retro-Outdoors/Topo/Trails US photos are stored as `{ type: 'custom', photoId }` because they are custom user collections, not built-in presets. This type is the same as user-uploaded custom photos.

**Part 2 — Reviewer filter:** `ReviewPage.seedFromLiveFiles` correctly refuses to forward `type: 'custom'` backgrounds to reviewers (to avoid exposing owner-only IndexedDB blobs). This filter cannot be bypassed safely without knowing which custom photos are "public" vs. "private" — and there is no such distinction in the current type system.

**Implication:** The only safe fix is to give these four themes the same `{ type: 'preset' }` architecture as Landscape, with publicly resolvable Unsplash URLs — removing any IndexedDB dependency for permanent themes.

---

## STILL UNKNOWN

Nothing material. The failure mechanism is fully traced and confirmed. No unknowns remain for the defined scope.

---

## FILES EXPECTED TO CHANGE

1. `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`  
   — Add 4 new built-in preset arrays (PSYCHEDELIC_PRESETS, RETRO_PRESETS, TOPO_PRESETS, TRAILS_PRESETS)  
   — Add BUILTIN_THEMES registry and ALL_BUILTIN_PRESETS flat export  
   — Update BUILT_IN_IDS check to include all 5 theme IDs  
   — Update dropdownLabel to look up from BUILTIN_THEMES  
   — Update dropdown rendering to show all 5 built-in themes  
   — Update panel render to show each theme's photo grid

2. `artifacts/pack-checklist/src/pages/Checklist.tsx`  
   — Import ALL_BUILTIN_PRESETS  
   — Update preset resolver (line 913) from `PRESETS.find(...)` to `ALL_BUILTIN_PRESETS.find(...)`

No other files change.

---

## LEGACY COMPATIBILITY

- Old `{ type: 'preset', id: 'rocky-mountains' }` → still found in `ALL_BUILTIN_PRESETS` (PRESETS is included). ✓
- Old `{ type: 'custom', photoId }` for user-uploaded photos → unchanged; still resolved via IndexedDB. ✓
- Users who previously created custom collections named "Psychedelic" etc. → those custom collections still exist as custom themes; they are unaffected by the new built-in entries (the new themes have stable string IDs like `'psychedelic'`, while user collections have UUID IDs).
- No DB rows change. No migration needed.

---

*Root-cause gate passed — proceeding to implementation.*
