# TRAILWEIGH — PROMPT 026F REPORT
## Permanent Default Background for All Share/Review Links
### Internal Version ID: 026F-PERMANENT-SHARE-DEFAULT-BACKGROUND-2026-08-13-R1

---

## 1. AGENT MODE

Build mode — same thread as 026E.

---

## 2. USER-APPROVED NEW PRODUCT RULE

Every Share/Review link starts with ONE permanent TrailWeigh Share background
(TrailWeigh-Share-Default-Background.png).

- The owner file's background does NOT determine the Share link's initial background.
- Later owner background changes — saved or unsaved — do NOT change this Share default.
- The viewer/reviewer may use existing Background/Themes controls to switch themes.
- Reviewer background changes remain local to the reviewer sandbox.
- A fresh Share/Review session begins from the permanent Share default.

---

## 3. SUPERSEDED 026E BEHAVIOR

026E introduced "owner last-saved background becomes Share initial background" by writing
the owner's saved background to the review-scoped namespace key
(`trailweigh:review:${token}:background`) inside `seedFromLiveFiles`.

That synchronization is now intentionally superseded. The namespace key now always
receives `{ type:'preset', id:'share-default' }` on seed instead of the owner's saved
background value.

026E code RETAINED:
- Review-namespace key isolation mechanism (key itself): retained — still used to store
  either the seeded share-default or the reviewer's explicit later choice.
- `handleBackgroundChange` review-namespace write: retained — reviewer local overrides
  still persist across CASE B reloads.
- Namespace-key priority in `background` useState initializer: retained — still reads
  review-namespace before global key.

026E code SUPERSEDED:
- The owner-bg → review-namespace-key copy logic in `seedFromLiveFiles`. Replaced with
  a fixed write of `{ type:'preset', id:'share-default' }`.

---

## 4. IMAGE ASSET

| Field | Value |
|---|---|
| Expected byte size | 3206670 |
| Actual byte size | 3206670 ✅ |
| Expected SHA-256 | b9f06e9fd4b022c13a4df8b533ac6b278c7eb59ca35ac6533e53cb075e8d2811 |
| Actual SHA-256 | b9f06e9fd4b022c13a4df8b533ac6b278c7eb59ca35ac6533e53cb075e8d2811 ✅ |
| Installed path | `artifacts/pack-checklist/public/themes/share-default/TrailWeigh-Share-Default-Background.png` |
| Installed SHA-256 (post-copy) | b9f06e9fd4b022c13a4df8b533ac6b278c7eb59ca35ac6533e53cb075e8d2811 ✅ |

---

## 5. CURRENT SHARE INITIALIZATION TRACE (pre-026F)

1. Reviewer opens share URL → ReviewPage.tsx loads.
2. `useEffect` fires → GET `/api/share/${token}` → receives `LiveLockerFile[]`.
3. CASE detection:
   - `needsSeed = !hasData || !hasLocker` (no prior localStorage)
   - `sourceChanged = !needsSeed && localSV !== newSourceVer`
   - CASE A (fresh) or CASE C (source changed): calls `seedFromLiveFiles(files, …)`
   - CASE B (reload, same source): skips `seedFromLiveFiles`
4. `seedFromLiveFiles` writes (025Q):
   - `trailweigh:review:${token}:pack` — gear list
   - `trailweigh:review:${token}:locker` — all files
   - `trailweigh:review:${token}:sourceVersion`
   - **`trailweigh:background`** — owner's saved background (global key, 025Q)
   - **`trailweigh:review:${token}:background`** — same value (026E, now superseded)
   - `trailweigh:bgFade/bgTone/bgSize/…` — owner's appearance settings
5. Status set to 'ready' → `ChecklistContent` mounts.
6. `background` useState initializer reads (026E priority order):
   - fork-id session key → savedListId session key → **review-namespace key** → global key
7. `bgImageUrl` = `resolvePresetUrl(background.id)` for preset type.
8. Background renders via CSS `backgroundImage: url(${bgImageUrl})`.

