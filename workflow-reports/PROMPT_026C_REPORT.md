# TRAILWEIGH — PROMPT 026C REPORT
## Diagnostic Only — Identify and Preserve the Real Original Themes
### Internal Version ID: 026C-ORIGINAL-THEME-RECOVERY-2026-08-13-R3

---

## MANDATORY CONTEXT REVIEW STATUS

| Item | Status |
|---|---|
| `replit.md` read | ✅ READ-ONLY |
| `workflow-reports/PROMPT_026B_REPORT.md` read | ✅ READ-ONLY |
| 026B diff/commit (6ad2182) inspected | ✅ READ-ONLY |
| Current `BackgroundPicker.tsx` (active path) inspected | ✅ READ-ONLY |
| Pre-026B `BackgroundPicker.tsx` (commit fc08983) inspected | ✅ READ-ONLY |
| Git history searched for original theme definitions | ✅ READ-ONLY |
| `.agents/memory` files audited | ✅ READ-ONLY |
| Browser theme metadata accessed | ❌ NOT SAFELY ACCESSIBLE from server (see Part B) |

**No application source, configuration, database, browser storage, or memory files were modified.**

---

## PART A — CONFIRM THE USER-VERIFIED ORDER IN CODE / RUNTIME

### A.1 — Two Distinct Sources Build the Dropdown

The dropdown in post-026B `BackgroundPickerPanel` is built from **two independent sources** rendered in sequence in the JSX (lines 1397–1424 of current `BackgroundPicker.tsx`):

**Source 1 — Hard-coded built-in theme registry (`BUILTIN_THEMES`):**
```tsx
{BUILTIN_THEMES.map(theme => (
  <button key={theme.id} ...>{theme.label}</button>
))}
```
`BUILTIN_THEMES` is a static export defined at compile time (lines 142–148). It contains 5 entries in fixed order.

**Source 2 — User custom collections from localStorage (`collections`):**
```tsx
{collections.map(col => (
  <button key={col.id} ...>{col.name}</button>
))}
```
`collections` is loaded via `loadCollections()` which reads `localStorage['trailweigh:photoCollections']` on panel mount. These are `PhotoCollection` objects with UUID IDs.

**Rendering order:** Source 1 always precedes Source 2. No interleaving, no sorting, no name-deduplication.

### A.2 — Confirm First Four After Landscape = 026B-Created Built-Ins

**Pre-026B code (commit `fc08983`):** The dropdown rendered a single hardcoded Landscape button, then `collections.map()` only:
```tsx
{/* Built-in 1: Landscape */}
<button ...>Landscape</button>
{collections.map(col => ( ... ))}
```
`BUILT_IN_IDS = ['landscapes']` — only one built-in existed.

**Post-026B code (commit `6ad2182`):** `BUILTIN_THEMES` was added with 5 entries:
```ts
export const BUILTIN_THEMES = [
  { id: 'landscapes',     label: 'Landscape',      presets: PRESETS              },
  { id: 'psychedelic',    label: 'Psychedelic',    presets: PSYCHEDELIC_PRESETS  },
  { id: 'retro-outdoors', label: 'Retro-Outdoors', presets: RETRO_PRESETS        },
  { id: 'topo',           label: 'Topo',           presets: TOPO_PRESETS         },
  { id: 'trails-us',      label: 'Trails US',      presets: TRAILS_PRESETS       },
];
```
The dropdown now renders `BUILTIN_THEMES.map()` first, producing positions 1–5, then `collections.map()` for whatever is in localStorage, producing positions 6–N.

**Confirmed:** The first four entries after Landscape (positions 2–5) are the 026B-created built-in entries. They have stable string IDs: `'psychedelic'`, `'retro-outdoors'`, `'topo'`, `'trails-us'`.

### A.3 — Confirm Second Four = Original Pre-Existing Local Collections

