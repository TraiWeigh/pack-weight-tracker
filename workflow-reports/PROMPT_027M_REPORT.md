# PROMPT 027M — Photo Control + Visual Library / Locker Architecture Diagnostic
**Internal version:** 027M-PHOTO-VISUAL-LIBRARY-MOBILE-ARCHITECTURE-DIAGNOSTIC-2026-08-14-R2  
**Report generated:** 2026-08-14  
**Scope:** Read-only diagnostic. No application code modified.  
**Routes affected:** none  
**Production routes touched:** none

---

## 1. Internal Version

027M-PHOTO-VISUAL-LIBRARY-MOBILE-ARCHITECTURE-DIAGNOSTIC-2026-08-14-R2

---

## 2. Time / Actions / Lines

- Files inspected: 12 source files, 4 parallel subagent explorations
- Lines of code reviewed: ~1,800
- Lines changed: 0
- Estimated agent time: ~18 minutes
- Cost: within ESTIMATED SCOPE

---

## 3. Preflight Git Status

Only `artifacts/pack-checklist/src/pages/MobileDesignPrototypeV3.tsx` and `MobileFunctionalV3.tsx` carry 027J–027L edits versus the prior clean state. No production files were modified in any prior 027x prompt. No outstanding staged changes relevant to this diagnostic.

---

## 4. Files / Components Inspected

| File | Purpose |
|---|---|
| `artifacts/pack-checklist/src/hooks/usePackData.ts` | Item type, persistence, localStorage schema |
| `artifacts/pack-checklist/src/components/LockerPanel.tsx` | Locker UI, LockerEntry interface |
| `artifacts/pack-checklist/src/lib/bgPhotoStore.ts` | Theme/background photo storage engine |
| `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` | Scanner / Scan Gear List file input |
| `artifacts/pack-checklist/src/lib/lockerApi.ts` | Locker API client (GET/POST/PUT) |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Main app host, LockerPanel mount location |
| `artifacts/api-server/src/routes/locker.ts` | Locker API routes |
| `artifacts/api-server/src/routes/importGear.ts` | Scan Gear List API route |
| `artifacts/api-server/src/routes/links.ts` | Share link API routes |
| `lib/db/src/schema/index.ts` | DB schema (tables) |
| `artifacts/pack-checklist/src/components/ui/` | All 57 UI primitives |
| `workflow-reports/PROMPT_027L_REPORT.md` | 027L baseline |

---

## 5. Active Item Data Model (Audit A)

### GearItem — canonical type
```ts
// artifacts/pack-checklist/src/hooks/usePackData.ts:6-14
export type GearItem = {
  id: string;        // crypto.randomUUID()
  sub: string;       // subtitle / brand / model
  desc: string;      // item name
  weightOz: number;  // weight in ounces (always)
  qty: number;
  checked: boolean;
  expendable: boolean;
};
```

Seven declared fields. No photo, media, image, or arbitrary metadata field.

### Persistence path
| Layer | Mechanism | Scope |
|---|---|---|
| Active list | `localStorage` (`trailweigh:store:v5`) | Device-local |
| Saved Locker entries | `localStorage` (`trailweigh:locker`) + `/api/locker` JSON | Cross-device via API |
| Share links | `/api/links` (DB `share_links` table, payload = jsonb) | Server, public token |

Locker payload stored server-side (`locker_entries.payload` jsonb column) is the full gear store object plus background styling metadata. It contains **no binary data**.

### Arbitrary-field survival
`sanitizeItems()` uses `...item` spread before enforcing mandatory fields, so unknown properties that already exist in localStorage JSON survive the round-trip at runtime and are re-persisted. This means a `photoId?: string` field added to a `GearItem` object **would persist through load/save cycles** even without a TypeScript schema change — but this is not a designed capability.

### DOES THE CURRENT ITEM MODEL SUPPORT PHOTOS?
**NO.**

Required changes when item photos are built:
1. Add `photoId?: string` (v1, single photo) to `GearItem` type
2. Extend store serialisation to include/exclude `photoId` from shared payloads appropriately
3. If multi-photo v2: change to `photoIds?: string[]`
4. DB: `locker_entries.payload` schema is jsonb and schema-less — existing server code requires no migration for the field addition itself; however if server-backed photo storage is chosen, a new `media_assets` table is required separately

---

## 6. Current Locker Architecture (Audit B)

### LockerEntry interface
```ts
// artifacts/pack-checklist/src/components/LockerPanel.tsx:15-37
interface LockerEntry {
  id: string;
  name: string;
  savedAt: number;  // epoch ms
  store: Store;     // full gear store
  background?: BgValue;
  // presentation metadata (bar styling, etc.)
}
```