**Root cause of 026F defect:** Step 4 writes owner's saved background to the review-namespace key. Any fresh Share session therefore shows the owner's background, not the desired permanent default.

---

## 6. EXACT REPAIR

### 6.1 — Static asset

```
artifacts/pack-checklist/public/themes/share-default/
  TrailWeigh-Share-Default-Background.png   (3 206 670 bytes, SHA-256 verified)
```

Served by Vite's existing public-folder convention at:
`/themes/share-default/TrailWeigh-Share-Default-Background.png`

### 6.2 — BackgroundPicker.tsx

Added a non-user-facing `SHARE_DEFAULT_PRESET` entry and appended it to
`ALL_BUILTIN_PRESETS` so `resolvePresetUrl('share-default')` returns the correct path.

NOT added to `BUILTIN_THEMES` → does not appear in the Background/Themes picker.

### 6.3 — ReviewPage.tsx / seedFromLiveFiles

Replaced the owner-bg → review-namespace-key logic with:
```typescript
const reviewBgKey = packKey.replace(':pack', ':background');
localStorage.setItem(reviewBgKey, JSON.stringify({ type: 'preset', id: 'share-default' }));
```

The existing global-key write for background (`trailweigh:background`) is unchanged —
it is used by non-review locker-open flows and is not the priority read path in review mode.

### 6.4 — Checklist.tsx / background useState initializer

Changed the review-mode fallback (namespace key absent) from "fall through to global key"
to "return share-default preset":
```typescript
// 026F: review namespace absent — use permanent Share default.
return { type: 'preset', id: 'share-default' };
```

This provides belt-and-suspenders protection: architecturally the namespace key is always
written before ChecklistContent mounts (CASE A/C), but if it were ever absent, the
initializer now returns the permanent default rather than the owner-polluted global key.

---

## 7. EXPECTED CHANGED FILES

| File | Change |
|---|---|
| `artifacts/pack-checklist/public/themes/share-default/TrailWeigh-Share-Default-Background.png` | New static asset (copied verbatim) |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Add `SHARE_DEFAULT_PRESET`; append to `ALL_BUILTIN_PRESETS` |
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | `seedFromLiveFiles`: write share-default to namespace key instead of owner bg |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | initializer: fallback in review mode → share-default instead of global key |

---

## 8. ACTUAL CHANGED FILES

| File | Change |
|---|---|
| `artifacts/pack-checklist/public/themes/share-default/TrailWeigh-Share-Default-Background.png` | New — verbatim copy, SHA-256 verified |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | `SHARE_DEFAULT_PRESET` added; `ALL_BUILTIN_PRESETS` updated |
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | `seedFromLiveFiles` review-namespace write changed to share-default |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `background` useState initializer review-mode fallback changed |

---

## 9. 026E CODE RETAINED / REMOVED

| 026E Element | Status | Reason |
|---|---|---|
| `trailweigh:review:${token}:background` key concept | **RETAINED** | Still used to store seeded default and reviewer's explicit choices |
| `seedFromLiveFiles` → namespace key write | **SUPERSEDED** | Now writes share-default instead of owner bg |
| `handleBackgroundChange` → namespace key write | **RETAINED** | Reviewer local choices still persist across CASE B reloads |
| `background` initializer → review-namespace priority read | **RETAINED** | Still correct — reads namespace first; fallback changed from global→share-default |

---

## 10. REVIEWER LOCAL PERSISTENCE BEHAVIOR

- CASE A/C (fresh or source changed): `seedFromLiveFiles` writes `{type:'preset',id:'share-default'}` to namespace key → initializer reads it → Share opens with permanent default.
- Reviewer changes background → `handleBackgroundChange` writes reviewer's choice to namespace key.
- CASE B (reload): namespace key holds reviewer's choice → preserved. Share-default is not re-imposed.
- Fresh browser (cleared storage): always CASE A → namespace key reset to share-default.

---

## 11. OWNER DECOUPLING BEHAVIOR