The user's localStorage `'trailweigh:photoCollections'` contains `PhotoCollection` objects that were created manually through the TrailWeigh UI before 026B. These have **UUID IDs** (e.g. `'3a7b9f2c-...'`), not the string IDs used by 026B built-ins. They are rendered by `collections.map()` — appearing after all 5 BUILTIN_THEMES entries.

At the time 026B ran, these four collections were the only representations of Psychedelic, Retro-Outdoors, Topo, and Trails US in the app. The 026B prompt named these themes, but the agent read only source code — it never accessed localStorage or IndexedDB.

**Confirmed:** The second four entries (positions 6–9) are the original pre-existing user collections in localStorage.

### A.4 — Bad Copy Catalog (026B-Created Entries)

#### BAD COPY 1: Psychedelic
| Field | Value |
|---|---|
| Name | Psychedelic |
| Built-in ID | `'psychedelic'` (string literal, not UUID) |
| Source file | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` |
| Introduced by 026B | YES — not present in commit `fc08983` |
| Photo count | 6 |
| Photos (Unsplash IDs, 026B-invented) | `1531366936-c1ca7eefd24e` (Northern Lights), `1557683311-eac922347aa1` (Neon City), `1465146344425-f00d5f5c8f07` (Wildflowers), `1497578195034-75dded7eda09` (Lava Flow), `1462331940-2c93fd22c667` (Milky Way), `1513151233558-d860c5398176` (Light Prism) |
| Selection stores | `{ type: 'preset', id: 'psychedelic-aurora' }` etc. |

#### BAD COPY 2: Retro-Outdoors
| Field | Value |
|---|---|
| Name | Retro-Outdoors |
| Built-in ID | `'retro-outdoors'` |
| Source file | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` |
| Introduced by 026B | YES |
| Photo count | 6 |
| Photos (026B-invented) | `1534447677432-56d382f07ffc` (Campfire), `1470770841591-52abcf45de23` (Log Cabin), `1464207687429-7505649dae38` (Dusty Trail), `1532339142463-fd0a8e7bb9f0` (Tent Camp), `1523987329168-b2ca43e98d4e` (River Canoe), `1486870591958-2fde7b1e1e43` (Rocky Summit) |
| Selection stores | `{ type: 'preset', id: 'retro-campfire' }` etc. |

#### BAD COPY 3: Topo
| Field | Value |
|---|---|
| Name | Topo |
| Built-in ID | `'topo'` |
| Source file | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` |
| Introduced by 026B | YES |
| Photo count | 6 |
| Photos (026B-invented) | `1509610449-d3e99c1dc9e4` (Salt Flats), `1530789253388-582c481ef399` (Sand Patterns), `1500076656116-558758f991c1` (Crop Fields), `1474044159687-1ee9f3a51722` (Canyon Strata), `1502126199040-3e9b72b0c7c4` (Ice Fractures), `1507501336603-6c0049da8bbc` (River Delta) |
| Selection stores | `{ type: 'preset', id: 'topo-salt' }` etc. |

#### BAD COPY 4: Trails US
| Field | Value |
|---|---|
| Name | Trails US |
| Built-in ID | `'trails-us'` |
| Source file | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` |
| Introduced by 026B | YES |
| Photo count | 6 |
| Photos (026B-invented) | `1472214103451-9374bd1c798e` (Yosemite), `1469854523086-cc02fe5d8800` (Zion Canyon), `1454496522488-7a8e488e8606` (Olympic Coast), `1433086966628-ab1c5087a33d` (Mt. Rainier), `1483185406765-2e05d1b4a2bf` (Forest Path), `1476514525535-07fb3b4ae5f1` (High Desert) |
| Selection stores | `{ type: 'preset', id: 'trails-yosemite' }` etc. |

### A.5 — Original Theme Catalog

For each original theme, the server-accessible facts are:

| Field | Value |
|---|---|
| Collection ID | UUID (unknown — stored only in user's browser localStorage) |
| Metadata source | `localStorage['trailweigh:photoCollections']` in user's browser |
| Photo IDs | UUID per photo (unknown from server — stored in localStorage collection records) |
| Photo blobs | IndexedDB `bgPhotoStore`, keyed by those UUIDs |
| Source/provider URL | **NOT STORED** — `PhotoCollection.photos[]` is `{ id: string }` only; no URL field exists in the `CollectionPhoto` type |
| Storage type | `{ type: 'custom', photoId: <UUID> }` |
| Pre-026B existence | YES — confirmed; they were the only representation of these themes |

See `artifacts/pack-checklist/src/lib/bgCollections.ts`:
```ts
export interface CollectionPhoto {
  id: string;
  // No `dataUrl` — binary stored in IndexedDB (bgPhotoStore.ts).
}

export interface PhotoCollection {
  id: string;
  name: string;
  photos: CollectionPhoto[];
}
```

**There is no URL, filename, label, or provenance metadata stored with custom collection photos. Only a UUID.** The actual image bytes live only in IndexedDB blobs.

---

## PART B — RECOVER THE EXACT ORIGINAL THEME CONTENT

### B.1 — Server-Side Recovery Status

The server-side codebase provides **zero recoverable content** about the original four themes:

- `localStorage['trailweigh:photoCollections']` is browser-only storage
- IndexedDB `bgPhotoStore` is browser-only storage
- No API endpoint exposes stored custom photos
- No database table stores custom background photos (the DB stores gear/locker data only)
- No source file ever defined the original photo sets in code

**All four original themes are: NOT RECOVERABLE from server-side inspection.**

### B.2 — What Would Be Visible in the Browser

When the user opens their browser and opens the Background picker:

| Item | Browser-Accessible |
|---|---|
| Collection UUID/ID per theme | YES — `localStorage['trailweigh:photoCollections']` |
| Photo UUID/IDs per theme | YES — same JSON array |
| Number of photos per theme | YES — `col.photos.length` |
| Image filenames | NO — not stored |
| Image labels/captions | NO — not stored |
| Source/provider URL | NO — not stored |
| Image bytes (blobs) | YES — IndexedDB |
| Thumbnail renderings | YES — rendered in browser UI from IndexedDB blobs |

### B.3 — Recovery Classification

| Theme | Collection UUID | Photo UUIDs | Photo Bytes | URL Metadata | Server Recovery |
|---|---|---|---|---|---|
| Psychedelic | UNKNOWN | UNKNOWN | In IndexedDB (browser only) | NOT STORED | NOT POSSIBLE |
| Retro-Outdoors | UNKNOWN | UNKNOWN | In IndexedDB (browser only) | NOT STORED | NOT POSSIBLE |
| Topo | UNKNOWN | UNKNOWN | In IndexedDB (browser only) | NOT STORED | NOT POSSIBLE |
| Trails US | UNKNOWN | UNKNOWN | In IndexedDB (browser only) | NOT STORED | NOT POSSIBLE |

### B.4 — Browser-Side Recovery Instructions (for the user)

To manually extract the original collection metadata, the user can open their browser DevTools console on the TrailWeigh app and run:
```js
JSON.parse(localStorage.getItem('trailweigh:photoCollections'))
```
This will reveal the UUIDs and photo counts for each original collection, but not image bytes or URLs.

---

## PART C — SEARCH HISTORY FOR ORIGINAL DEFINITIONS

### C.1 — Git History Search Result

Searched all commits in git history for BackgroundPicker.tsx changes mentioning theme names. **Result: No git commit ever contained source-code definitions for the original Psychedelic, Retro-Outdoors, Topo, or Trails US themes.**

| Commit | What it did |
|---|---|
| `fc08983` (pre-026B) | Last state before 026B; BackgroundPicker had only Landscape built-in + `collections.map()` |
| `6ad2182` (026B) | First and only commit to add built-in definitions for these 4 themes — the 026B bad copies |

The original four themes **were always user-created data** stored in localStorage/IndexedDB. They were never defined in source code.

### C.2 — Recovery Status per Theme

| Theme | Git Status | Recovery |
|---|---|---|
| Psychedelic | NEVER IN SOURCE CODE | NOT FOUND |
| Retro-Outdoors | NEVER IN SOURCE CODE | NOT FOUND |
| Topo | NEVER IN SOURCE CODE | NOT FOUND |
| Trails US | NEVER IN SOURCE CODE | NOT FOUND |

### C.3 — Comparison Against Current Originals

Cannot compare because:
1. Original themes were never in source code
2. Current originals are in browser storage (inaccessible server-side)

Classification: **CANNOT COMPARE** for all four themes.

---

## PART D — WHY 026B CREATED BAD COPIES

### D.1 — Why 026B Failed to Recognize the Existing Original Themes

**026B read only source code.** It inspected `BackgroundPicker.tsx`, `bgCollections.ts`, `bgPhotoStore.ts`, and `ReviewPage.tsx`. None of these files contain any definition of the original photo sets — those are runtime data in the user's browser. 026B correctly identified the _storage mechanism_ (user custom collections, localStorage+IndexedDB) but then proceeded to create new built-in preset arrays rather than recovering or migrating the existing data.

### D.2 — Did It See Only Names?

Yes. The 026B prompt named "Psychedelic, Retro-Outdoors, Topo, Trails US" as the themes to fix. 026B saw those names in the prompt but had no access to the actual photo content. It created new built-in presets from scratch using names that matched the prompt's theme labels.

### D.3 — New Hard-Coded Unsplash IDs from Memory

Yes — confirmed. The 026B diff (commit `6ad2182`) added 24 new Unsplash photo IDs across four preset arrays. None of these IDs were derived from the original user collections. They were invented by the agent from its training knowledge of Unsplash photo URLs.

The 026B report itself acknowledged this risk:
> "Unsplash photo IDs unverified — 24 new photo IDs (6 per theme) were chosen from memory. Any that don't exist show as blank thumbnails."

### D.4 — No UUID/Photo ID Mapping Attempted

026B made no attempt to read, reference, or map the original collection UUIDs or photo UUIDs. The original `PhotoCollection` objects (with their UUID IDs and photo arrays) in localStorage were invisible to the agent.

### D.5 — No Preservation of Exact Photo Sets

026B did not preserve the exact photo sets. It created entirely new photo definitions unrelated to the original content.

### D.6 — Why Bad Copies Appear Before Originals

The dropdown render order in post-026B code:
1. `BUILTIN_THEMES.map()` — static compile-time array, always first in JSX
2. `collections.map()` — runtime localStorage data, always after built-ins

Since the 026B built-ins (`'psychedelic'`, `'retro-outdoors'`, `'topo'`, `'trails-us'`) were inserted into `BUILTIN_THEMES`, they appear before the original localStorage collections, which have UUID IDs and appear in `collections.map()`.

### D.7 — Why Both Sets Remain Visible

026B added no deduplication logic. The code has no mechanism to detect that a `PhotoCollection` in localStorage has the same display name as a `BUILTIN_THEMES` entry. The dropdown simply renders all 5 built-ins then all localStorage collections without any name-collision suppression.

### D.8 — De-Duplication Logic

No de-duplication logic exists — by name, semantic identity, or any other criterion. The `BUILT_IN_IDS` guard at line 570 only prevents the active theme ID from becoming invalid:
```ts
const BUILT_IN_IDS = BUILTIN_THEMES.map(t => t.id);
if (!BUILT_IN_IDS.includes(activeThemeId) && !collections.find(c => c.id === activeThemeId)) {
  setActiveThemeId('landscapes');
}
```
This compares by ID, not name. The original collections have UUID IDs that are never equal to the built-in string IDs, so no conflict is detected.

### D.9 — Could Selecting an ORIGINAL Second-Set Theme Still Fail Share/Review?

**YES — CONFIRMED.** The original themes are still `PhotoCollection` objects in localStorage. When the user selects a photo from them, the code at line 954 (custom theme panel) fires:
```tsx
onClick={() => onBackgroundChange({ type: 'custom', photoId: photo.id })}
```
This saves `{ type: 'custom', photoId: '<UUID>' }`. ReviewPage line 358:
```ts
if (bg?.type === 'preset') {
```
...explicitly requires `type === 'preset'`. The custom type is discarded. **Original themes still fail Share/Review after 026B.**

### D.10 — Could Selecting a BAD First-Set Theme Share With Wrong Content?

**YES — CONFIRMED.** Selecting any photo from the 026B built-in themes saves `{ type: 'preset', id: 'psychedelic-aurora' }` etc. ReviewPage passes this through to reviewers. The reviewer sees the 026B-invented Unsplash photos (Northern Lights, Neon City, etc.), NOT the owner's original intended imagery from their IndexedDB collection.

---

## PART E — TRAILS US SPECIAL VERIFICATION

### E.1 — Original Trails US Content

**NOT RECOVERABLE from server.** The original Trails US collection is a `PhotoCollection` in the user's browser localStorage with a UUID ID and an unknown number of photos (blobs in IndexedDB). No source URL, filename, or caption metadata is stored. The actual image content is unknown from the server side.

### E.2 — 026B Trails US Content

The 026B Trails US preset array contains 6 Unsplash photos:
| Preset ID | Label | Unsplash ID |
|---|---|---|
| `trails-yosemite` | Yosemite | `1472214103451-9374bd1c798e` |
| `trails-zion` | Zion Canyon | `1469854523086-cc02fe5d8800` |
| `trails-olympic` | Olympic Coast | `1454496522488-7a8e488e8606` |
| `trails-rainier` | Mt. Rainier | `1433086966628-ab1c5087a33d` |
| `trails-forest` | Forest Path | `1483185406765-2e05d1b4a2bf` |
| `trails-mesa` | High Desert | `1476514525535-07fb3b4ae5f1` |

These are **generic US scenic landscape photos** (iconic national park shots, forest paths, high desert vistas). They are not trail maps, trail-specific photography, or any distinctive content.

### E.3 — Comparison to Original

Cannot directly compare — original content is in IndexedDB (browser only, no server access, no stored URL metadata).

However, the theme name "Trails US" is specific and evocative. The original user-curated content could plausibly include trail maps, trail signs, trail-specific scenery, or other intentional thematic choices that differ from the generic 026B scenic set.

### E.4 — Classification

**026B TRAILS US CONTENT = INCORRECT REPLACEMENT**

Evidence: The 026B photos were invented from agent memory with no reference to the actual original content. The original content is user-curated (purpose unknown, but distinct from a set invented by the agent). Even if some photos are visually similar, they are definitionally different images unless proven identical — and no such proof is possible without browser access.

---

## PART F — DESIGN THE CORRECT MIGRATION (NO IMPLEMENTATION)

### F.A — Can Original Themes Be Converted Using Exact Recovered URLs/Assets?

**NO.** The original custom collection photos have no stored URL provenance. `CollectionPhoto` stores only `{ id: string }` (a UUID). The original source URL (if any — the user may have uploaded from local disk) is not recorded anywhere in the application's storage schema. There are no URLs to recover.

### F.B — If Original Images Exist Only as IndexedDB Blobs, What Must Happen?

Two-step process:
1. **Extract blobs from IndexedDB.** The repair code (or a browser-side migration utility) must read each blob using `getPhotoBlob(photoId)` from `bgPhotoStore.ts`.
2. **Upload to permanent storage.** Each blob must be uploaded to a permanent, publicly-accessible URL (e.g. Replit Object Storage / App Storage). The returned permanent URL becomes the `photoId` equivalent for a new `{ type: 'preset', id: 'stable-id' }` entry.

Without permanent hosted URLs, `type: 'preset'` backgrounds cannot work — ReviewPage needs a URL that any browser can fetch without the owner's IndexedDB.

This is a **non-trivial migration** requiring:
- Browser-side code to read IndexedDB blobs
- An API endpoint to receive and store the uploaded blobs (or direct client-side object storage SDK)
- A migration flow the user must actively trigger
- New stable preset IDs for each migrated photo

### F.C — Can a Compatibility Mapping Be Created From Old `{type:'custom', photoId}` to New Built-In Preset IDs?

**Only if the mapping is known in advance.** The original `photoId` values are UUIDs from IndexedDB. After migration (step F.B), each uploaded blob gets a new stable ID/URL. A compatibility map from old UUID to new stable ID could then be baked into source code so that any saved pack file or locker file with an old `{type:'custom', photoId: '<uuid>'}` gets resolved to the new permanent asset.

**This mapping cannot be auto-generated** — the original UUIDs are unknown from the server. The user must perform the migration to generate the mapping.

### F.D — Should Bad 026B Built-Ins Be Removed Only AFTER Exact Original-Theme Parity Exists?

**YES.** Removing the 026B built-ins before the migration is complete would leave users with no working Share/Review background from those themes. The correct sequence is:
1. Add permanent built-ins from exact original content (after migration)
2. Verify with user that new built-ins show the correct photos
3. Then remove the 026B bad copies

### F.E — Should Original Local Collections Be Hidden Rather Than Deleted?

**YES.** Until the migration is verified, the original local collections should remain intact in localStorage/IndexedDB. After the user confirms migration success, they can optionally be removed (or left as user-deletable custom themes). Do not programmatically delete them — deleting IndexedDB blobs is permanent.

The fix could suppress collections from the dropdown by name if they match a successfully-migrated built-in theme, with a user-visible opt-in confirmation step.

### F.F — Exact Files the Correction Would Need to Change

| File | Why |
|---|---|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Remove 026B bad-copy preset arrays + BUILTIN_THEMES entries for the 4 bad themes; replace with migrated permanent definitions |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Update `ALL_BUILTIN_PRESETS` reference if preset arrays change |
| `artifacts/pack-checklist/src/lib/bgPhotoStore.ts` | Possibly add migration helper to read blobs for upload |
| New migration utility (browser-side) | UI or script to extract IndexedDB blobs and upload to object storage |
| `artifacts/api-server/` | New upload endpoint OR Replit Object Storage SDK integration |
| `.agents/memory/builtin-theme-architecture.md` | Revise to reflect corrected architecture after fix |

### F.G — User Live Tests Proving the Repair

1. Open Background picker → verify all 4 theme photo grids show the user's original photos (not 026B's invented ones)
2. Select a photo from each corrected theme → verify no duplicates remain in dropdown
3. Save a locker file with each new preset → reload → verify background persists
4. Share a link with each theme selected → open in a private/incognito window → verify reviewer sees the correct background
5. Confirm no duplicate theme names appear in the dropdown
6. Confirm old saved locker files (pre-migration) either migrate automatically or degrade gracefully (no crash)