### Component structure
- **File:** `artifacts/pack-checklist/src/components/LockerPanel.tsx` (249 lines)
- **UI container:** Panel — rendered as a sidebar section inside `Checklist.tsx:3063-3079`. Not a modal, not a drawer, not a separate route.
- **Rendered content:** A flat scrolling list of saved entry cards (one card per save), each showing name, savedAt date, and action buttons (Load, Delete). An empty state directs users to the Save button.
- **Tabs / subviews:** **None.** The component is a single flat list with no tab bar, section switcher, or subview mechanism.
- **Mobile behaviour:** Inherits from the Checklist sidebar — collapses into the sidebar-toggle-controlled panel on smaller screens. No dedicated mobile adaptation.
- **Server sync:** `lockerApi.ts` — authenticated GET/POST/PUT/DELETE to `/api/locker`. The payload is pure JSON (store + background metadata), never binary files.

### Could Locker host a Visual Library tab?
**YES — architecturally natural and low-risk.** `tabs.tsx` (Radix Tabs) is already installed in `components/ui/` and currently unused. Adding a two-tab bar ("Files" | "Photos") to LockerPanel is:
- Backward-compatible (existing card list becomes the "Files" tab)
- No new dependency required
- No structural rework of LockerPanel's save/load/delete logic

The only constraint: the Photos tab would initially be device-local (IndexedDB) while the Files tab is cross-device (server API). Both sources are readable in the browser. This mixed-persistence situation should be disclosed to the user with appropriate labelling ("Saved on this device").

**Determination: A — Visual Library inside Locker is architecturally natural.**

---

## 7. Current Theme/Background Photo Infrastructure (Audit D)

### bgPhotoStore.ts
```
DB name: trailweigh (IndexedDB)
Store:   bgPhotos
KeyPath: photoId (UUID string)
Record:  { photoId, blob, mimeType, width, height }
```

### Key capabilities
| Function | Behaviour |
|---|---|
| `validateImageFile(file)` | Rejects > 25 MiB; allows JPEG/PNG/WebP/GIF only |
| `compressPhotoFile(file)` | Downsizes if long edge > 1920px; JPEG at 0.82 quality; preserves PNG transparency |
| `storePhoto(...)` | Writes blob to IndexedDB |
| `getPhotoBlob(id)` | Reads blob from IndexedDB |
| `deletePhoto(id)` | Deletes single record |
| `deletePhotos(ids[])` | Batch delete |
| `cleanupOrphanedPhotos(refIds)` | Deletes any stored ID not in refIds set |
| `createPhotoObjectUrl(blob)` | `URL.createObjectURL()` |
| `revokePhotoObjectUrl(url)` | `URL.revokeObjectURL()` |

### Storage scope
**Device-local only.** Photos are stored in the browser's IndexedDB. They are not sent to the server in any Locker payload. They do not follow the user to another device or browser. No server backup.

### WHAT IS SAFE TO REUSE FOR ITEM/STORAGE PHOTOS?

| Component | Reusable | Notes |
|---|---|---|
| `validateImageFile()` | ✓ YES | Generic file validation; works for any photo type |
| `compressPhotoFile()` | ✓ YES | Generic resize/quality helper |
| `createPhotoObjectUrl()` / `revokePhotoObjectUrl()` | ✓ YES | Standard object URL helpers |
| IndexedDB `bgPhotos` store | ⚠ PARTIAL | Could store item photos in the SAME IndexedDB database using a NEW object store (e.g. `itemPhotos`). Sharing the DB is fine; sharing the `bgPhotos` store is NOT — keep photo types in separate stores. |
| `cleanupOrphanedPhotos()` pattern | ✓ YES | Apply the same orphan-cleanup approach for item photos |

### WHAT MUST NOT BE REUSED?

| Component | Reason |
|---|---|
| The `bgPhotos` object store directly | Conceptual mixing — theme photos and item photos must remain distinct types |
| Device-local model for cross-device photos | If item photos are expected in the user's Locker on another device, IndexedDB is the wrong persistence layer. Do not reuse this model for server-backed photos without surfacing the limitation explicitly to the user. |
| Legacy migration functions | `migrateCollectionsToIndexedDb` / `migrateLegacyActiveBackground` are one-time migration utilities; irrelevant for new item photo infrastructure |

---

## 8. Current Scanner / File-Input Infrastructure (Audit E)

### ImportGearPanel.tsx
- **UI container:** Panel component (not a Sheet, Dialog, or Drawer). Rendered as a collapsible section in the Checklist sidebar.
- **File input:**
  ```html
  <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.numbers" />
  ```
- **Accepted types:** PDF, DOCX, DOC, XLSX, XLS, Numbers. **No image types.** No `capture` attribute.
- **Mobile camera capture:** NOT currently enabled. `capture="environment"` is absent.
- **API:** `fetch('/api/import-gear', { method: 'POST', body: formData })` — the file is processed in memory on the server and never persisted.
- **Drag/drop:** Supported alongside the file picker.
- **Reusability:** The multer/multipart pipeline in `importGear.ts` demonstrates that the server already handles `multipart/form-data` uploads. The file input pattern itself is simple and can be replicated independently for photo upload. **The Scanner file picker is not directly reusable for photo capture** because its accept types and purpose differ, but the multipart server pattern is a usable reference.

---

## 9. Current Server / Media Capability (Audit F)

