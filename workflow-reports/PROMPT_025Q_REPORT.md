# PROMPT 025Q REPORT
- Prompt: 025Q
- Status: IMPLEMENTED — USER VERIFICATION PENDING
- Agent mode: Economy
- owner screenshot accessible: YES — landscape background visibly applied, "Sample List Live Test" open
- review screenshot accessible: YES — plain white background, Background/Themes panel open showing only Landscape group
- report created before application changes: YES (initial stub created first)
- actual time: ~15 minutes

---

## PHASE 2 — CHECKPOINT

CHECKPOINT = NOT AVAILABLE

---

## PHASE 3 — THEME ARCHITECTURE INVENTORY

| Item | Finding |
|------|---------|
| Component rendering Background/Themes in Home | `BackgroundPickerPanel` — `artifacts/pack-checklist/src/components/BackgroundPicker.tsx:245` |
| Component rendering Background/Themes in Review | **SAME** — `ChecklistContent` renders `<BackgroundPickerPanel ...>` in both modes |
| Same component path | **YES** — Review uses `ChecklistContent isGuest reviewToken`; the picker is identical |
| Permanent theme registry source | `PRESETS` array — `BackgroundPicker.tsx:89-100` |
| Built-in theme group names | ONE group: **Landscape** (group ID: `landscapes`), 10 Unsplash presets |
| Preset IDs | rocky-mountains, swiss-alps, forest, lake-reflection, desert-dunes, snowy-peaks, green-valley, foggy-mountains, coast, starry-night |
| Preset asset type | Remote Unsplash URLs generated at runtime: `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop` — NOT bundled imports, NOT localStorage |
| Custom Theme storage | Metadata: `localStorage['trailweigh:photoCollections']`; Image blobs: IndexedDB `trailweigh / bgPhotos` |
| Custom Theme in Review | NOT transferred (private to owner's browser) — intentional |
| Appearance fields in LockerEntry | `background, bgFade, bgTone, bgSize?, chartPaletteKey?, barColor?, barFont?, barTextColor?, barTransparency?` |
| Appearance fields in 025P live DTO | All the above — server maps `p.background, p.bgFade, p.bgTone, p.bgSize, p.chartPaletteKey, p.barColor, p.barFont, p.barTextColor, p.barTransparency` |
| Appearance fields written by `seedFromLiveFiles` (pre-025Q) | All of the above — written into `reviewLockerKey` LockerEntry array entries ✓ |
| Global appearance keys read by ChecklistContent init | `trailweigh:background` (BG_STORAGE_KEY), `trailweigh:bgFade`, `trailweigh:bgTone`, `trailweigh:bgSize`, `trailweigh:chartPalette`, `trailweigh:barColor`, `trailweigh:barFont`, `trailweigh:barTextColor`, `trailweigh:barTransparency` |
| Appearance written to global keys by `seedFromLiveFiles` (pre-025Q) | **NONE** — this is the root cause |

**HOME BUILT-IN THEME REGISTRY SOURCE = `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` — `PRESETS` array**

**REVIEW BUILT-IN THEME REGISTRY SOURCE = SAME (shared component, shared PRESETS array)**

**SAME REGISTRY? YES**

---

## PHASE 4 — OWNER APPEARANCE SIGNATURE

| Field | Value |
|-------|-------|
| Current file name | `Sample List Live Test` (per owner screenshot showing renamed file from 025P) |
| Background type | `{ type: 'preset', id: '<landscape-id>' }` — Unsplash landscape photo visible |
| Background asset | Remote Unsplash URL; bundled/public (no auth required) |
| Landscape group | Landscape (one of the 10 rocky-mountains / swiss-alps / forest / etc. presets) |
| Light/Dark | Light (per visible UI — no dark overlay) |
| Darken/bgFade | Partial (photo visible through semi-transparent panel) |
| Bar Color | Gray/muted (default or custom — exact value not read from DB) |
| Transparency | Partial transparency (panel semi-transparent over background) |
| Fill/Fit | Cover (standard landscape fill) |
| Text Color / Font | Not visible in screenshot |
| Storage | `locker_entries.payload` in DB; `trailweigh:locker` in owner localStorage |

---

## PHASE 5 — LIVE PUBLIC DTO APPEARANCE TRACE

The 025P GET resolver (`artifacts/api-server/src/routes/links.ts:71-115`) maps each `lockerRows` entry to:
```
background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency
```
All from `r.payload` (the JSONB column). These ARE the owner's saved appearance values.

**All appearance fields present in the public DTO: YES**

The server does NOT drop, rename, or transform any appearance field. The DTO correctly includes the owner's saved `{ type:'preset', id:'...' }` background reference.

**Is a private Custom asset exposed?** NO — the DTO includes `background: { type:'preset', id:'...' }` (a bundled Unsplash reference). Custom backgrounds `{ type:'custom', photoId }` would reference a photoId whose blob lives in the owner's IndexedDB — not accessible to the reviewer. The 025Q fix in `seedFromLiveFiles` only writes preset backgrounds to the global key, guarding against this case.

---

## PHASE 6 — REVIEW SANDBOX APPEARANCE MAPPING (pre-025Q)

```
GET /api/links/:token → { type:'live-locker', files: [{ background, bgFade, ... }], sourceVersion }
    ↓
seedFromLiveFiles() in ReviewPage.tsx
    ↓ writes to:
    reviewLockerKey (LockerEntry array — includes appearance fields per entry) ✓
    reviewPackKey   (gear data only — {items, order, meta}) ✓
    ACTIVE_LOCKER_FILE_SS_KEY (sessionStorage) ✓
    trailweigh:background           ← NOT WRITTEN (root cause)
    trailweigh:bgFade               ← NOT WRITTEN (root cause)
    trailweigh:bgTone               ← NOT WRITTEN (root cause)
    trailweigh:bgSize               ← NOT WRITTEN (root cause)
    trailweigh:chartPalette         ← NOT WRITTEN (root cause)
    trailweigh:barColor/Font/etc.   ← NOT WRITTEN (root cause)
    ↓
setStatus('ready') → ChecklistContent mounts
    ↓
background useState lazy initializer reads:
    → no fork/newseed sessionStorage keys (not applicable in review) → no value
    → no tw-savedlist-bg (not applicable)                            → no value
    → localStorage.getItem('trailweigh:background')                  → NULL (never written)
    → returns null
    ↓
Background renders as null → PLAIN WHITE
```

**Appearance discarded at:** `seedFromLiveFiles` — the function correctly receives and stores appearance in LockerEntries but never writes to the global keys ChecklistContent's initializers read.

**022G startup restoration skipped:** line 1557 `if (!userId) return;` — review mode has no userId.

**`handleLoadFromLocker` (which would apply appearance) NOT auto-called on mount** — it's only triggered by user clicking a file in the Locker panel.

---

## PHASE 7 — THEME REGISTRY PARITY

**HOME THEME GROUPS:** Landscape (10 Unsplash presets) + user Custom Theme groups (private localStorage/IndexedDB)

**REVIEW THEME GROUPS (before fix):** Landscape (10 Unsplash presets) only — Custom Theme groups absent (expected and correct — private)

**FIRST THEME-REGISTRY DIVERGENCE:** NONE for permanent/bundled themes. Both Home and Review use the exact same `BackgroundPicker` component with the same `PRESETS` array. The built-in registry is identical.

The user-visible difference ("only Landscape visible in Review while owner sees more groups") is because the OWNER has user-created Custom Theme groups stored in their browser's localStorage/IndexedDB. These are private and intentionally absent in Review.

**Groups referenced in prompt (Retro-Outdoors, Psychedelic, Topo 1):** NOT present in current codebase. Current permanent registry has Landscape only. No fix needed — both Home and Review share the same single permanent group.

---

## PHASE 8 — ROOT-CAUSE GATE

**BACKGROUND ROOT CAUSE =**
`seedFromLiveFiles` in `ReviewPage.tsx` writes appearance fields into the `reviewLockerKey` LockerEntry array but does NOT write to the global localStorage keys that ChecklistContent's lazy `useState` initializers read on first render (`trailweigh:background`, `trailweigh:bgFade`, `trailweigh:bgTone`, `trailweigh:bgSize`, etc.). The 022G startup restoration that would normally apply a loaded file's appearance is skipped in review mode (`!userId`). `handleLoadFromLocker` is not auto-called on mount. Result: background initialises as null → plain white.

**THEME-REGISTRY ROOT CAUSE =**
NO ROOT CAUSE — both Home and Review use the same `BackgroundPicker` component with the same `PRESETS`. The missing "extra" theme groups are user-created Custom Themes (private, intentionally absent) or theme groups not yet implemented in the codebase (Retro-Outdoors/Psychedelic/Topo 1 referenced in prompt but not present in current source).

**CHOICE: A — SINGLE ROOT CAUSE** (background propagation to global keys missing). Theme registry parity is already correct for permanent themes.

---

## PHASE 9 — SMALLEST SAFE FIX (IMPLEMENTED)

**One file changed:** `artifacts/pack-checklist/src/pages/ReviewPage.tsx`
**One function modified:** `seedFromLiveFiles()`

Added at the end of `seedFromLiveFiles` (before `setActiveFileSS`):

```ts
// Write primary file's appearance to global localStorage keys so ChecklistContent's
// lazy state initializers pick up the correct appearance on first render.
// Only preset backgrounds (bundled Unsplash URLs) are safe to apply globally —
// custom backgrounds reference owner IndexedDB blobs not available to the reviewer.
const bg = primary.background as { type?: string } | null;
if (bg?.type === 'preset') {
  localStorage.setItem('trailweigh:background', JSON.stringify(primary.background));
} else {
  localStorage.removeItem('trailweigh:background');
}
localStorage.setItem('trailweigh:bgFade', String(primary.bgFade ?? 1));
localStorage.setItem('trailweigh:bgTone', primary.bgTone ?? 'light');
localStorage.setItem('trailweigh:bgSize', primary.bgSize ?? 'cover');
if (primary.chartPaletteKey) localStorage.setItem('trailweigh:chartPalette', primary.chartPaletteKey);
else                          localStorage.removeItem('trailweigh:chartPalette');
if (primary.barColor)        localStorage.setItem('trailweigh:barColor', primary.barColor);
else                         localStorage.removeItem('trailweigh:barColor');
if (primary.barFont)         localStorage.setItem('trailweigh:barFont', primary.barFont);
else                         localStorage.removeItem('trailweigh:barFont');
if (primary.barTextColor)    localStorage.setItem('trailweigh:barTextColor', primary.barTextColor);
else                         localStorage.removeItem('trailweigh:barTextColor');
localStorage.setItem('trailweigh:barTransparency', String(primary.barTransparency ?? 1));
```

**Timing:** `seedFromLiveFiles` executes synchronously inside the `useEffect`, before `setStatus('ready')`. ChecklistContent mounts AFTER status changes to 'ready' — after the writes. The lazy `useState` initializers read the written values on first render. No async race condition.

**CASE B (source unchanged):** `seedFromLiveFiles` is NOT called — reviewer's local appearance changes (global keys) are preserved. ✓

**CASE C (source changed):** `seedFromLiveFiles` IS called — overwrites global keys with latest owner appearance. Reviewer sandbox is intentionally reset. ✓

---

## PHASE 10 — BUILT-IN THEME PUBLIC-ASSET RULE

Permanent/bundled theme assets (Landscape presets) are remote Unsplash URLs generated from bundled photoId strings. These require no authentication and work identically in owner Home, signed-out Review, and deployed app.

Custom Theme private photos (IndexedDB blobs) require the owner's browser and are never transferred. `seedFromLiveFiles` explicitly guards: `if (bg?.type === 'preset')` — custom backgrounds are silently converted to no-background in Review rather than exposing owner blobs.

---

## RUNTIME TESTS

Agent cannot perform signed-in owner + signed-out reviewer browser sessions.

**Build verification:** HMR update of `ReviewPage.tsx` — no TypeScript/compile errors.

| Test | Status |
|------|--------|
| Phase 11 — Saved background appears in Review | NOT TESTED (requires browser session) |
| Phase 12 — Theme registry parity | NOT TESTED at runtime (code-verified: same BackgroundPicker component, same PRESETS) |
| Phase 13 — Custom Theme stays private | NOT TESTED at runtime (code-verified: type guard in seedFromLiveFiles) |
| Phase 14 — Owner background change reflected in same URL | NOT TESTED |

---

## APPEARANCE FIELD PARITY (post-fix)

| Field | In live DTO? | Written to global key? | ChecklistContent reads it? |
|-------|-------------|----------------------|--------------------------|
| background (preset) | YES | YES — `trailweigh:background` | YES — `localStorage.getItem(BG_STORAGE_KEY)` |
| background (custom) | YES (ID only, no blob) | NO (type guard prevents) | N/A — no blob available |
| bgFade | YES | YES — `trailweigh:bgFade` | YES |
| bgTone | YES | YES — `trailweigh:bgTone` | YES |
| bgSize | YES | YES — `trailweigh:bgSize` | YES |
| chartPaletteKey | YES | YES — `trailweigh:chartPalette` | YES |
| barColor | YES | YES — `trailweigh:barColor` | YES |
| barFont | YES | YES — `trailweigh:barFont` | YES |
| barTextColor | YES | YES — `trailweigh:barTextColor` | YES |
| barTransparency | YES | YES — `trailweigh:barTransparency` | YES |

---

## TARGETED REGRESSION

| Item | Status |
|------|--------|
| 025P same-URL filename update | PASS (code-verified: seedFromLiveFiles unchanged for name/store seeding) |
| Current owner filename live | PASS (live-locker architecture unchanged) |
| 025M concise URL | PASS (unchanged) |
| No-login Review | PASS (unchanged) |
| Welcome modal | PASS (unchanged) |
| Review Hide | PASS (not touched) |
| Review New → sign-in (intentional) | PASS (not touched) |
| 025K Background Light/Dark | PASS (BackgroundPicker not changed; only ReviewPage seeding) |
| Owner theme/background controls | PASS (Checklist.tsx not changed) |
| Review theme changes don't write owner data | PASS (reviewer writes only to global keys in their own browser; owner DB unchanged) |
| Importer/parser/OCR | PASS (not touched) |
| Standalone top-toolbar Print absent | PASS (not touched) |
| CASE B local preservation | PASS (global keys only overwritten when seedFromLiveFiles is called; CASE B skips it) |
| Pre-025P frozen links | PASS (frozen-snapshot path in ReviewPage unchanged) |

---

## SCREENSHOT EVIDENCE

`workflow-reports/025Q-OWNER-APPEARANCE.png` — NOT AVAILABLE (agent cannot perform signed-in session)
`workflow-reports/025Q-REVIEW-APPEARANCE.png` — NOT AVAILABLE

---

## EXACT FILES CHANGED

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | Added global appearance key writes to `seedFromLiveFiles` — 10 localStorage setItem/removeItem calls for background, bgFade, bgTone, bgSize, chartPalette, barColor, barFont, barTextColor, barTransparency |

**Schema change:** NO
**API change:** NO
**Files changed:** 1

---

## CUSTOM THEME HANDLING

Custom Theme groups (user-created) are stored in:
- Metadata: `localStorage['trailweigh:photoCollections']` — owner's browser only
- Image blobs: IndexedDB `trailweigh/bgPhotos` — owner's browser only

These are NOT included in the public live DTO (the server only reads from `lockerEntriesTable.payload` which contains the background reference `{type:'preset'|'custom', ...}` but NOT the actual blob). `seedFromLiveFiles` guards: if `background.type !== 'preset'`, the global background key is cleared (no-background fallback). Custom theme metadata and blobs remain private to the owner's browser.

---

## UNRESOLVED ISSUES

- Runtime browser tests (Phases 11-14) require authenticated owner + signed-out reviewer session — agent cannot perform these. USER VERIFICATION REQUIRED.
- Retro-Outdoors, Psychedelic, Topo 1 theme groups: NOT present in current codebase. These are future work, not a 025Q defect (both Home and Review show Landscape only — parity is correct).

---

## USER VERIFICATION = PENDING

User will verify:
1. Open same public Review URL (signed out / private browser).
2. Review shows the owner's saved built-in landscape background (not plain white).
3. Open Background/Themes in Review — same groups visible as Home (Landscape + any Custom Themes the reviewer creates locally).
4. Select a non-active landscape preset in Review — image renders without auth.
5. Owner changes the saved file background to a DIFFERENT landscape preset and saves.
6. Reload SAME Review URL — new background appears.
7. Owner restores background — reload SAME Review URL — original background returns.
8. Reviewer changes background locally — owner source unchanged — reload preserves reviewer's choice (CASE B).
9. Owner saves a source change — reload SAME Review URL — Review reseeds to owner's latest appearance (CASE C).
10. Review Hide still works.
11. Review New still opens sign-in (acceptable for now).
