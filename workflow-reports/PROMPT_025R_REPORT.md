# PROMPT 025R REPORT
# COMPREHENSIVE WHOLE-TRAILWEIGH QUESTION / LEARNING AUDIT

- Prompt: 025R
- Status: COMPLETE
- Agent mode: Economy (Build — diagnostic only, no code changed)
- Diagnostic only: YES
- Application code changes allowed: NO
- Application code changed: NONE
- Report created before investigation: YES (stub created first)
- Actual time: ~25 minutes
- Actions: Read ~15 source files, ran ~20 shell grep/search commands, dispatched 1 read-only explore subagent
- Lines read: ~3000 across key files

---

## PHASE 2 — NO-CODE-CHANGE BASELINE

`git diff --name-only HEAD` returned no output (no staged/unstaged application changes).

Pre-existing application change from 025Q:
- `artifacts/pack-checklist/src/pages/ReviewPage.tsx` — global localStorage appearance writes added to `seedFromLiveFiles()`.

No new application file changes introduced by 025R.

---

## PAST PROMPT IMPACT MAP

### 025K (Background Light/Dark portal fix)
1. Files changed: `Checklist.tsx` (BackgroundPickerPanel portal targeting, screen-dark class scope)
2. Intended: Light/Dark toggle stays inside the checklist panel; `screen-dark` class applies to correct DOM subtree
3. Claimed: Portal fix isolated theme-scope to `screen-only` div
4. User-verified: PASS
5. PASS ✓
6. Root cause claimed: screen-dark applied to wrong root element
7. Disproven later? No
8. Code still exists: `screen-dark` class on `div.screen-only` (line 2012), BackgroundPickerPanel portal target
9. Code superseded: None
10. Dead/legacy: None
11. Duplicated: None
12. Added fallback: No
13. Temporary became permanent: No
14. Changed storage/routing: No
15. Regression risk: YES — any background DOM restructure could break dark-mode scope

### 025L (Initial `/s/:token` ReviewPage / public share scaffolding)
1. Files changed: ReviewPage.tsx (created), App.tsx (route added), links.ts (frozen snapshot path)
2. Intended: `/s/:token` route serving frozen payload to public reviewer
3. Claimed: First no-login Review page
4. User-verified: PASS (basic load)
5. PASS ✓
6. Root cause: No prior public Review route
7. Still present: `/s/:token` route, ReviewPage.tsx shell
8. Code superseded: Frozen snapshot logic mostly superseded by 025P live-locker path (but still active for legacy links)
9. Dead/legacy: SharedChecklistPage still mounted at `/shared` (App.tsx line 219) — legacy
10. Duplicated: SharedChecklistPage and ReviewPage overlap in purpose for `/shared` path
11. Added fallback: YES — frozen-snapshot backward compat path still active
12. Temporary became permanent: YES — frozen snapshot backward compat

### 025M (Concise 10-char hex share URL)
1. Files changed: links.ts (POST), share UI, ReviewPage.tsx
2. Intended: Shorter public URLs
3. User-verified: PASS
4. Code still exists: `randomBytes(5).toString('hex')` in POST handler

### 025N (Review namespace / downstream seed repair)
1. Intended: Fix Review sandbox seeding from frozen payload
2. Root cause claimed: Downstream seed (Review) was wrong
3. Disproven: Upstream data (live DTO background) was the real gap — downstream seed repair was patching wrong layer

### 025O (Name fallback in share handlers)
1. Intended: Patch frozen-snapshot share name field
2. Superseded: 025P live-locker architecture made frozen-name fallbacks irrelevant for live sharing
3. Dead code: The `activeLockerFile?.name` fallbacks in `handleShareLocker` remain in Checklist.tsx but only apply to the frozen-snapshot path now

### 025P (Live-locker share architecture)
1. Files changed: ReviewPage.tsx (full rewrite), links.ts (POST/GET live-locker), Checklist.tsx (handleShareLocker), shareLink.ts
2. Intended: Same URL always reflects current owner Locker state; no frozen snapshots for new links
3. User-verified: PASS (filename propagation confirmed via "Sample List" → "Sample List Live Test" rename)
4. sourceVersion fingerprint: `{ i: id, n: name, t: savedAt }` sorted by id — does NOT include appearance
5. Code still present: CASE A/B/C logic in ReviewPage.useEffect
6. Critical gap: sourceVersion does not detect appearance-only changes (background, bar color, etc.)

### 025Q (Global localStorage appearance writes)
1. Files changed: ReviewPage.tsx (seedFromLiveFiles — added global localStorage writes)
2. Intended: Write owner appearance to `trailweigh:background`, `trailweigh:bgFade`, etc. before ChecklistContent mounts
3. User-verified: FAIL — no visible change in Review
4. Root cause claimed: seedFromLiveFiles didn't write to global keys that ChecklistContent lazy initializers read
5. Disproven: The writes ARE correctly ordered before mount. But the writes come FROM the server DTO, which reads from DB. If DB `payload.background` is null (owner set background after last Save without re-saving), the fix writes null and removes the key.
6. Code still present: global localStorage writes in seedFromLiveFiles
7. ADDITIONAL bug: In CASE B (returning reviewer), seedFromLiveFiles is not called at all — 025Q writes never happen

---

## CONTRADICTION AUDIT

### A. 025Q report said appearance values were present and restored, but user saw no change.

**Resolution:** The 025Q report assumed the DB payload had the background. The writes were correctly ordered (before mount), but the DATA was wrong — the server DTO returns what's in DB, which may be null if background was set after the last Save. Also, CASE B (returning reviewer with matching sourceVersion) means seedFromLiveFiles is never called. **025Q's assumption about data presence was unverified.**

### B. Prior TrailWeigh product history expects multiple permanent built-in theme groups, while 025Q report said only Landscape exists.

**Resolution:** CONFIRMED — current source has ONLY the Landscape group (10 Unsplash presets in PRESETS array, BackgroundPicker.tsx:89-100). No Retro-Outdoors, Psychedelic, or Topo 1 exist in current code. If owner sees more groups, they are user-created Custom Theme groups stored in their own browser (localStorage `trailweigh:photoCollections` + IndexedDB blobs). These are private and do NOT appear in a fresh Review session — this is correct behavior, not a bug. **Expect only "Landscape" in any fresh browser.**

### C. 025N attempted downstream Review seed repair, but upstream data was still wrong.

**Resolution:** CONFIRMED — the DB payload may not have the background field if it was set post-Save. No amount of downstream seeding fixes missing upstream data.

### D. 025O followed stale/older instructions instead of revised live-sharing requirement.

**Resolution:** CONFIRMED — 025O patched frozen-snapshot name fallbacks after 025P had already replaced that architecture for new links.

---

## CURRENT RUNTIME BACKGROUND QUESTIONS (Q20–Q32)

### Q20 / Q21 / Q22 / Q23 — DOM Node / Component

**OWNER and REVIEW both render via `ChecklistContent` → the same component path:**
- Element: `div.screen-only` at `Checklist.tsx:2011`
- Selector: `div[class*="screen-only"]` first child of `div.h-[100dvh].overflow-y-auto`
- Component: `ChecklistContent` exported from `Checklist.tsx`
- Background applied via inline `style.backgroundImage`
- **Q22: YES — same React component renders both Owner and Review backgrounds.**

**Owner computed values (inferred from source + preset registry):**
- `background-image`: `linear-gradient(rgba(255,255,255,0)),rgba(255,255,255,0))),url(https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop)` (the exact photoId depends on which preset is active)
- `background-size`: `100% 100%, cover` (or contain)
- `background-position`: `center`
- `background-repeat`: `no-repeat`

**Review computed values:**
- `background-image`: not set (no inline backgroundImage) → plain white
- Background `div.bg-background` CSS class provides white/light background color
- No Unsplash image loaded

**Q24/Q25:** Owner has URL-based backgroundImage; Review has none.

### Q29 / Q30 — Direct React state feeding background

**Both Owner and Review:** `background` React state (`useState<Background | null>`) in `ChecklistContent`. This state directly controls `bgImageUrl` (line 911-914) which feeds the inline style.

**Q31 / Q32:** Same hook (useState in same component). The VALUE differs, not the hook.