### API routes inventory
```
POST   /api/import-gear       — multipart; memory-only; no persistence
POST   /api/links             — create share link (jsonb payload)
GET    /api/links/:id         — resolve share link
GET    /api/locker/status     — auth check
GET    /api/locker            — list saved entries (authenticated)
POST   /api/locker            — create entry (authenticated)
PUT    /api/locker/:id        — update entry (authenticated)
PATCH  /api/locker/:id        — partial update (authenticated)
DELETE /api/locker/:id        — delete entry (authenticated)
POST   /api/webhooks/clerk    — Clerk webhook (user.created only)
```

### Object / blob storage
**None.** No S3, no Replit Object Storage, no `@replit/object-storage` import, no uploads directory, no server file lifecycle.

### DB schema
```sql
-- lib/db/src/schema/index.ts
share_links:    id, payload (jsonb), created_at
locker_entries: id, user_id, name, saved_at, payload (jsonb), created_at
-- No media / photos table
```

### Authentication on media
No authenticated media route exists. Image data never touches the server currently.

### Deletion lifecycle
Server deletion is DB-row only. Clerk webhook handles `user.created`; `user.deleted` is NOT handled — no account-delete cascade exists.

### DURABLE ITEM-PHOTO BACKEND EXISTS = **NO**

### CROSS-DEVICE PHOTO ACCESS EXISTS = **NO**

### Smallest plausible future backend (no implementation)
1. New `media_assets` table: `id, user_id, relationship_type, relationship_id, mime_type, width, height, size_bytes, created_at`
2. Object storage bucket (Replit Object Storage is available; S3-compatible API is also feasible)
3. Authenticated POST `/api/media` → accept multipart image, compress if needed, store to object storage, write DB row, return `{ id, url }`
4. Authenticated DELETE `/api/media/:id` → delete from object storage, remove DB row; orphan check against item references
5. Clerk `user.deleted` webhook handler → cascade-delete all `media_assets` rows + object-storage files for that `user_id`

---

## 10. Existing UI Primitives (Audit G)

| Primitive | File | Currently Used | Relevant for Photo UX |
|---|---|---|---|
| `Sheet` (side sheet) | `sheet.tsx` | Only inside unused `sidebar.tsx` | Low relevance |
| `Drawer` (Vaul bottom-sheet) | `drawer.tsx` | **NOT USED anywhere** | ✓ HIGH — ideal for photo action bottom sheet on mobile |
| `Dialog` | `dialog.tsx` | Only via `command.tsx` | Possible, but less thumb-friendly |
| `Popover` | `popover.tsx` | Used in BackgroundPicker | Too small for photo gallery |
| `DropdownMenu` | `dropdown-menu.tsx` | Used in Checklist | Usable for compact 3-item action menu |
| `Tabs` | `tabs.tsx` | **NOT USED anywhere** | ✓ HIGH — natural for Locker Files/Photos tab bar |
| `Carousel` | `carousel.tsx` | NOT USED | Potential for multi-photo gallery (v2) |
| `ScrollArea` | `scroll-area.tsx` | NOT USED | Useful in photo grid |
| `Input` | `input.tsx` | Used | Native file input extension |

**Key finding:** The two most relevant primitives for the photo UX — `Drawer` (Vaul bottom-sheet) and `Tabs` — are both installed and present but completely unused in the app today. No new UI package is required.

---

## 11. Item-Photo Control Placement Comparison (Audit H)

The photo control belongs on the item panel per user decision. Evaluating options within that constraint:

### Option A — Camera icon on collapsed item row

| Factor | Assessment |
|---|---|
| Discoverability | HIGH — always visible |
| Clutter | HIGH — adds 8th visual element to already-minimal collapsed row |
| Touch target | RISKY — compressed into the dense 4-column grid alongside handle/weight |
| Interaction conflicts | YES — row body already triggers expand/collapse; camera icon needs `stopPropagation` |
| Accessibility | Manageable with `aria-label` |
| Zero-photo state | Icon always shown even when no photo exists → implies a capability users must learn to ignore |
| Scale to multiple photos | Would need badge/count overlay |
| Implementation complexity | Low (just add an icon column) |
| V3 visual hierarchy impact | Disrupts the approved 4-column grid (handle calibration work at risk) |

**Verdict: NOT RECOMMENDED** — disrupts the calibrated grid; clutter problem on a row already at maximum density.

### Option B — Camera icon within expanded item detail panel only

| Factor | Assessment |
|---|---|
| Discoverability | LOWER — hidden until item is expanded |
| Clutter | LOW — appears only in expanded context where more visual space exists |
| Touch target | GOOD — expanded panel has room for a comfortable tap target |
| Interaction conflicts | NONE — separate expanded zone from collapsed row |
| Accessibility | Straightforward |
| Zero-photo state | Clean: icon reads "Add photo" with a placeholder outline |
| Scale to multiple photos | Easy — add photo count or grid in expanded zone |
| Implementation complexity | Low |
| V3 visual hierarchy impact | ZERO — collapsed row unchanged |