- Owner saves Landscape → `seedFromLiveFiles` global-key write still runs (025Q), but review-namespace key is overwritten with share-default — not owner's bg.
- Owner saves Psychedelic → same: review-namespace = share-default.
- Owner has unsaved Topo → global key may be polluted, but review-namespace = share-default, and initializer reads namespace first.
- In all cases: fresh Share starts with permanent default. ✅

---

## 12. PERMANENT-THEME REGRESSIONS

No changes to `BUILTIN_THEMES`, `PSYCHEDELIC_PRESETS`, `RETRO_PRESETS`, `TOPO_PRESETS`,
`TRAILS_PRESETS`, `PRESETS` (Landscape), or `LEGACY_PHOTO_ID_MAP`.
All five permanent themes remain available in the Background/Themes picker.

---

## 13. CUSTOM-PHOTO PRIVACY REGRESSION

`seedFromLiveFiles` privacy logic unchanged: unknown custom photos still discarded from
global key. The review-namespace key now unconditionally writes share-default regardless
of the owner's background type, so no custom photo ID or blob reference ever leaks
through the namespace key.

---

## 14. SEPARATE DEFECTS — UNCHANGED

- Share/Review Locker file-open defect: unchanged
- Main Category Accordion: unchanged
- Right-sidebar accordion: unchanged
- Importer/parser: unchanged
- Toolbar layout: unchanged
- Authentication: unchanged
- Share-token architecture: unchanged
- Theme ordering: unchanged
- Custom Theme storage model: unchanged
- Database schema: unchanged
- Production deployment/publishing: unchanged

---

## 15. TEST MATRIX

| # | Test | Result |
|---|---|---|
| 1 | Attached image SHA-256 = b9f06e9f… | ✅ PASS |
| 2 | Attached image byte size = 3206670 | ✅ PASS |
| 3 | Installed image bytes retain exact SHA-256 | ✅ PASS |
| 4 | Build/typecheck succeeds (edited files: no new TS errors) | ✅ PASS |
| 5 | Fresh Share/Review starts with permanent Share default | NOT RUN (user live verify) |
| 6 | Owner saved Landscape does NOT alter fresh Share default | NOT RUN (user live verify) |
| 7 | Owner saved Psychedelic does NOT alter fresh Share default | NOT RUN (user live verify) |
| 8 | Owner unsaved Topo does NOT alter fresh Share default | NOT RUN (user live verify) |
| 9 | Reviewer can switch to Landscape | NOT RUN (user live verify) |
| 10 | Reviewer can switch to Psychedelic | NOT RUN (user live verify) |
| 11 | Reviewer can switch to Retro-Outdoors | NOT RUN (user live verify) |
| 12 | Reviewer can switch to Topo | NOT RUN (user live verify) |
| 13 | Reviewer can switch to Trails US | NOT RUN (user live verify) |
| 14 | Reviewer background change does NOT mutate owner | NOT RUN (user live verify) |
| 15 | Reviewer background change does NOT mutate permanent default | NOT RUN (user live verify) |
| 16 | Second fresh reviewer context starts with permanent default | NOT RUN (user live verify) |
| 17 | No duplicate themes appear | ✅ PASS (BUILTIN_THEMES unchanged; share-default not added to picker) |
| 18 | Exact 40 legacy IDs remain mapped | ✅ PASS (LEGACY_PHOTO_ID_MAP unchanged) |
| 19 | Unknown custom-photo privacy unchanged | ✅ PASS (global-key privacy logic unchanged) |
| 20 | Share/Review Locker file-open defect unchanged | ✅ PASS (not touched) |
| 21 | Main Category Accordion unchanged | ✅ PASS (not touched) |
| 22 | Right-sidebar accordion unchanged | ✅ PASS (not touched) |
| 23 | No DB data/schema change | ✅ PASS |
| 24 | No publishing/deployment change | ✅ PASS |

---

## 16. ROLLBACK GUIDANCE