---

## PART G — AUDIT OF 026B `.agents/memory` CHANGES

### G.1 — What 026B Changed

**File 1: `.agents/memory/MEMORY.md`**
Added one index line:
```
- [Built-in theme architecture](builtin-theme-architecture.md) — ALL 5 permanent themes use { type:'preset' }; use ALL_BUILTIN_PRESETS (not PRESETS) for cross-theme resolver in Checklist.tsx.
```

**File 2: `.agents/memory/builtin-theme-architecture.md`** (new file)
Created with the rule: "Permanent built-in themes (Landscape, Psychedelic, Retro-Outdoors, Topo, Trails US) MUST be stored as `{ type: 'preset', id: 'stable-id' }`, not `{ type: 'custom', photoId }`."

Full content includes:
- The architectural rule and why it exists
- Key symbols: `BUILTIN_THEMES`, `ALL_BUILTIN_PRESETS`, `PRESETS`
- A caveat: "Photo IDs were chosen to be thematically appropriate but should be user-verified in the browser (broken images show as empty thumbnails with no functional impact on the architecture)."

### G.2 — Was It Requested?

**NO.** The 026B prompt did not ask for memory file changes. The 026B prompt's "AUTHORIZED WRITES ONLY" section listed application source files and report files — not `.agents/memory/*`.