### Option C — Collapsed indicator when photo exists + full actions in expanded

| Factor | Assessment |
|---|---|
| Discoverability | MEDIUM — photo-less items show no indicator (hidden capability); items with photos show a tiny thumbnail |
| Clutter | VERY LOW — zero-photo items are completely clean; thumbnail is small and meaningful |
| Touch target | Good in expanded; tiny thumbnail in collapsed is tappable with `min-w-[44px]` treatment |
| Interaction conflicts | Thumbnail on collapsed row needs `stopPropagation` |
| Accessibility | `alt` text on thumbnail required |
| Zero-photo state | Perfectly clean — no orphaned icon |
| Scale to multiple photos | Collapsed: count badge overlay on thumbnail; expanded: full gallery |
| Implementation complexity | Medium — two modes (with/without photo) for collapsed row |
| V3 visual hierarchy impact | LOW — a 20px × 20px circular thumbnail fits within the text column (col 1) without touching the calibrated handle/weight columns |

### RECOMMENDED ITEM-PANEL PHOTO IMPLEMENTATION

**Option C** — with a clarification to protect the grid calibration:

The thumbnail/indicator lives in the **text column (col 1, `minmax(0,1fr)`)** as a small inline element beside the item name, NOT as a new grid column. This means the handle position ratios (0.735 / 0.746 / 0.771) are fully preserved. In the collapsed zero-photo state the row is identical to today. When a photo exists, a 20px circular thumbnail appears to the right of the name within col 1 (the flexible column absorbs it). All photo actions (Take, Choose, View, Replace, Remove) live in the expanded panel.

---

## 12. Recommended Item-Photo Action Flow (Audit I)

### v1 minimum — single photo per item

**Collapsed row (has photo):**
- 20px circular thumbnail in text column, `stopPropagation` on tap
- Tap thumbnail → jump to expanded panel (already handled by accordion) showing the full photo

**Expanded panel (no photo yet):**
```
[Camera icon] Add a photo
```
Single tap → opens Vaul `Drawer` bottom sheet (already installed, unused) with three actions:
- **Take Photo** — `<input type="file" accept="image/*" capture="environment" />`
- **Choose Photo** — `<input type="file" accept="image/*" />`
- **Cancel**

**Expanded panel (photo exists):**
```
[Thumbnail 80×80] [Replace ↺] [Remove ✕]
```

**Add New Item flow (photo step):**
After entering name/weight, a third step appears:
```
Add a photo (optional)
[Take Photo]  [Choose Photo]  [Skip →]
```

### Mobile browser camera caveats
| Concern | Status |
|---|---|
| `capture="environment"` on iOS Safari | ✓ Works — invokes camera directly |
| `capture="environment"` on Android Chrome | ✓ Works |
| Fallback if camera denied | Browser shows gallery picker automatically |
| `<input type="file" accept="image/*">` without `capture` | ✓ Shows "Camera" + "Photo Library" options natively on iOS |
| WebP output from iOS camera | YES — iOS 17+ may output HEIC → browser normalises to JPEG before file object; `validateImageFile` already blocks HEIC by extension |
| Max file size | `validateImageFile()` rejects > 25 MiB (already implemented) |

### Future extensibility
- v2 multi-photo: change `photoId?: string` to `photoIds?: string[]` on GearItem; collapsed row shows `+3` badge; expanded panel shows a horizontal carousel (`carousel.tsx` already installed)
- Future AI: pass `{ photoUrl, itemName }` to recognition endpoint — no architectural rework if MediaAssets are server-backed with structured metadata

---

## 13. Visual Library Placement Comparison (Audit J)

Bottom nav is fixed at: `List | Locker | Catalog | Summary | More` — no sixth tab.

### Option A — Locker hosts a Visual Library / Photos subview (new tab bar)
- Adds a `Tabs` bar ("Files" | "Photos") to LockerPanel
- `tabs.tsx` already installed and unused
- Architecturally natural: Locker = user's personal storage hub; photos are user-owned personal data
- Backward-compatible: Files tab = current Locker card list, unchanged
- Discoverability: user already navigates to Locker to manage saved lists → Photos visible alongside
- Future storage locations: a third "Locations" tab is easy to add later

### Option B — Locker evolves into a combined list + visual hub (structural redesign)
- Requires Locker redesign beyond a tab bar
- Higher implementation risk
- Premature — current Locker has only 1-2 screens worth of content

### Option C — Catalog hosts Visual Library
- Catalog is for browsing/importing item templates (shared or preset gear)
- Mixing personal photos with a catalog is semantically wrong
- NOT RECOMMENDED

### Option D — More menu contains Photo Library
- Low discoverability — users expect "More" for settings and infrequent tools
- Photo Library is a primary feature, not a secondary settings page
- NOT RECOMMENDED for primary access

### Option E — Dedicated sixth bottom-nav tab
- User explicitly said no sixth tab
- NOT RECOMMENDED

### RECOMMENDED VISUAL LIBRARY HOME: **Option A — Locker tab "Photos"**