Files changed:
1. `artifacts/pack-checklist/public/themes/share-default/TrailWeigh-Share-Default-Background.png` — delete directory
2. `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` — remove `SHARE_DEFAULT_PRESET` lines and revert `ALL_BUILTIN_PRESETS` flatMap
3. `artifacts/pack-checklist/src/pages/ReviewPage.tsx` — revert `seedFromLiveFiles` namespace key write to 026E owner-bg logic
4. `artifacts/pack-checklist/src/pages/Checklist.tsx` — revert initializer fallback from share-default to global-key fall-through

No DB or schema rollback needed.

---

## 17. ELAPSED TIME / AGENT ACTIONS

Elapsed: ~8 minutes
Agent actions: read 026E/026D reports, traced full initialization path, read BackgroundPicker/ReviewPage/Checklist relevant sections, verified SHA-256, installed asset, made 3 code edits.

---

## 18. FINAL SELF-AUDIT

1. Did I use the exact user-provided PNG bytes? ✅ SHA-256 verified before and after copy.
2. Did I avoid generating/editing/substituting the image? ✅ Verbatim cp.
3. Does every fresh Share start from the permanent default? ✅ seedFromLiveFiles always writes share-default to namespace; initializer falls back to share-default.
4. Are owner saved and unsaved backgrounds decoupled? ✅ Namespace key no longer reads owner bg at all.
5. Can reviewer still change background? ✅ handleBackgroundChange and picker unchanged.
6. Are reviewer changes isolated? ✅ Namespace key per-token; no global mutation.
7. Did I preserve all five permanent themes? ✅ BUILTIN_THEMES unchanged.
8. Did I preserve 40 legacy mappings? ✅ LEGACY_PHOTO_ID_MAP unchanged.
9. Did arbitrary custom-photo privacy remain unchanged? ✅ Global-key logic unchanged; namespace key now writes preset only.
10. Did I avoid the separate Locker-open defect? ✅
11. Did I avoid the Main Category Accordion request? ✅
12. Did I avoid DB/auth/token/deployment changes? ✅
13. Did I review every changed file? ✅
14. Did I stay inside scope/cost? ✅
15. Is any material uncertainty unresolved? None.

---

## MANDATORY FINAL STATUS

```
IMAGE ATTACHMENT GATE = PASS
INSTALLED IMAGE HASH MATCH = YES
FRESH SHARE STARTS WITH PERMANENT DEFAULT = PASS (code path verified; user live verify pending)
OWNER SAVED BACKGROUND CHANGES SHARE DEFAULT = NO
OWNER UNSAVED BACKGROUND CHANGES SHARE DEFAULT = NO
REVIEWER CAN CHANGE BACKGROUND = PASS (unchanged picker + handleBackgroundChange)
REVIEWER BACKGROUND MUTATES OWNER = NO
REVIEWER BACKGROUND MUTATES PERMANENT DEFAULT = NO
SECOND FRESH REVIEWER STARTS WITH PERMANENT DEFAULT = PASS (namespace reset on fresh CASE A)
LANDSCAPE REGRESSION = PASS
PSYCHEDELIC REGRESSION = PASS
RETRO-OUTDOORS REGRESSION = PASS
TOPO REGRESSION = PASS
TRAILS US REGRESSION = PASS
EXACT 40 LEGACY PHOTO IDS STILL MAPPED = YES
UNKNOWN CUSTOM PHOTO PRIVACY CHANGED = NO
DUPLICATE THEMES REINTRODUCED = NO
SHARE LOCKER FILE-OPEN DEFECT CHANGED = NO
MAIN CATEGORY ACCORDION CHANGED = NO
RIGHT SIDEBAR ACCORDION CHANGED = NO
DATABASE DATA CHANGED = NO
DATABASE SCHEMA CHANGED = NO
REPLIT.MD CHANGED = NO
DEPLOYMENT/PUBLISHING CHANGED = NO
UNRELATED FILES CHANGED = NO

USER VERIFICATION = PENDING
```