### G.3 — Was It Required for the Application Repair?

**NO.** The application repair (adding preset arrays to BackgroundPicker.tsx) is self-contained. The memory entry is supplementary documentation, not a prerequisite.

### G.4 — Could It Bias Future Agent Behavior?

**YES — AND IT ALREADY HAS CAUSED BIAS.** The memory entry states as fact that "ALL 5 permanent themes use { type:'preset' }" and treats the 026B implementation as the authoritative rule. A future agent reading this memory would conclude:
- The 026B built-in photo sets are the correct/intended definitions
- The duplicate localStorage collections are merely a known follow-up issue
- The 026B architecture is proven complete

This could lead a future agent to skip investigating the originals, remove the duplicate localStorage collections without recovering content, or treat the invented Unsplash IDs as legitimate permanent definitions.

The caveat ("Photo IDs were chosen to be thematically appropriate but should be user-verified") does signal uncertainty, but frames it as a cosmetic/verification concern rather than a fundamental content-correctness problem.

### G.5 — Should the Later Correction Revert or Revise?

**REVISE, not revert.** The architectural principle (permanent themes should use `{ type: 'preset' }`) is correct. The memory should be revised to:
1. Reflect that the 4 non-Landscape theme IDs installed by 026B contain unverified content (not original user photos)
2. Document that the correct repair requires migration from IndexedDB blobs to permanent storage
3. Remove the implication that 026B's specific Unsplash IDs are authoritative
4. Preserve the `ALL_BUILTIN_PRESETS` / `PRESETS` resolution guidance (architecturally correct)