#### How users reach it
| Entry point | Path |
|---|---|
| Item's camera control (expanded panel) | "View in Photos Library" link → Locker > Photos tab |
| Bottom nav | Locker tab → tap "Photos" tab |
| Storage location card (future) | "See photos" → Locker > Photos tab filtered to that location |
| Search (future) | Visual search results link into Locker > Photos view |

---

## 14. Locker / Visual Library Relationship (Audit B continued)

The Locker currently has two concerns: **list management** (save/load/delete gear lists) and **cloud sync** (server-backed persistence). Adding a Photos tab makes the Locker the user's complete **personal data hub** — all their saved gear lists AND all their item/storage photos in one destination.

The Locker's server API (`/api/locker`) and the future media API (`/api/media`) are separate endpoints with separate DB tables. They co-exist without conflict under the same authentication umbrella. The Locker UI is the single front-door; the underlying storage is split by type.

---

## 15. Storage Location / Container Photo Model (Audit K)

### Current state
`Move` in the current item panel means **category reassignment only** (e.g. move item from Clothing to Luggage). No Storage Location entity exists anywhere in the codebase — no model, no DB table, no UI.

### Recommended future model (high-level, no schema)

```
StorageLocation {
  id: string           // UUID
  userId: string
  name: string         // "Garage Gear Cabinet", "Blue Bin #3"
  description?: string
  photoId?: string     // FK → MediaAsset.id
  createdAt: Date
}

GearItem (extended) {
  ...existing fields...
  photoId?: string          // FK → MediaAsset.id (v1)
  storageLocationId?: string // FK → StorageLocation.id (future)
}
```

A storage-location photo is a **property of the Storage Location entity** — not an item photo, not a Visual Library record. The Visual Library (Locker > Photos tab) aggregates all MediaAssets regardless of their `relationship_type`, giving users a unified browse view.

---

## 16. Photo / Media Type Separation (Audit L)

### Required distinctions

| Photo Type | Source | Persistence | Purpose |
|---|---|---|---|
| Item Photo | User camera/gallery | Server-backed (future) or IndexedDB (v1) | Documents an individual item |
| Storage Location Photo | User camera/gallery | Server-backed (future) | Documents a physical location/container |
| Moving Box / Container Photo | User camera/gallery | Server-backed (future) | Inventory of moving containers |
| Theme / Background Photo | User gallery | IndexedDB only (device-local by design) | Decorative — NOT inventory data |

**Theme/Background photos must NEVER be mixed with inventory MediaAssets.** They live in `bgPhotoStore` (`bgPhotos` IndexedDB store) and are intentionally device-local. Item/storage photos are inventory data that must follow the user across devices.

### Recommended unified model: `MediaAsset` with typed relationships

Rather than separate unrelated implementations per photo type, one generalised `MediaAsset` entity with a typed `relationship` field covers all inventory photo types cleanly:

```
MediaAsset {
  id: string
  userId: string
  storageKey: string        // object-storage key
  mimeType: string
  width: number
  height: number
  sizeBytes: number
  createdAt: Date
  relationship:
    | { type: 'item',            itemId: string }
    | { type: 'storageLocation', locationId: string }
    | { type: 'movingBox',       boxId: string }
}
```

This model:
- Keeps all inventory photos queryable in one place (Visual Library)
- Supports filtered views (show photos for a specific location)
- Supports future AI analysis (one endpoint receives `{ assetId, relationship }`)
- Never overlaps with Theme photos (they have a separate `bgPhotos` store / completely different lifecycle)

---

## 17. Deletion / Orphan Implications (Audit M)

### When an item photo is removed
1. Remove `photoId` reference from the `GearItem` object → re-save to localStorage + Locker API
2. If device-local (v1): call `deletePhoto(photoId)` on `bgPhotoStore`-equivalent item store
3. If server-backed (future): authenticated DELETE `/api/media/:id` → delete from object storage + remove DB row

### Orphan risk
- If an item is deleted without removing its photo: the photo blob persists in IndexedDB / object storage with no referencing item → **orphan file**
- The existing `cleanupOrphanedPhotos(referencedIds)` pattern in `bgPhotoStore.ts` already solves this for theme photos → apply identical pattern for item photos on app mount / Locker save
- Server-side: run orphan-check on `/api/media` rows versus active `GearItem.photoId` references in all `locker_entries` payloads — this is a background job concern, not a real-time concern

### Account deletion implications
- The Clerk `user.deleted` webhook currently **does not exist** in `clerkWebhook.ts` — only `user.created` is handled
- When item photos are server-backed, account deletion must cascade-delete all `media_assets` rows + object-storage files for `user_id`
- This webhook handler must be written before server-backed photos go to production

### Storage-location deletion
- Deleting a Storage Location must cascade-delete its associated `MediaAsset` (or at minimum remove the FK reference before deletion proceeds)

### Backup / log retention
- No defined policy currently. Object storage providers (Replit, S3) have their own retention settings. A policy decision is required before production.

---

## 18. Review / Share Implications (Audit N)