---

## OWNER APPEARANCE SOURCE-OF-TRUTH (Q33–Q46)

**Q33:** `background` React state in ChecklistContent (`Checklist.tsx:232`)

**Q34:** Initialization reads `localStorage['trailweigh:background']` (BG_STORAGE_KEY). State changes are also persisted to `localStorage['trailweigh:background']`. When a file is Saved, appearance is written to server DB `locker_entries.payload`. The AUTHORITATIVE runtime value is the React state, which at initialization comes from localStorage.

**Q35:** The exact preset ID is UNKNOWN without browser devtools. It is one of the 10 built-in Landscape presets (rocky-mountains, swiss-alps, forest, lake-reflection, desert-dunes, snowy-peaks, green-valley, foggy-mountains, coast, starry-night).

**Q36:** Theme group: `landscapes` (the only permanent built-in group).

**Q37:** `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop` — Unsplash CDN URL generated at runtime from the matching PRESETS entry.

**Q38:** Public CDN URL — no auth required, available to any browser.

**Q39 / Q40 / Q41:** When a Saved file is opened from the Locker:
- `handleLoadFromLocker` is called → `setBackground(entry.background)` (line 1780)
- This runs as an event handler (user click) — AFTER initial mount
- The 022G startup effect (`useEffect([])` at line ~1498) also auto-restores the last-active file ON FIRST MOUNT — but ONLY if `userId` is set (line 1500: `if (!userId) return`)

**Q42:** `Checklist.tsx` — `handleLoadFromLocker` and 022G startup effect

**Q43:** YES — Owner restoration via 022G effect requires `userId`. No userId = 022G exits immediately. Review has no userId.

**Q44 — Appearance fields that travel with the file (LockerEntry):**
background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency

**Q45 — Global-only appearance fields:**
None are strictly global-only, but the runtime state is kept in global localStorage keys:
- `trailweigh:background` — current background (also per-file in LockerEntry)
- `trailweigh:bgFade`, `trailweigh:bgTone`, `trailweigh:bgSize`
- `trailweigh:chartPalette`, `trailweigh:barColor`, `trailweigh:barFont`, `trailweigh:barTextColor`, `trailweigh:barTransparency`

**Q46:** No legacy duplicate keys found for the same setting (the above are the canonical keys).

---

## REVIEW APPEARANCE SOURCE-OF-TRUTH (Q47–Q62)

**Q47:** `background` React state in `ChecklistContent` — same state variable, different value path.

**Q48 — Before fetch resolves:** `background` initializes synchronously in the lazy `useState` initializer. For a fresh reviewer with NO prior localStorage, it reads `localStorage['trailweigh:background']` → null → `background = null`.

**Q49 — After public DTO resolves:** `setStatus('ready')` is called → ChecklistContent mounts → lazy initializer already ran → React state is locked. The DTO result cannot retroactively change `useState` initial value. The DTO data is IN storage by the time mount happens (025Q writes it), but if the DTO returned null background, the writes removed the key.

**Q50 — After seeding:** localStorage has the DTO's background value (or is empty if DTO had null). React state already initialized — can only change via `setBackground()` callback.

**Q51 — After ChecklistContent mounts:** `background` React state = whatever the lazy initializer returned (from localStorage at time of mount). If 025Q wrote a valid preset → React state has it. If DTO was null → 025Q removed the key → React state is null.

**Q52 — After all effects settle:** 022G startup effect SKIPS (no userId). No other effect auto-calls `setBackground`. State stays as initialized.

**Q53 — Does the owner background ID ever reach authoritative Review React state?**
ONLY IF: (1) server DB `payload.background` is non-null (owner saved with background active), AND (2) 025Q's `bg?.type === 'preset'` guard passes, AND (3) the reviewer hits CASE A or CASE C (not CASE B). All three conditions must be true simultaneously.

**Q54 — If it reaches state, what later overwrites it?** Nothing. The 022G effect is skipped; no other post-mount reset exists.