---

## EVIDENCE LEDGER

| Evidence Item | Source | Verified |
|---|---|---|
| Pre-026B dropdown had only Landscape built-in | `git show fc08983:.../BackgroundPicker.tsx` line 1343 | ✅ |
| `BUILT_IN_IDS = ['landscapes']` before 026B | `git show fc08983:.../BackgroundPicker.tsx` line 516 | ✅ |
| 026B added 4 preset arrays + BUILTIN_THEMES | `git show 6ad2182` diff | ✅ |
| Dropdown renders BUILTIN_THEMES then collections | Current BackgroundPicker.tsx lines 1397–1424 | ✅ |
| `PhotoCollection` stores only `{ id: string }` per photo (no URL) | `bgCollections.ts` `CollectionPhoto` type | ✅ |
| ReviewPage line 358: `if (bg?.type === 'preset')` | `grep` on ReviewPage.tsx | ✅ |
| Original themes never defined in any source file | `git log --all` search, no hit | ✅ |
| 026B invented Unsplash IDs from memory (acknowledged in 026B report) | `PROMPT_026B_REPORT.md` line 120+ | ✅ |
| Memory files modified by 026B without being requested | 026B diff + 026B prompt authorized writes list | ✅ |

---

## STILL UNKNOWN ITEMS