### Current sandbox behaviour
Share links resolve via `/api/links/:id` and read a snapshot of the `locker_entries` payload by token. The Review sandbox is isolated — reviewer changes do not affect owner data.

### Item photos in shared views
| Scenario | Risk |
|---|---|
| Photos are device-local (IndexedDB, v1) | Photos are NOT included in the share payload → **photos will not appear in shared/Review view**. Recipients see item names/weights but no photos. This must be disclosed but is acceptable for v1. |
| Photos are server-backed (future) | Share payload can reference `MediaAsset.id`; Review view needs authenticated or token-scoped URL to display image. **Risk:** if media URLs are public by object-storage key alone (no token), any person who learns the URL can access the photo — even after the share link expires. |
| Reviewer sandbox modifies owner media | Cannot happen today or in the recommended architecture — Review is read-only and sandbox-isolated. |
| Photo privacy on shared links | Sender may not expect photos to appear publicly. A per-link opt-in ("include photos in shared view: YES / NO") should be considered before server-backed photo sharing is enabled. |

### Mitigation for future server-backed photos
- Use **time-limited signed URLs** (generated on each Review page load) rather than permanent public URLs
- Share link payload stores `MediaAsset.id` references only; signed URLs are resolved at view-time
- Signed URL TTL: 1 hour (sufficient for review session)

---

## 19. AI / Visual Intelligence Compatibility (Audit O)

If `MediaAsset` records are built with the recommended structure (`id`, `userId`, `storageKey`, `relationship`, `mimeType`, `width`, `height`), the architecture **naturally supports future AI analysis**:

- AI service call: `POST /api/ai/identify { assetId, userId }` → server fetches blob from object storage → sends to vision API → returns `{ suggestedName, category, weightEstimate }`
- No rework required to the storage architecture if server-backed from the start
- **Privacy concern:** AI processing requires photos to leave the device and potentially the server → explicit user consent UI required before enabling; users must understand photos are sent to a third-party AI provider
- **Device-local v1 risk:** If photos are IndexedDB-only in v1, migrating them to server-backed storage for AI enablement will require a one-time upload migration (similar to the existing `migrateCollectionsToIndexedDb` pattern already in `bgPhotoStore.ts`)

---

## 20. Complete Mapping Table (Required)

| Feature / Question | Current Active Component or Data Path | Current Support | Reusable Infrastructure | New Data/Backend Required? | Best Mobile Home | Visual Change Required? | Risk | Confidence |
|---|---|---|---|---|---|---|---|---|
| Item photo (field) | `GearItem` type — no photo field | NO | `...item` spread survives unknown fields | Add `photoId?: string` to GearItem | Item expanded panel | None on collapsed; photo section in expanded | Low | HIGH |
| Take Photo | None | NO | `validateImageFile`, `compressPhotoFile` from bgPhotoStore | No backend for v1 (device-local); upload endpoint for v2 | Vaul Drawer bottom-sheet from expanded panel | New Drawer + file input with capture | Very low | HIGH |
| Choose Photo | None | NO | Same as above | Same as above | Same as above | Same as above | Very low | HIGH |
| View Photo | None | NO | `getPhotoBlob`, `createPhotoObjectUrl` from bgPhotoStore | No backend for v1 | Inline in expanded panel | Thumbnail + full-screen view | Low | HIGH |
| Replace / Remove Photo | None | NO | `deletePhoto` from bgPhotoStore | No backend for v1 | Expanded panel action buttons | Small icons alongside thumbnail | Low | HIGH |
| Multiple item photos (v2) | None | NO | `carousel.tsx` (installed, unused) | Array extension of above | Expanded panel gallery | Carousel in expanded | Low (deferred) | HIGH |
| Storage-location photo | No StorageLocation entity exists | NO | Same image helpers | New StorageLocation table + MediaAsset table | Storage Location card (future) | Future screen only | Medium (no entity yet) | HIGH |
| Moving-box photo | None | NO | Same image helpers | Same as above | Moving Box card (future) | Future screen only | Medium | HIGH |
| Visual Library | None | NO | `tabs.tsx` (installed, unused); LockerPanel structure | No backend for v1 (reads IndexedDB); MediaAsset table for v2 | Locker > Photos tab | Tab bar added to LockerPanel | Low — no existing behavior broken | HIGH |
| Locker integration | `LockerPanel.tsx` (flat list, no tabs) | PARTIAL | Existing LockerPanel + `tabs.tsx` | None for UI tab; MediaAsset table for server-backed photos | Locker > Photos tab (tab bar added) | Tab bar in LockerPanel header | Low | HIGH |
| Scanner / file picker reuse | `ImportGearPanel.tsx` (accept: .pdf/.docx etc.) | PARTIAL | multipart pattern on server; file input pattern | None | N/A (different purpose) | None | None | HIGH |
| Theme photo infrastructure reuse | `bgPhotoStore.ts` (IndexedDB, device-local) | PARTIAL | `validateImageFile`, `compressPhotoFile`, `createPhotoObjectUrl`, `deletePhoto` | Separate IndexedDB store for item photos vs. `bgPhotos` | N/A (device-local layer) | None | Low | HIGH |
| Durable backend | None (no object storage, no media table) | NO | Server multipart pattern from importGear.ts | Object storage bucket + `media_assets` DB table + upload/delete routes | N/A (backend) | None visible | Medium (new infra) | HIGH |
| Cross-device media | None | NO | Locker API auth pattern (Clerk-authenticated routes) | Durable backend above | N/A (backend) | None visible | Medium | HIGH |
| Review / shared media | Share link reads locker payload snapshot | PARTIAL (no photos today) | `/api/links` pattern; signed URL pattern | Signed URL generation endpoint | Review page (future) | Photos section in Review card | Medium (privacy implications) | MEDIUM |
| Deletion / orphan cleanup | `cleanupOrphanedPhotos()` in bgPhotoStore | PARTIAL (theme photos only) | Same orphan pattern applies to item photos | `user.deleted` Clerk webhook handler | N/A (lifecycle) | None | Medium (missing webhook) | HIGH |