**Q55 — If it never reaches state, which step fails?** Either:
- A: DB `payload.background` is null → DTO returns null → 025Q removes the key → initializer gets null
- B: Returning reviewer hits CASE B → seedFromLiveFiles not called → 025Q never runs → initializer gets whatever was in localStorage before (may be null or reviewer's own choice)

**Q56:** YES — Review uses namespaced keys for gear data: `trailweigh:review:${token}:pack`, `:locker`, `:welcomed`, `:sourceVersion`. But appearance keys are GLOBAL: `trailweigh:background` etc.

**Q57:** YES — Review uses Owner/global appearance keys in 025Q writes. This is by design (025Q approach) but it means Review and Owner share these keys on the same browser.

**Q58:** Possible. If tester uses same browser for both Owner and Review, `trailweigh:background` is shared and may have the Owner's background from a previous test. This would make Review APPEAR to work in same-browser testing but fail in private/different-browser testing.

**Q59:** YES — CASE B/C logic reseeds `reviewPackKey` and `reviewLockerKey` but 025Q writes global appearance. If CASE B triggers, no appearance write happens at all.

**Q60:** YES — React `useState` initializers run once at mount. 025Q's writes happen before mount (when status goes from 'loading' to 'ready'), so timing is correct — but the DATA must be correct.

**Q61 — If 025Q writes before ready, why does mounted state still remain wrong?**
Because the DATA written by 025Q comes FROM the server DTO. If server DTO has null background (DB payload null), 025Q REMOVES the key. Initializer reads null. This is the data gap, not a timing gap.

**Q62 — Is Review component remounted or preserved across status transitions?**
ReviewPage renders a full-page spinner at `status === 'loading'` (line 187-196). ChecklistContent is rendered ONLY in the `status === 'ready'` branch. When status changes from loading to ready, ChecklistContent MOUNTS FRESH for the first time — it was not previously mounted. This confirms the 025Q timing assumption was correct in theory.

---

## RUNTIME TIMELINE (Q63–Q71)

```
T0  Review route navigates to /s/:token
    ReviewPage mounts with status='loading'
    Renders: spinner only (ChecklistContent NOT mounted)

T1  useEffect fires → fetch GET /api/links/:token starts

T2  Server resolves DB queries (lockerRows for ownerId)
    sourceVersion computed from { i, n, t } fingerprint
    DTO returned: { type:'live-locker', files, sourceVersion }
    files[0].background = r.payload.background (may be null)

T3  CASE A/B/C decision:
    — CASE A (hasData=false): seedFromLiveFiles called
    — CASE B (hasData=true, SV matches): seedFromLiveFiles SKIPPED
    — CASE C (hasData=true, SV differs): seedFromLiveFiles called

T4  If CASE A or C: seedFromLiveFiles writes:
    — reviewPackKey, reviewLockerKey, svKey (gear + locker data)
    — 025Q: trailweigh:background (from DTO; may REMOVE key if DTO null)
    — 025Q: trailweigh:bgFade/bgTone/bgSize/chartPalette/barColor/etc.
    — ACTIVE_LOCKER_FILE_SS_KEY in sessionStorage

T5  setStatus('ready') called → React re-renders ReviewPage

T6  ChecklistContent mounts (first time — lazy initializers run NOW)
    background useState initializer:
    → tw-fork-id? NOT SET (opts.storageKey bypasses resolveStorageKey)
    → tw-savedlist-bg? NOT SET (review mode)
    → Normal path: localStorage.getItem('trailweigh:background')
    → Returns value written in T4 (or null if CASE B or DTO was null)

T7  useEffect(syncBg, [background, bgSize]) fires → syncs ref
T8  022G startup effect fires → if (!userId) return → EXITS
    No auto-load of active file in review mode
T9  bgImageUrl computed: if background={type:'preset',id} → Unsplash URL
    If background=null → bgImageUrl=null → no style applied
T10 DOM stabilizes: background visible only if bgImageUrl non-null
```

**Q64:** 025Q writes happen at T4, BEFORE ChecklistContent mounts at T6. **Timing is correct.** The data is wrong.

**Q65 / Q66:** No later effect resets background to null. The only reset risk is if usePackData's `onRestoreBg` callback is triggered (by undo/redo), but that requires user interaction.

**Q67 / Q68:** No race condition. The lazy initializer is synchronous at mount time. No stale closure issue — the initializer runs once.

**Q69:** YES — route-level status/loading causes mount timing. ReviewPage CORRECTLY waits for status='ready' before mounting ChecklistContent. This is not the problem.

**Q70:** StrictMode double-mount would run the initializer twice in dev mode — but since the initializer is pure (reads localStorage), the second invocation would return the same value. Not the cause of failure.

**Q71:** Production vs Preview behavior: no difference expected for this code path (plain localStorage reads, no service workers in play).

---

## PUBLIC LIVE DTO (Q72–Q89)

**Q72:** `GET /api/links/:id` (`artifacts/api-server/src/routes/links.ts:58`)

**Q73–Q82 — Appearance fields returned:**
| Field | Returned | Notes |
|-------|----------|-------|
| background | YES | `p.background ?? null` |
| bgFade | YES | `number`, default 1 |
| bgTone | YES | `string`, default 'light' |
| bgSize | YES | `string`, default 'cover' |
| chartPaletteKey | YES | `string \| undefined` |
| barColor | YES | `string`, default '' |
| barFont | YES | `string`, default '' |
| barTextColor | YES | `string`, default '' |
| barTransparency | YES | `number`, default 1 |

**Q83:** Field names are identical to LockerEntry fields (same object shape sent by `serverSaveReplace`).

**Q84:** No server-side transforms. Type checking with defaults applied (e.g. `bgFade ?? 1`).

**Q85 / Q86:** No server-side filtering of private backgrounds. The server returns `p.background` as-is — whether preset or custom ID. A custom photoId would appear in the DTO, but the blob is not exposed (only the ID). **The 025Q guard (`bg?.type === 'preset'`) filters custom backgrounds CLIENT-SIDE in ReviewPage.**

**Q87:** DTO is current at request time — re-queries DB on every GET. No caching.

**Q88 / Q89 — Does sourceVersion change when only appearance changes?**
**NO.** sourceVersion = `JSON.stringify(rows.map(r => ({ i: r.id, n: r.name, t: r.savedAt })).sort())`. Appearance changes that do not trigger a Save (which updates savedAt) are INVISIBLE to sourceVersion. If owner changes background and does not click Save, sourceVersion is unchanged → CASE B → Review never reseeds → even old 025Q approach cannot help.

---

## SOURCE VERSION / LIVE SHARE (Q90–Q102)

**Q90:** sourceVersion = JSON fingerprint of `{ i: id, n: name, t: savedAt.getTime() }` sorted by id.

**Q91:** YES — rename detected (name `n` is in fingerprint; PATCH updates name in DB).

**Q92:** YES — item changes detected (Save updates savedAt).

**Q93:** YES — file add/delete detected (row count changes).

**Q94–Q97 — Appearance changes:**
**NO** — background, bgFade, bgTone, bgSize, barColor, barFont, barTextColor, barTransparency, chartPaletteKey are NOT in the sourceVersion fingerprint. Appearance changes without a Save are invisible.

**Q98:** sourceVersion depends on `savedAt` timestamp which is updated on Save (PUT handler: `.set({ savedAt: new Date(savedAt) })`).

**Q99:** YES — appearance changes that include a Save call DO update savedAt and thus sourceVersion. PATCH (rename-only) does NOT update savedAt.

**Q100 / Q101 / Q102 — CRITICAL FINDING:**
**YES — Owner appearance CAN be local-only.** The owner sets background in React state → writes to `localStorage['trailweigh:background']` → visible in Owner browser. If owner does NOT click Save after setting background: DB `payload.background` remains null/stale. Server DTO returns null. Review cannot see the background.

This explains why filename propagates but background does not: filename is persisted by PATCH (rename only) which updates `name` in DB immediately. Background requires a full Save (PUT) which updates the entire payload including appearance fields.

**This is the architectural root cause of the failure.** The owner's background is local-only unless Save is clicked after setting it.

---

## THEME REGISTRY (Q103–Q124)

**Q103:** `BackgroundPicker.tsx` — exported `PRESETS` array (lines 89-100)

**Q104 — Groups present in source now:**
ONE group: **Landscape** (group ID: `landscapes`), 10 Unsplash presets.
No Retro-Outdoors, Psychedelic, or Topo 1 in current source.

**Q105 / Q106:** Owner runtime shows Landscape + any Custom Themes the owner created in their browser. Review shows ONLY Landscape (no custom themes from owner's browser).

**Q107:** YES — same `BackgroundPicker` component, same `PRESETS` array.

**Q108 / Q109–Q116:** Additional groups the Owner may see come from `localStorage['trailweigh:photoCollections']` (Custom Themes created by the user). These are user-created, browser-local, NOT bundled.

**Q117:** Retro-Outdoors, Psychedelic, Topo 1 — NOT present in current codebase as bundled assets. If owner refers to these, they were either user-created Custom Theme groups or expected future features. **NOT committed to project source.**

**Q118 / Q119:** NOT available in a new private browser. NOT in project source.

**Q120:** YES — only in owner's browser storage.

**Q121:** Review intentionally cannot access owner's Custom Themes (private blobs in owner's IndexedDB). This is correct security behavior.

**Q122:** No auth/userId gate on the theme registry itself. PRESETS is a module-level constant.

**Q123:** ONE registry (PRESETS array) + one user-extensible Custom Theme system.

**Q124:** PRESETS array in BackgroundPicker.tsx should remain canonical. Custom Themes remain user-local.

---

## BACKGROUND ASSET (Q125–Q136)

**Q125:** Specific preset active in Owner: UNKNOWN without browser devtools. One of the 10 Landscape presets.

**Q126 / Q127:** YES — Unsplash CDN URLs are public. Any browser can fetch them. No auth.

**Q128:** No CSP/CORS issues expected for Unsplash CDN. Standard HTTPS.

**Q129:** 404 risk only if Unsplash removes an image (rare; we have no control). No 404 in normal usage.

**Q130 / Q131:** Asset URL is absolute (`https://images.unsplash.com/...`) — route base path (`/` vs `/s/:token`) does not affect it.

**Q132:** No Vite asset hashing — URLs are runtime-generated strings from photoId constants.

**Q133:** YES — Unsplash CDN URLs work equally in Preview and published deployment.

**Q134:** No signed/auth-only asset URLs for preset backgrounds.

**Q135 / Q136:** Custom background blobs ARE stored as IndexedDB entries referenced by `photoId`. Object URLs are short-lived (session-scoped). The durable reference is the `photoId` string stored in the LockerEntry's `background` field (`{ type: 'custom', photoId: string }`). **These do NOT survive cross-session or cross-browser.** The IndexedDB is the persistent store.

---

## CUSTOM THEME / PRIVACY (Q137–Q147)

**Q137–Q140:** Custom Theme photos stored in:
- Metadata: `localStorage['trailweigh:photoCollections']` (collection names, photo IDs)
- Image blobs: IndexedDB `trailweigh / bgPhotos` keyed by `photoId`
- NOT on server — browser-local only

**Q141:** Custom Theme IDs DO appear in the DTO (`p.background = { type: 'custom', photoId }` if saved). However the blob is not exposed — only the ID.

**Q142:** Review CANNOT fetch private custom blobs (they're in owner's IndexedDB, not accessible cross-browser).

**Q143:** Fallback: 025Q removes the key (null); ChecklistContent renders no background image. `getPhotoBlob(photoId)` returns null → `customBgObjectUrl = null` → no image displayed.

**Q144 / Q145:** POSSIBLE — if owner's current background is `{ type: 'custom', photoId }`, the DTO returns this ID, 025Q's `bg?.type !== 'preset'` check correctly rejects it, removes the key, Review is white. This would be correct behavior (private asset) but owner may not realize their background is custom.

**Q146:** Public Review should show no background (null / clear) when owner background is private/custom. **This is the correct and implemented behavior** — the 025Q guard is correct for this case.

**Q147:** Privacy boundary enforced CLIENT-SIDE in ReviewPage (`bg?.type === 'preset'` guard). Server-side: custom photoId ID is returned in DTO (the ID itself is harmless; the blob is not).

---

## SHARE / REVIEW ARCHITECTURE (Q148–Q160)

**Q148:** Shared components: `ChecklistContent` (main UI), `BackgroundPickerPanel`, `LockerPanel`, all item/category components, `UnitProvider`.

**Q149:** Route-specific: `ReviewPage` (loading/error states, seeding logic, welcome modal, CASE A/B/C logic), `App.tsx` route definitions.

**Q150 / Q151:** Global localStorage keys are shared between Owner and Review when tested in the same browser (`trailweigh:background`, etc.). Review-specific keys are namespaced (`trailweigh:review:${token}:*`).

**Q152:** Some owner logic is duplicated in ReviewPage (LockerEntry building, appearance mapping).

**Q153 / Q154 / Q155:** YES — `SharedChecklistPage` still mounted at `/shared` route (`App.tsx:219`). This is the pre-025L legacy page. It could interfere if a user navigates to `/shared` accidentally.

**Q156 / Q157:** YES — legacy frozen snapshot path in ReviewPage still active for pre-025P links. These use `payload.background` directly from the snapshot payload (which may also be null if the snapshot was created without background).

**Q158:** The live-locker vs snapshot decision is: `stored.type === 'live-locker'` (links.ts:72). Links created before 025P would lack this type and fall through to snapshot path.

**Q159 / Q160:** ReviewPage is thin in routing but has accumulated CASE A/B/C business logic in the useEffect. This is acceptable complexity but should be documented.

---

## LOCKER / LIVE COLLECTION (Q161–Q171)

**Q161 / Q162:** Flat Locker — a flat array of LockerEntries, no folders. 025P exposes the ENTIRE flat Locker via live token.

**Q163:** YES — public token exposes every current AND future Locker file for that owner. Adding a new file to your Locker makes it appear in Review on next reload.

**Q164:** UNKNOWN — whether owner understands the full scope. UI should clarify this.

**Q165:** No filtering — all Locker files for ownerId are returned.

**Q166–Q167:** YES — deleted files removed immediately; new files added on next Review reload.

**Q168 / Q169:** Appearance fields ARE stored per LockerEntry (background, bgFade, bgTone, bgSize, barColor, etc.). However the RENDERED appearance (React state) is GLOBAL — only one file's appearance can be shown at a time.

**Q170 / Q171:** FUNDAMENTAL DESIGN GAP — appearance state is global (`trailweigh:background` etc.) but files are per-entry. When Review loads multiple files from the live collection, only the PRIMARY file's appearance can be applied. Switching files in the Locker panel calls `handleLoadFromLocker` which applies the selected file's appearance. This interaction works in review mode (in-place load path at line 1764).

---

## OWNER FILE PERSISTENCE (Q172–Q185)

**Q172 — What exact data is persisted to DB on Save:**
`PUT /api/locker/:id` body destructuring: `const { name, savedAt, ...payloadRest } = entry`
payloadRest = `{ store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency }`
→ Stored in `locker_entries.payload` JSONB.

**Q173 — What remains browser-local only:**
- `trailweigh:background` (and other global keys) — browser localStorage only
- Custom Theme photo blobs — IndexedDB only
- Active file tracking — sessionStorage

**Q174–Q182 — Does Save persist appearance fields?**

| Field | Persisted to DB on Save? | Notes |
|-------|--------------------------|-------|
| background | YES (if Save clicked) | Included in payloadRest |
| bgFade | YES | |
| bgTone | YES | |
| bgSize | YES | |
| barColor | YES | |
| barFont | YES | |
| barTextColor | YES | |
| barTransparency | YES | |
| chartPaletteKey | YES | |
| Custom Theme blobs | NO | IndexedDB only, not sent to server |

**Q183 / Q184 / Q185:**
- If owner changes appearance WITHOUT clicking Save → NOT in DB → live Review cannot see it
- No cross-device sync for appearance currently (appearance writes to localStorage, which is device-local)
- Public Review should NOT be expected to show appearance that hasn't been Saved

---

## PAST PROMPT REGRESSION RISKS (Q186–Q195)

**Q186:** Background repair could regress: 025K (screen-dark scope), 025M (URL shape), 025P (filename propagation), Review welcome modal.

**Q187 / Q188:** 025K portal fix depends on `screen-dark` class on `div.screen-only`. Any change to the DOM structure around this div could break Light/Dark scope. **Repair must not restructure this div.**

**Q189:** sourceVersion logic change could break 025P filename propagation if the fingerprint changes format.

**Q190:** Adding theme registry sharing to Review would expose private Custom Theme images unless a blob-privacy guard is added.

**Q191:** YES — applying owner appearance on every CASE C reload would discard reviewer's local background choices. **A one-time seed (CASE A only) approach is safer.**

**Q192 / Q193 / Q194 / Q195:** Route changes could break 025M URL; localStorage writes in wrong namespace could contaminate Owner state; Review writes to global keys (shared when same-browser) could affect Owner appearance.

---

## FUTURE ARCHITECTURE (Q196–Q214)

**Q197 — Live item/weight propagation:** Requires sourceVersion to change on item edits (which it does — Save updates savedAt). But un-saved item edits are also not propagated.

**Q198 — Multi-file Review:** Already works (all Locker files returned). Switching files in Review panel applies that file's appearance.

**Q199 — Built-in themes:** Adding new theme groups requires only adding to PRESETS array (BackgroundPicker.tsx). No migration needed.

**Q200 — Publishing/custom domain:** Unsplash URLs are absolute; unaffected by domain change.

**Q208 / Q209:** The smallest repair (auto-apply appearance on CASE A from reviewLockerKey) would not duplicate logic — it reads the already-seeded data in a new location (a useEffect in ChecklistContent for review mode). A slightly more reusable fix: a `useEffect` in ChecklistContent gated on `reviewToken && !userId` that reads from `reviewLockerKey[0].background` and calls `setBackground()` directly.

**Q210:** Single canonical appearance source should be the LockerEntry (server DB) — all appearance state should be saved to DB on change, not just on explicit Save. (Future work.)

**Q211:** Single canonical theme registry: PRESETS array in BackgroundPicker.tsx (already canonical).

**Q212:** Single canonical Review persistence adapter: ReviewPage.tsx seedFromLiveFiles (already the right place).

**Q213:** Technical debt NOT to fix now: SharedChecklistPage legacy at `/shared`, global localStorage appearance keys (should eventually be namespaced per review session), appearance-only auto-save.

---

## PERFORMANCE (Q215–Q223)

**Q215–Q221:** Proposed repair (review-mode useEffect calling setBackground once on mount) adds ONE React re-render after mount. No repeated localStorage reads beyond what already happens. No large serialization. No duplicate preloads. O(1).

**Q222 / Q223:** No evidence of current performance bottleneck from reseeding. Defer measurement.

---

## ACCESSIBILITY (Q224–Q230)

**Q224 / Q225:** Background images reduce text contrast when bgFade = 1 (fully visible). Light/Dark mode and bar text color settings compensate. The repair (showing background in Review) increases the risk that Review text is less readable — but this matches Owner behavior exactly, which is the stated goal.

**Q226 / Q227 / Q228 / Q229 / Q230:** Contrast behavior, welcome modal, and focus are unaffected by the proposed repair (one useEffect, no DOM structural changes).

---

## SECURITY (Q231–Q240)

**Q231:** Anonymous Review CANNOT mutate owner records. API write endpoints require Clerk JWT. GET /api/links/:id is unauthenticated — read-only.

**Q232:** Token manipulation: the token is a 10-char hex string (5 random bytes) — 2^40 possibilities. Enumeration is impractical.

**Q233:** ownerId is extracted from Clerk JWT server-side; never trusted from client body (`incoming.type === 'live-locker'` path in POST).

**Q234:** Public DTO allowlist: the GET resolver explicitly maps only the approved fields (id, name, savedAt, store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency). No userId, email, or account data leaks.

**Q235 / Q236:** Preset background paths are Unsplash CDN URLs — not private. Custom photo references in DTO expose only the photoId string — the blob is not exposed.

**Q237:** localStorage could include `trailweigh:background` etc. but these are appearance preferences, not sensitive owner data.

**Q238 / Q239:** Legacy `/shared` route serves older snapshot links. Snapshot links contain a frozen payload, less live data exposure. Share tokens are not revocable (no server-side invalidation mechanism).

**Q240:** The proposed repair (useEffect applying appearance from lockerKey) does not add any new public data exposure.

---

## BROWSER / PLATFORM (Q241–Q250)

**Q241–Q246:** Failure reproducible in any fresh browser context. Same-browser testing may MASK the bug because Owner and Review share global localStorage — Owner's `trailweigh:background` persists for Review to read even without the fix. **Test in private/incognito window to reproduce the real failure.**

**Q247:** Web Share API not relevant here.

**Q248 / Q249:** Service workers: none configured in this project. Browser cache: Unsplash images may be cached, which is fine.

**Q250:** Route base path: absolute Unsplash URLs unaffected by base path. Review-namespaced localStorage keys are token-specific.

---

## TEST / EVIDENCE REQUIREMENTS (Q251–Q260)

**Q251–Q255:** For next repair prompt, required evidence:
- Fresh private/incognito browser test (not same browser as Owner)
- Owner: Save file WITH background active (verify Save was clicked after setting background)
- Review URL opened in private browser
- Expected: background visible; actual: still white or correct?
- localStorage snapshot of reviewer's `trailweigh:background` after page load

**Q258 — Decisive user test:**
1. Owner opens file, sets a Landscape background, clicks Save
2. Owner shares the live link
3. Fresh private/incognito browser opens the Review URL
4. Does Review show the landscape background?

If YES → background CAN propagate when DB is current; fix is about CASE B or post-save timing.
If NO → DB payload check needed, or the useEffect repair is required.

**Q260:** Replit cannot automate the cross-browser test (requires a real signed-in session + separate private window). User must perform it.

---

## SCOPE / COST (Q261–Q272)

**Q261–Q265 — Smallest plausible repair:**

**Option 1 (data-source repair):** Ensure DB payload has background. Require owner to Save after setting background. This is not a code change — it's a user workflow instruction. If owner has Saved with background active, the 025Q fix should already work for CASE A (fresh reviewer).

**Option 2 (ReviewPage useEffect on mount):** After ChecklistContent mounts in review mode, read the active file from `reviewLockerKey` and call `setBackground(entry.background)` etc. This bypasses the localStorage initialization entirely and applies appearance from the seeded locker data directly.

**Option 2 details:**
- File: `ReviewPage.tsx` or `Checklist.tsx` (a `useEffect` in ChecklistContent gated on `reviewToken && !userId`)
- Function: new `useEffect` after mount
- What changes: After mount, if `reviewToken` and no `userId`, read primary file from `localStorage[reviewLockerKey]` and call `setBackground`, `setBgFade`, `setBgTone`, `setBgSize`, `setChartPaletteKey`, `setBarColor`, `setBarFont`, `setBarTextColor`, `setBarTransparency`
- Why it addresses the divergence: Bypasses the localStorage global key path entirely; reads directly from the seeded review-namespaced locker

**Q266–Q268:** No schema changes, no auth changes, no migration. One file edit.

**Q269:** No broad refactor risk — additive useEffect, existing state setters.

**Q270 / Q271:** STOP threshold: if fix requires restructuring the background state from a useState to a context/provider, that is too broad. Rollback to current 025Q checkpoint.

---

## UNKNOWN / OPEN QUESTION AUDIT (Q273–Q278)

**Q273 — Remaining unknowns:**
1. Is the owner's current DB `payload.background` null or a valid preset? (Cannot confirm without DB query or browser devtools)
2. Was the owner's 025Q test done with a fresh browser (CASE A) or returning reviewer (CASE B)?
3. Is the owner's background actually a Custom Theme (type:'custom') vs a preset?

**Q274 — Why unanswered:**
1. Requires DB access or browser devtools during a live session
2. Requires knowledge of how the user tested
3. Requires owner to open browser devtools

**Q275 — How to answer:**
1. Owner runs in browser console: `JSON.parse(localStorage['trailweigh:locker'] || '[]').map(e => ({name:e.name, bg:e.background}))` — shows the local locker backgrounds
2. Review URL opened in private window — if CASE A and DB has background, 025Q should work; if still white, DB is null or type is custom

**Q276 / Q277 / Q278:** Unknown #1 (DB content) DOES change the repair priority:
- If DB null → repair must add the useEffect approach (Option 2), as 025Q's data source is wrong
- If DB has preset → repair is only CASE B handling, or user simply needs to use private window
- Either way, Option 2 (useEffect) is safer because it works in both cases and doesn't depend on DB content

---

## DIAGNOSTIC ANSWERS SUMMARY (Q1–Q22 from old 025R)

1. **Q1 (DOM node in Owner):** `div.screen-only` (Checklist.tsx:2011), `backgroundImage` inline style
2. **Q2 (DOM node in Review):** Same element but no `backgroundImage` style (null)
3. **Q3 (Same component?):** YES — `ChecklistContent` in both cases
4. **Q4 (State feeding Owner background-image):** `background` React state → `bgImageUrl` → inline style
5. **Q5 (Where created):** `useState<Background | null>(() => ...)` in ChecklistContent
6. **Q6 (What restores it in Owner):** `handleLoadFromLocker` (user click) or 022G useEffect on first mount (requires userId)
7. **Q7 (Owner runtime values):** background = `{type:'preset', id:'<one of 10 landscape ids>'}`, bgSize='cover', bgTone='light', bgFade=partial — exact values unknown without devtools
8. **Q8 (Authoritative for Owner):** `localStorage['trailweigh:background']` on init; React state at runtime
9. **Q9 (State feeding Review background-image):** Same `background` React state — initialized as null
10. **Q10 (Value at first mount):** null (no global key written, or 025Q wrote null if DTO null)
11. **Q11 (After ReviewPage seeding):** Same null (React state doesn't update retroactively from storage changes)
12. **Q12 (Does value ever contain owner bg ID?):** NO in normal operation. Only if 025Q wrote a valid preset AND initializer runs after 025Q write AND DB had non-null background
13. **Q13:** N/A (it doesn't)
14. **Q14 (Which step fails):** DB `payload.background` is null OR DTO → 025Q removes key → initializer reads null
15. **Q15 (Authoritative at runtime):** `background` React state — never receives owner's value in Review
16. **Q16 (025Q write before or after init?):** BEFORE — correct timing. But DATA is wrong.
17. **Q17 (Later effect overwrites?):** NO — nothing overwrites null after mount in review mode
18. **Q18 (First divergence choice):** **D — initialization/restoration differs** (022G requires userId; no review-specific restoration; lazy init gets null from empty/wrong localStorage)
19. **Q19 (Exact preset ID):** UNKNOWN — one of the 10 Landscape presets
20. **Q20 (Asset URL):** `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop`
21. **Q21 (Can Review load it?):** YES — public CDN URL
22. **Q22 (Asset resolution failing?):** NO — the asset URL is accessible. Background ID never reaches Review React state, so the asset is never requested.

---

## CONFIRMED FIRST RUNTIME DIVERGENCE

**Owner restoration path:**
```
022G useEffect (mount, requires userId) → handleLoadFromLocker → setBackground(entry.background)
```

**Review restoration path:**
```
022G useEffect → if (!userId) return → EXITS → no setBackground called
Nothing else applies background from the seeded Locker data
background React state = null permanently (unless user manually clicks a file in Locker panel)
```

**The divergence is at initialization/restoration (Type D):**
Owner has the 022G startup effect which auto-loads the last-active file's appearance. Review has no equivalent auto-restore mechanism. The `background` React state in Review is never set to the owner's value after mount, regardless of what is in localStorage or the review-namespaced locker.

**025Q's fix was insufficient because:** Writing to `localStorage['trailweigh:background']` only helps if:
1. The data in the global key is correct (DTO has non-null background from DB), AND
2. The reviewer is in CASE A (fresh browser — no existing local data), AND
3. The review path goes through the normal localStorage fallback (which it does — no tw-fork-id)

But even when all three are true, the broader issue remains: once `background` React state is initialized as null from an empty key, there is NO mechanism to correct it without user action (clicking a file in the Locker panel).

**CONFIDENCE: HIGH**

**WHY:** Code analysis confirms 022G exits immediately on `!userId` (Checklist.tsx:1500). No other auto-restore mechanism exists in review mode. The `background` useState initializer's normal path is correctly reached in review mode (no tw-fork-id since resolveStorageKey is bypassed), but the DATA written there may be null.

---

## SYNTHESIZED SECTIONS

### A. CONFIRMED FACTS

1. Background DOM: `div.screen-only` inline `backgroundImage` style, `ChecklistContent`, same component in Owner and Review
2. `resolveStorageKey` does NOT run when `opts.storageKey` is provided — `tw-fork-id` is NOT set in review mode
3. Background lazy initializer correctly reaches the global localStorage path in review mode
4. 025Q timing is correct — writes happen before ChecklistContent mounts
5. `serverSaveReplace` DOES include background in the PUT body → DB stores it when Save is clicked
6. sourceVersion does NOT include appearance changes
7. 022G startup effect exits immediately in review mode (`!userId`)
8. No post-mount effect resets or restores background in review mode
9. Unsplash preset URLs are public — no auth, no CORS, accessible from any browser
10. Custom Theme blobs are IndexedDB-local — cannot cross browsers
11. Background is ONLY in DB if owner saved AFTER setting it
12. PRESETS registry has exactly one built-in group (Landscape, 10 presets)
13. Custom Theme groups are private localStorage/IndexedDB — not in DB, not in DTO

### B. DISPROVEN PAST ASSUMPTIONS

1. "025Q timing was wrong" — DISPROVEN. Timing was correct; data was wrong.
2. "There are multiple permanent built-in theme groups" — DISPROVEN. Only Landscape exists in source.
3. "Background will appear in Review if global localStorage key is written" — DISPROVEN. The key may be null (from null DTO) or the reviewer may be in CASE B (key never written).

### C. CURRENT UNKNOWNS

1. Whether DB `payload.background` is null or a valid preset for the owner's current file
2. Whether the 025Q test was CASE A (fresh browser) or CASE B (returning reviewer)
3. Whether owner's current background is preset or custom type

### D. PAST PROMPT IMPACT MAP

See "PAST PROMPT IMPACT MAP" section above.

### E. OWNER RUNTIME BACKGROUND PATH

```
Owner clicks file in Locker → handleLoadFromLocker → setBackground(entry.background)
OR 022G startup effect (mount) → reads lastActiveFile from localStorage → finds matching lockerEntry → setBackground(entry.background)
background React state → bgImageUrl (via PRESETS lookup) → div.screen-only inline style
```

### F. REVIEW RUNTIME BACKGROUND PATH

```
ReviewPage useEffect → fetch DTO → seedFromLiveFiles (CASE A/C only) → writes localStorage (025Q)
setStatus('ready') → ChecklistContent mounts
background useState initializer → reads localStorage['trailweigh:background'] (may be null from null DTO or never written in CASE B)
background = null → bgImageUrl = null → no inline style → white background
022G effect → if (!userId) return → exits → NO RESTORATION
```

### G. FIRST RUNTIME DIVERGENCE

Owner: 022G auto-restores active file appearance after mount.
Review: 022G is gated on `userId` — exits immediately. No equivalent auto-restore exists for review mode.

Even if localStorage has the background value: it must exist BEFORE mount AND be non-null. 025Q can write it before mount only if CASE A/C applies AND DTO has a non-null background. The 022G missing path is the structural gap.

### H. THEME REGISTRY FINDING

Only Landscape exists in current source. Custom Theme groups are user-local. Home and Review use identical PRESETS. No registry parity issue for permanent themes. Custom themes are correctly excluded from Review.

### I. LIVE DTO / SOURCE VERSION FINDING

sourceVersion does NOT include appearance. Background propagation to Review requires:
1. Owner saves file with background active → DB has non-null background
2. Reviewer hits CASE A or CASE C
3. 025Q writes non-null value to localStorage
4. ChecklistContent initializer reads it

All four conditions must hold simultaneously. Currently there is NO mechanism to apply appearance in CASE B, even if DB has the background.

### J. PRIVACY / SECURITY FINDING

Public DTO allowlists all returned fields. Custom background IDs are in DTO but blobs are not. 025Q guards custom type correctly. ReviewPage does not mutate owner data. Reviewer localStorage is isolated for gear data (namespaced keys) but NOT for global appearance keys — same-browser testing masks the failure.

### K. FUTURE ARCHITECTURE IMPACT

Smallest repair (useEffect in ChecklistContent for review mode) is additive — does not block any future work. Future prompts should avoid restructuring the `background` useState or the global appearance keys without updating the review-specific restoration path.

### L. SMALLEST SAFE REPAIR RECOMMENDATION

**File:** `artifacts/pack-checklist/src/pages/Checklist.tsx`

**Mechanism:** Add a `useEffect` in `ChecklistContent`, gated on `reviewToken && !userId`, that runs once after mount. It reads the primary LockerEntry from `localStorage['trailweigh:review:${reviewToken}:locker']`, extracts appearance fields from `entries[0]`, and calls `setBackground`, `setBgFade`, `setBgTone`, `setBgSize`, `setChartPaletteKey`, `setBarColor`, `setBarFont`, `setBarTextColor`, `setBarTransparency`.

**Why this works:**
- `seedFromLiveFiles` already populates `reviewLockerKey` with the correct appearance data from the DTO
- The useEffect runs AFTER mount, so React state setters are available
- This matches the `handleLoadFromLocker` in-place restore path (already used in review mode at line 1764) but runs automatically on first mount without user interaction
- Does not depend on DB content being in global localStorage keys
- Correctly handles CASE B (reviewer's existing locker already has latest appearance from last CASE A seed)

**What must be guarded:**
- Only run on first mount (useEffect with empty/stable deps)
- Only apply if `entries[0].background?.type === 'preset'` (same privacy guard as 025Q for custom backgrounds)
- Do not overwrite reviewer's locally-changed appearance in CASE B unless owner's source changed (CASE C clears old locker and reseeds first)

**HOWEVER — IMPORTANT CAVEAT:** The CASE B reviewer who had a previous CASE A session will have the old background in their local locker, not the updated one (if owner changed appearance + saved after the reviewer's first visit). This is only fixed when a CASE C reseed happens (sourceVersion change). Since sourceVersion doesn't track appearance, an appearance-only change won't trigger CASE C. This gap remains.

### M. REPAIR SCOPE / TIME / COST

- Files: 1 (`Checklist.tsx`, or alternatively `ReviewPage.tsx` to keep review logic isolated)
- Estimated time: 4-6 minutes
- Estimated Agent cost: ~$0.60-$1.00
- Schema change: NO
- Auth change: NO
- Migration: NO
- Regression risk: LOW (additive useEffect gated on review mode)

### N. REQUIRED USER LIVE TEST

1. Owner opens file, sets a Landscape background, clicks Save (CRITICAL — must Save after setting background)
2. Owner shares live link
3. User opens Review URL in a FRESH PRIVATE/INCOGNITO browser (not same browser as Owner)
4. Expected: Review shows the Landscape background
5. Also test: Owner changes to a different background, saves, reloads Review URL → new background appears

### O. WHAT NOT TO CHANGE

- `div.screen-only` DOM structure (025K dependency)
- sourceVersion fingerprint format (025P dependency)
- `background` useState lazy initializer (complex, multi-path, well-tested)
- Global appearance localStorage key names
- PRESETS array (theme registry canonical)
- CASE A/B/C logic in ReviewPage
- 022G startup effect (owner path, must not be changed for review mode)

---

## USER WORKFLOW / SAVE / CHANGE-PROTECTION (Q279–Q306)

**Q279 — Immediate-only React/runtime changes:**
Typing in items, changing weights, checking items, changing appearance (before Save)

**Q280 — Written to localStorage:**
- `trailweigh:background`, `trailweigh:bgFade/Tone/Size`, `trailweigh:chartPalette`, `trailweigh:barColor/Font/TextColor/Transparency` — on every appearance change
- `trailweigh:locker` — on every Save (full Locker array with all entries)
- `pack-checklist-v5` (or fork key) — on every gear edit (auto-persisted by usePackData)
- Last-active file tracking — on every open/save

**Q281 — Written to IndexedDB:**
Custom Theme photo blobs only (`trailweigh/bgPhotos`)

**Q282 — Written to server/DB:**
- `locker_entries` — name (PATCH rename), full payload including appearance (PUT Save), creation (POST)
- `share_links` — on share link creation

**Q283 — Requires Save click:**
File content (gear items, weights, appearance values) must be explicitly Saved to persist to DB and to update the localStorage Locker entry with current appearance

**Q284 — Auto-saves:**
Gear edits auto-persist to the pack storage key in localStorage (not to DB)

**Q285 — What Save persists:**
| Field | Saved to DB | Saved to localStorage Locker |
|-------|-------------|------------------------------|
| categories/items | YES | YES |
| weights, qty, type | YES | YES |
| checked state | YES | YES |
| name | YES (PATCH for rename, PUT for save) | YES |
| background | YES | YES |
| theme group | stored as background preset ID | YES |
| Bar Color/Font/Text/Transparency | YES | YES |
| Light/Dark (bgTone) | YES | YES |
| Darken/Fade (bgFade) | YES | YES |
| Fit/Fill (bgSize) | YES | YES |
| chart palette | YES | YES |
| units | UNKNOWN — not in LockerEntry fields reviewed | possibly global localStorage only |

**Q286:** No known field is explicitly excluded from Save. All LockerEntry fields are included.

**Q287:** `locker_entries` table: `{ id, userId, name, savedAt, payload: {store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency} }`

**Q288 — Unsaved changes + new prompt:**
Code changes that restart Vite dev server do NOT clear browser localStorage. Unsaved gear edits persist to localStorage and survive Vite restarts. Unsaved appearance changes persist to `trailweigh:background` etc. Only DB is affected by Agent code changes (schema migrations could be destructive).

**Q289 — What can cause unsaved edits to disappear:**
- Replit checkpoint RESTORE (restores code but not browser localStorage — localStorage survives)
- Browser clearing localStorage/cookies
- Private/incognito window closure
- IndexedDB clearing (destroys Custom Theme photos)
- DB migration that drops/clears `locker_entries`

**Q290 — What survives which event:**
| Event | localStorage | DB/Locker | IndexedDB |
|-------|-------------|-----------|-----------|
| Browser refresh | YES | YES | YES |
| Browser close/reopen | YES | YES | YES |
| Replit workspace restart | YES (browser) | YES | YES |
| Deployment/re-publish | YES (browser) | YES | YES |
| App code change | YES (browser) | YES | YES |
| DB restart | YES (browser) | Depends | YES |

**Q291:** Changes that do NOT survive:
- Private/incognito window close: localStorage AND IndexedDB lost
- Explicit localStorage.clear() call: all localStorage lost
- IndexedDB deletion: Custom Theme blobs lost

**Q292–Q294 — Safest workflow before sending a prompt:**
1. Click Save on your active TrailWeigh file (to persist appearance and gear to DB)
2. Verify the file appears in Locker with correct name
3. Close and reopen the file to verify restoration from DB
4. Take a screenshot for reference
5. THEN send the prompt

**Q295:** YES — Replit should create a checkpoint before every prompt that changes application code.

**Q296 — What checkpoint protects:**
- Source code files (YES)
- Configuration files (YES)
- Replit config / workflows (YES)
- Database records (YES — Replit's PostgreSQL is snapshotted with the checkpoint)

**Q297 — What checkpoint does NOT protect:**
- Browser localStorage (browser-side, not part of Replit)
- IndexedDB (browser-side)
- External accounts, third-party data
- Files uploaded to object storage after the checkpoint

**Q298 — Safest rollback sequence:**
1. Replit → Checkpoints → select last-known-good checkpoint
2. Verify app starts after rollback
3. Re-test USER-VERIFIED PASS behaviors

**Q299 / Q300 / Q301 — Can checkpoint rollback roll back user account/database content?**
YES — if the checkpoint includes the DB snapshot, rolling back restores the DB to that snapshot state. DB records created AFTER the checkpoint (including new Locker files saved after that time) would be lost.

**Q302:** DB migrations included in checkpoint if the DB schema was changed after the checkpoint — rollback would undo the migration. Drizzle migrations could be in a bad state if code is rolled back but migration was applied to DB (or vice versa).

**Q303:** Server/DB records created AFTER a checkpoint are NOT preserved when rolling back to that checkpoint.

**Q304 — What to back up before prompts touching persistence:**
- Export current Locker entries (no UI export currently)
- Screenshot active files
- Note any Custom Theme collection names
- Export any critical files as PDFs or screenshots

**Q305 / Q306:** NO safe export/backup path is currently available in the UI. Future prompts should avoid persistence/schema changes until an export feature exists.

---

## TEST DATA vs IMPORTANT USER DATA (Q307–Q319)

**Q307–Q312:** Agent should create test files named clearly (e.g., `TW TEST 025S - DELETE`). No test account currently exists. Safest approach: use clearly named test data and clean up after each test.

**Q312:** "Sample List" (now "Sample List Live Test") should be treated as the owner's primary test file. Do not rename, delete, or overwrite it during tests without explicit user approval.

**Q313–Q319:** Owner localStorage keys start with `trailweigh:` (no token). Review keys start with `trailweigh:review:${token}:`. Testing in different browsers separates concerns. In same browser: Owner and Review share global appearance keys — tests should use private window for Review.

---

## APPEARANCE-CHANGE WORKFLOW (Q320–Q354)

**Q320:** YES — background applied immediately to React state and localStorage.

**Q321:** Background selection is NOT saved to DB automatically. Must click Save.

**Q322:** Background is per-file (saved in LockerEntry) but displayed globally (global localStorage key `trailweigh:background`). On same device, the global key reflects the last-used background across all files unless a file is explicitly opened.

**Q323 / Q324–Q330:** All appearance fields (Fit/Fill, Light/Dark, Darken/Fade, Bar Color, Transparency, Text Color, Font, chart palette) are per-file in LockerEntry. They are globally persisted in localStorage during runtime. Switching files calls `handleLoadFromLocker` which overwrites global keys with the new file's appearance.

**Q332 / Q333:** All listed appearance fields are part of LockerEntry. None are in PackStore.

**Q334–Q336:** All appearance fields are in localStorage global keys at runtime; all are in LockerEntry local + DB (after Save).

**Q338–Q340:** File A to File B: `handleLoadFromLocker` is called → overrides all global localStorage appearance keys. If user switches back to File A, File A's appearance is restored. File A appearance CAN leak to File B if: File B is opened while File A's global keys are still active (before opening File B). This was fixed by 023P (stashing appearance to sessionStorage on open).

**Q341:** Opening saved file restores appearance via: 1) 022G startup effect auto-restores last-active file on fresh mount (Owner, requires userId), or 2) `handleLoadFromLocker` on explicit file click.

**Q345:** When sharing, appearance in public source = whatever is in DB payload (from last Save). NOT the live React state.

**Q346:** Review locally changes appearance → written to `trailweigh:background` etc. (global keys, reviewer's browser only). NOT written to review-namespaced keys.

**Q347:** Review appearance changes CANNOT write to Owner — write APIs require Clerk JWT. localStorage is browser-local.

**Q348 / Q349 / Q350:** Owner changes appearance + saves → savedAt changes → sourceVersion changes → CASE C → Review reseeds. But if owner changes appearance WITHOUT saving → sourceVersion unchanged → CASE B → Review never updates.

**Q351 / Q352 / Q353 / Q354:** Publishing does not change Unsplash URL generation (absolute URLs). Background IDs (preset IDs like 'rocky-mountains') are stable identifiers — must never be changed. The photoId is the Unsplash photo ID — also stable. **Never save a temporary blob URL or object URL as the background identifier.**

---

## BUILT-IN THEME EDITING / MAINTENANCE (Q355–Q367)

**Q355 / Q356:** To add a permanent built-in theme group:
1. Add new entries to `PRESETS` array in `BackgroundPicker.tsx` (or create a new group registry)
2. Add the dropdown option in the picker render
3. Add the grid render for the new group
4. Verify Unsplash photoIds are stable (use permanent Unsplash photo IDs)

**Q357:** Preset IDs must be stable strings (e.g., 'rocky-mountains'). Never change them — they're stored in user LockerEntries in the DB. Display labels can change freely.

**Q358–Q360:** YES — can rename display labels. The `id` field in PRESETS must remain stable. The display `label` can change freely.

**Q361 / Q362:** To remove a built-in preset: keep it in PRESETS (so saved references still resolve) but remove it from the picker UI grid. This allows existing saved files to continue displaying the removed background while new selections cannot use it.

**Q363:** If a saved preset ID no longer exists in PRESETS, `PRESETS.find(p => p.id === id)?.photoId ?? ''` returns '' → `getFullUrl('')` → broken Unsplash URL → broken image. Add a fallback or keep deprecated entries in PRESETS.

**Q364:** Built-in themes are available equally to Owner and Review because they're in the PRESETS module-level constant — no auth gate. Any reviewer can access all built-in themes.

**Q365:** Theme photoIds belong in source (PRESETS array). Display labels in source. User choices in LockerEntry (DB).

---

## CUSTOM THEME SAVE / SAFETY (Q368–Q380)

**Q368:** User's Custom Theme is saved as:
- Collection metadata: `localStorage['trailweigh:photoCollections']` — collection name + array of `{ photoId, label }` entries
- Image blobs: IndexedDB `trailweigh / bgPhotos` — keyed by `photoId` (UUID)

**Q369 / Q370:** YES — survives app reload and browser restart (IndexedDB is persistent).

**Q371 / Q372:** YES — survives Replit code changes (browser-side storage). YES — survives re-publish (browser-side storage).

**Q373 / Q374:** NO — does NOT survive on a different device. IndexedDB is device-local. `trailweigh:photoCollections` metadata is also localStorage-local.

**Q375:** Planned `Sync Custom Themes to This Device` would need to:
1. Upload blob to server (object storage per user)
2. Sync `photoCollections` metadata to DB

**Q376 / Q377:** Agent prompts that run `localStorage.clear()`, drop the `trailweigh/bgPhotos` IndexedDB, or run `indexedDB.deleteDatabase('trailweigh')` would destroy Custom Themes. **Never run these without explicit user approval.**

**Q378:** Must never clear localStorage or IndexedDB without explicit user approval and backup.

**Q379:** YES — future theme-related prompts should first note the presence of Custom Theme data.

**Q380:** Replit can inspect `localStorage['trailweigh:photoCollections']` structure safely (metadata only, no blobs). Do not download or copy blobs.

---

## SAFE FUTURE PROMPT WORKFLOW (Q381–Q390)

**Q381 — Recommended workflow for every future TrailWeigh code-change prompt:**

BEFORE PROMPT:
- Owner: Save active file with current gear AND appearance (click Save)
- Owner: Close and reopen the saved file to verify DB restoration
- Owner: Take screenshot of current state for reference
- Replit: Confirm checkpoint created before any source changes
- Replit: Record current application file diff (`git status`)

DURING PROMPT:
- Only change files explicitly listed in the prompt scope
- Protect owner data — do not modify `locker_entries` table data
- Use clearly named test data (e.g., `TW TEST - SAFE TO DELETE`)
- STOP if: unrelated files change, DB schema needs migration, prompt scope is unclear

AFTER PROMPT:
- Replit: Run `git diff --name-only` and list all changed files in report
- Replit: Verify workflows still running (no build errors)
- Replit: Create report and ZIP
- User: Test USER-VERIFIED PASS behaviors first (025K, 025M, 025P)
- User: Then test new behavior in FRESH private/incognito browser
- Keep checkpoint if user verifies PASS; rollback if FAIL

**Q382:** Next prompt must explicitly state: "Do not change [list of past PASS behaviors]. Do not modify files [list of unrelated files]."

**Q383:** YES — `git diff --name-only HEAD` should be run and reported before declaring completion.

**Q384:** YES — every prompt should list all changed files and the reason for each change.

**Q385:** YES — if a file unrelated to the stated scope is changed, that should trigger a STOP and review.

**Q386:** Agent should make minimal, targeted edits. No reformatting of files unrelated to the task. Use `Edit` tool for surgical changes rather than full file rewrites.

**Q387 / Q388:** Report separately: source-code changes (files modified, lines added/removed) vs data changes (DB records created/modified during testing).

**Q389:** Warning before destructive user-data operations:
> "This operation will [describe action]. It cannot be undone automatically. Your [files/data/themes] may be lost. Please click Save and take a screenshot before proceeding. Confirm: yes/no"

**Q390 — User confirmation required before:**
- Deleting owner files: YES
- Deleting theme assets: YES
- Resetting storage: YES (with full warning)
- Clearing localStorage: YES
- Clearing IndexedDB: YES
- DB migration that changes existing records: YES
- Changing authentication provider: YES
- Exposing additional data publicly: YES

---

## SAFE TRAILWEIGH WORKFLOW FOR THE USER

*(Plain language for a non-programmer)*

### 1. How to safely edit a TrailWeigh file
Open your file from the Locker panel (the folder icon). Make your changes — add gear, change weights, check items. The app saves your gear automatically to your browser, but NOT to your account yet.

### 2. When to click Save
Click the Save button whenever you:
- Finish editing and want the changes to appear on shared links
- Want your changes backed up to your account (so they work on other devices)
- Before sending any Replit prompt that touches code
- After setting a background, changing colors, or any appearance setting

**If you don't Save, your appearance settings (background, colors) will NOT appear to people viewing your shared link.**

### 3. How to verify a file really saved
After clicking Save, close the Locker panel and reopen it — your file should be listed with the correct name. You can also sign out and sign back in — the file should still be there.

### 4. What to do before sending the next Replit prompt
1. Click Save on your active file
2. Close and reopen the file to confirm it's saved
3. Take a screenshot of the current state
4. Replit will create a checkpoint automatically before making changes

### 5. What a Replit checkpoint protects
- The application code (all the programming files)
- Your account database records (your saved files in the cloud)
- App configuration

### 6. What it does NOT protect
- Your browser's local storage (cleared if you clear your browser data)
- Your Custom Theme photos (stored in your browser — device specific)
- Files you save AFTER the checkpoint point (those are newer than the snapshot)

### 7. How to safely test a prompt
Always test in a private/incognito browser window for shared link tests. This ensures you're seeing what an outside visitor sees, not your own cached data. Use "Fresh Review Test" as a mental shorthand — always private window for reviewing your share links.

### 8. What to do if a prompt breaks something
Stop sending more prompts. Use Replit Checkpoints to view the saved snapshots. Pick the most recent one where everything worked and click "Restore." Your code goes back to that point. Your saved gear files (in the cloud) may also go back to that point if the checkpoint predates those saves.

### 9. How to change and save appearance
1. Click Background/Themes
2. Choose a landscape photo (or other option)
3. Adjust Light/Dark, Fade, and other settings
4. **Click Save** — this is required for the background to show in shared links
5. Share the link — your background should now appear for viewers

### 10. Which appearance settings follow a file vs the account/device
**Per-file (saved with the file, travel with shared links):** Background, Light/Dark, Fade/Darken, Bar Color, Transparency, Text Color, Font, Fit/Fill, Chart Palette

**Device-only (do NOT travel with shared links unless Saved to file):** Custom Theme photos (your uploaded photos stay in your browser only)

### 11. How to avoid losing important files/themes
- Always Save before closing the browser tab
- Custom Theme photos live in your browser — if you clear your browser data, they are gone
- Don't use private/incognito windows for your real TrailWeigh work
- Before any major Replit prompt, take screenshots of your Locker and any Custom Themes

### 12. What not to delete/reset without a backup
- Never clear browser localStorage (`localStorage.clear()`)
- Never delete the IndexedDB for TrailWeigh
- Never delete items from your Locker without confirming they're backed up to your account
- When in doubt: take a screenshot first

---

## APPLICATION CODE CHANGED BY 025R = NONE

No application source files were modified during this diagnostic. The only file created is this report.

---

## GIT VERIFICATION

```
git diff --name-only HEAD
(no output — no changes)
```

Only pre-existing 025Q change remains: `artifacts/pack-checklist/src/pages/ReviewPage.tsx`

---

## USER VERIFICATION = NOT APPLICABLE — DIAGNOSTIC ONLY