| Unknown | Why Unknown | How to Resolve |
|---|---|---|
| Original collection UUID for Psychedelic | Browser localStorage only | User runs `JSON.parse(localStorage.getItem('trailweigh:photoCollections'))` in DevTools |
| Original collection UUID for Retro-Outdoors | Browser localStorage only | Same |
| Original collection UUID for Topo | Browser localStorage only | Same |
| Original collection UUID for Trails US | Browser localStorage only | Same |
| Number of photos in each original collection | Browser localStorage only | Same (read `col.photos.length`) |
| Photo UUIDs within each original collection | Browser localStorage only | Same (read `col.photos.map(p=>p.id)`) |
| Whether all original IndexedDB blobs still exist | Browser IndexedDB only | Call `getPhotoBlob(photoId)` for each UUID in DevTools |
| What the original Trails US photos actually depict | No metadata stored | Must view thumbnails in browser UI |
| Whether original Psychedelic photos are visually distinct from 026B set | No metadata stored | Must view thumbnails in browser UI |
| Whether any original photos came from Unsplash (recoverable URL) | No provenance stored | Cannot determine without user knowledge |
| Whether 026B Unsplash IDs resolve to valid photos | Not verified from server | User opens Background picker and checks each new theme for blank tiles |

---

## MANDATORY FINAL CLASSIFICATION