---

## 21. Smallest Safe Future Implementation Sequence

**Phase 0 (immediately, no backend):** Device-local item photos
1. Add `photoId?: string` to `GearItem` type
2. Add a new IndexedDB object store `itemPhotos` to the existing `trailweigh` DB (reuses `bgPhotoStore.ts` DB connection pattern)
3. Wire photo control in expanded item panel: Vaul Drawer with Take / Choose / Skip actions
4. Wire Add New Item photo step
5. Add collapsed-row circular thumbnail indicator (when `photoId` is set)
6. Add Locker > Photos tab using `tabs.tsx`; Photos tab browses all `itemPhotos` IndexedDB records
7. Orphan cleanup on mount: `cleanupOrphanedPhotos()` pattern for `itemPhotos` store

**Phase 1 (server-backed, after Phase 0 validated):**
1. Create `media_assets` DB table
2. Create object storage bucket (Replit Object Storage)
3. Add authenticated POST `/api/media` (multipart), GET `/api/media/:id/url` (signed URL), DELETE `/api/media/:id`
4. Migrate device-local item photos on next Locker sync (one-time upload migration, mirroring `migrateCollectionsToIndexedDb`)
5. Add `user.deleted` Clerk webhook handler with cascade delete
6. Update Review/share view to display photos via signed URLs with per-link opt-in setting

**Phase 2 (future):**
1. StorageLocation entity + storage-location photo
2. Multi-photo per item (`photoIds?: string[]`)
3. AI visual recognition integration

---

## 22. Full Mobile Control-Wiring Readiness (Section 24)

### Can the comprehensive control-wiring prompt proceed in ONE prompt after user decisions?

**YES — with one condition.**

The condition: user must decide **Photo v1 storage scope** (Audit M decision 1 below) before the wiring prompt begins, because the item photo wiring implementation differs depending on whether photos are device-local (IndexedDB, no new backend) or server-backed (requires API calls). If device-local is chosen for v1, the control-wiring prompt can proceed immediately and completely, including:

- All header controls (hamburger, +, Search)
- All bottom-nav destinations (List, Locker with Photos tab, Catalog, Summary, More)
- All real functions (Scan, Share, Print, Save, Undo, Redo, Reset, Units, Theme, etc.)
- Category icon accordion, reorder handle wire-up (DnD library will be needed)
- Item controls (checkbox, expand/collapse, Weight, Qty, Total, Move, Add Item)
- Item camera/photo control (Take Photo, Choose Photo, Skip, view thumbnail)
- Add New Item with photo step

The DnD library for category touch reorder is the only genuinely new dependency — but it is within the scope of the control-wiring prompt to add.

---

## 23. Final Recommendation — One Recommended Architecture

### 1. Item-panel camera/photo control implementation
**Option C** — zero-photo state: expanded panel only shows "Add a photo" button; has-photo state: a 20px circular thumbnail appears inline in the text column of the collapsed row (col 1 of the 4-column grid, preserving all handle ratios). All photo actions live in the expanded panel.

### 2. What tapping the control opens
A **Vaul Drawer bottom-sheet** (`drawer.tsx` — already installed, currently unused). The sheet has three cells: Take Photo / Choose Photo / Cancel (no-photo state), or: View / Replace / Remove / Cancel (has-photo state).

### 3. Add New Item photo flow
A three-step Add Item modal/drawer (Name → Weight/Qty → Photo) where the Photo step offers **Take Photo | Choose Photo | Skip →** with no friction to skip.

### 4. Visual Library home
**Locker > Photos tab.** The existing LockerPanel gains a two-tab bar ("Files" | "Photos") using `tabs.tsx`. Files tab = current saved-list card list, unchanged. Photos tab = scrollable grid of all item photos from the device (v1) or server (v2).

### 5. Locker / Visual Library relationship
Locker is the unified personal-data hub. Files tab = gear lists. Photos tab = item photos. Both share Locker's bottom-nav destination. No navigation restructuring needed.

### 6. Storage-location photos
Properties of a future `StorageLocation` entity (not item photos). A "Locations" tab can be added to Locker later alongside Files and Photos, making Locker the complete TrailWeigh personal-data hub.

### 7. Can current photo infrastructure be reused?
**YES — partially.** `validateImageFile()`, `compressPhotoFile()`, `createPhotoObjectUrl()`, `revokePhotoObjectUrl()`, `deletePhoto()`, and the `cleanupOrphanedPhotos()` pattern are all reusable. Item photos get their own IndexedDB object store (`itemPhotos`) within the existing `trailweigh` DB — not the `bgPhotos` store.

### 8. New backend/data work actually required
For **v1 (device-local):**
- Add `photoId?: string` to `GearItem` type — **1 line**
- Add `itemPhotos` IndexedDB object store — **~20 lines** (mirrors bgPhotoStore pattern)
- No server changes required

For **v2 (cross-device):**
- `media_assets` DB table
- Object storage bucket
- POST/GET/DELETE `/api/media` routes
- `user.deleted` Clerk webhook
- One-time migration from IndexedDB to server (mirrors existing migration pattern)

### 9. Can full control-wiring follow in one prompt?
**YES.** If user chooses device-local v1 storage (recommended default), the comprehensive 027N control-wiring prompt can wire all approved controls — including item photo, Add New Item photo step, and Locker > Photos tab — in a single prompt with no new server dependencies.

---

## 24. Only Material User Decisions

### Decision 1 — v1 Photo Storage Scope
**Question:** Should item photos in v1 be stored device-locally (IndexedDB, same approach as existing background photos) or server-backed from day one?

**RECOMMENDED DEFAULT — USER MAY OVERRIDE:**  
Device-local for v1. This lets control-wiring proceed immediately, reuses the existing `bgPhotoStore` infrastructure pattern, and defers the object-storage backend work to Phase 1. The tradeoff: photos on one device do not appear on another device until Phase 1.

---

### Decision 2 — Visual Library: wire in 027N or defer?
**Question:** Should the Locker > Photos tab be wired as part of the comprehensive control-wiring prompt (027N), or deferred to a later dedicated prompt?

**RECOMMENDED DEFAULT — USER MAY OVERRIDE:**  
Include in 027N. It is a UI-only change (no backend needed for v1 device-local storage), `tabs.tsx` is already installed, and including it makes 027N's Locker wiring complete in one pass.

---

### Decision 3 — v1 photo count per item: one or multiple?
**Question:** Should v1 support one photo per item or multiple photos?

**RECOMMENDED DEFAULT — USER MAY OVERRIDE:**  
One photo per item (`photoId?: string`). Simpler model, simpler UI (no carousel in v1). Multi-photo extension (`photoIds?: string[]`) is a straightforward v2 step using the already-installed `carousel.tsx`.

---

## 25. Tests NOT RUN

| Test | Reason |
|---|---|
| All | 027M is read-only diagnostic. No code was written. No tests apply. |

---

## 26. USER VERIFICATION = PENDING

---

## 27. Final Status

```
027M READ-ONLY DIAGNOSTIC = PASS

APPLICATION CODE CHANGED = NO
V3 CHANGED = NO
/CHECKLIST CHANGED = NO
SCANNER CHANGED = NO
LOCKER CHANGED = NO
DATABASE/API/AUTH CHANGED = NO
NEW DEPENDENCY ADDED = NO
REPLIT.MD CHANGED = NO
.AGENTS/MEMORY CHANGED = NO
DEPLOYMENT CHANGED = NO

CURRENT ITEM PHOTO SUPPORT = NO
DURABLE ITEM-PHOTO BACKEND EXISTS = NO
CROSS-DEVICE PHOTO ACCESS EXISTS = NO
THEME PHOTO INFRASTRUCTURE REUSABLE = PARTIAL
SCANNER FILE PICKER REUSABLE = PARTIAL
LOCKER CAN HOST VISUAL LIBRARY = YES
CATEGORY-BAR CAMERA RECOMMENDED = NO
ADD-NEW-ITEM PHOTO FLOW SUPPORTABLE = YES

PREFERRED ITEM-PANEL PHOTO IMPLEMENTATION = OPTION C
  (collapsed circular thumbnail when photo exists;
   all actions in expanded panel;
   Vaul Drawer bottom-sheet for Take/Choose/Skip)

PREFERRED VISUAL-LIBRARY HOME = LOCKER > PHOTOS TAB
  (two-tab LockerPanel: Files | Photos; tabs.tsx already installed)

PREFERRED STORAGE-LOCATION PHOTO MODEL = PROPERTY OF STORAGELOCATON ENTITY
  (MediaAsset with relationship_type='storageLocation';
   aggregated into Visual Library; no overlap with item photos or theme photos)

FULL MOBILE CONTROL-WIRING READY AFTER USER DECISIONS = YES
  (three decisions above; device-local v1 recommended = proceed immediately)

USER VERIFICATION = PENDING
```