```
USER-VERIFIED BAD COPY ORDER = CONFIRMED
BAD COPY SET = FIRST FOUR AFTER LANDSCAPE
ORIGINAL SET = SECOND FOUR AFTER LANDSCAPE

ORIGINAL PSYCHEDELIC RECOVERED = NO
ORIGINAL RETRO-OUTDOORS RECOVERED = NO
ORIGINAL TOPO RECOVERED = NO
ORIGINAL TRAILS US RECOVERED = NO

026B BAD COPIES USE ORIGINAL PHOTOS = NO
026B CREATED NEW DUPLICATE BUILT-INS = YES
ORIGINAL SECOND-SET THEMES STILL SAVE AS CUSTOM = YES
BAD FIRST-SET THEMES SHARE WITH WRONG CONTENT = YES

026B TRAILS US CONTENT = INCORRECT REPLACEMENT

SAFE EXACT-CONTENT MIGRATION PATH IDENTIFIED = YES (requires browser-side blob extraction + object storage upload)
APPLICATION SOURCE CHANGED BY 026C = NO
BROWSER STORAGE CHANGED BY 026C = NO
DATABASE CHANGED BY 026C = NO
REPLIT.MD CHANGED BY 026C = NO
PROJECT MEMORY CHANGED BY 026C = NO
USER VERIFICATION = NOT REQUESTED YET
```

---

## EXACT NEXT REPAIR SCOPE

The correct repair (026D or later) must:

1. **User action first:** The user must open the Background picker in their browser and, for each original theme (positions 6–9 in dropdown), record the UUIDs from localStorage DevTools and confirm thumbnails are visible (blobs intact in IndexedDB).

2. **Migration step:** Build a browser-side migration flow that:
   a. Reads each original collection's photo blobs from IndexedDB via `getPhotoBlob()`
   b. Uploads each blob to Replit Object Storage (App Storage) via the `object-storage` skill
   c. Records the mapping: `originalPhotoUUID → permanentStorageKey/URL`
   d. Writes new `BUILTIN_THEMES` preset entries in BackgroundPicker.tsx using the permanent URLs

3. **Replace 026B bad copies:** After migration is complete and user-verified, replace the 4 026B-invented preset arrays with the migrated permanent entries.

4. **Add compatibility mapping:** Map old `{ type: 'custom', photoId: '<UUID>' }` values to new `{ type: 'preset', id: '<stable-id>' }` so existing saved locker/pack files continue to resolve correctly.

5. **Remove or suppress duplicate localStorage collections** from the dropdown after user confirms the migration is correct.

6. **Revise memory entry** in `.agents/memory/builtin-theme-architecture.md` to accurately reflect the corrected architecture.

---

*Report created: 2026-08-13*
*026C classification: DIAGNOSTIC ONLY — NO APPLICATION SOURCE CHANGED*
