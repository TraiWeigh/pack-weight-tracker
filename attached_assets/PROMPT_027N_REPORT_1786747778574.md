# PROMPT 027N — Master List Identity + Copy/Reference Path + Future Domain Taxonomy
**Internal version:** 027N-MASTER-LIST-IDENTITY-DOMAINS-CUSTOM-LIST-DIAGNOSTIC-2026-08-14-R1  
**Report generated:** 2026-08-14  
**Scope:** Read-only diagnostic. No application code modified.  
**Routes affected:** none  
**Production routes touched:** none

---

## 1. Internal Version

027N-MASTER-LIST-IDENTITY-DOMAINS-CUSTOM-LIST-DIAGNOSTIC-2026-08-14-R1

---

## 2. Time / Actions / Lines

- Files inspected: ~14 source files, 5 parallel subagent explorations + 2 follow-up retrievals
- Lines of code reviewed: ~2,200
- Lines changed: 0
- Estimated agent time: ~22 minutes
- Cost: within ESTIMATED SCOPE

---

## 3. Preflight Git Status

Only `MobileDesignPrototypeV3.tsx` and `MobileFunctionalV3.tsx` carry 027J–027L edits. No production files modified in any 027x prompt. No relevant staged changes.

---

## 4. Files / Components Inspected

| File | Purpose |
|---|---|
| `artifacts/pack-checklist/src/hooks/usePackData.ts` | GearItem type, addItem, removeItem, deleteCategory, seedInitialData, sanitizeItems, fork/load path |
| `artifacts/pack-checklist/src/data/initialData.ts` | Hard-coded seed data (INITIAL_DATA) |
| `artifacts/pack-checklist/src/components/LockerPanel.tsx` | LockerEntry interface, Locker load/fork path |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Main app wiring — Add Item, Import, Locker load |
| `artifacts/pack-checklist/src/components/GearCategory.tsx` | "+Base" toggle, Add Item button |
| `artifacts/pack-checklist/src/components/MobileWedgeCategory.tsx` | Mobile "+Base" toggle, Add Item |
| `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` | Scanner import path |
| `artifacts/pack-checklist/src/lib/categoryAliases.ts` | Category alias/normalisation |
| `artifacts/pack-checklist/src/pages/info/HelpPage.tsx` | User-facing "master list" description |
| `artifacts/pack-checklist/src/pages/MobileFunctionalV3.tsx` | V3 bottom nav (Catalog label) |
| `artifacts/pack-checklist/src/App.tsx` | All routes |
| `artifacts/api-server/src/routes/importGear.ts` | Scanner server route |
| `lib/db/src/schema/index.ts` | DB schema |
| `workflow-reports/PROMPT_027M_REPORT.md` | 027M baseline |

---

## 5. Exact Master List Implementation (Audit A)

### CRITICAL FINDING: The "Master List" is a user behaviour pattern, not a software entity

The only place "master list" appears in the production codebase is `src/pages/info/HelpPage.tsx:217-220`:

```
Unchecked items remain in your gear list — they are not deleted. This lets
you maintain a master list of everything you own and simply check off what
you're taking for each trip. Items you leave unchecked are excluded from the
weight calculation but stay ready for next time.
```

This is a **documented use pattern**, not an implemented feature. The single gear list (`Store`, persisted to `localStorage`) IS the master list. There is no separate component, route, data model, DB table, API endpoint, Locker flag, or code construct named "Master List," "master gear," "gear library," "reusable items," "item picker," "catalog items," "template items," "source list," "baseItems," "masterItemId," or "sourceId" anywhere in the codebase.

### What exists instead

| Concept | Code name | What it actually is |
|---|---|---|
| "Master List" | `Store` | The single gear list (localStorage `trailweigh:store:v5`) — contains all items; user checks/unchecks per trip |
| "Add from Master" | Nothing | Does not exist — items are always added blank or imported from a document |
| "+Base / —Base" | `meta.countsToBase` toggle | **Category-level toggle controlling base-weight calculation** — has zero relationship to "Master List" |
| Saved lists | `LockerEntry` | Locker entries are snapshots of the whole Store — no master/template flag; all entries are equal |
| Seed data | `INITIAL_DATA` | A one-time hard-coded backpacking list (13 categories, ~80 items) assigned fresh UUIDs at first run; not a reusable item registry |
| Catalog tab | Planned placeholder | Bottom-nav label in V3 prototype only — no component, no route, no content, no implementation |

### User-facing name vs code name

There is no code construct that matches "Master List." The user's concept maps to the current **single gear list** (the `Store`). Multiple saved Locker entries are the closest structural analogue to "multiple lists you can add from" — but they are whole-store snapshots with no item-level identity across lists.

---

## 6. Master Item Type / ID (Audit B)

### GearItem type (canonical)
```ts
export type GearItem = {
  id: string;          // crypto.randomUUID() — fresh at creation
  sub: string;         // subtitle / brand / model
  desc: string;        // item name / description
  weightOz: number;
  qty: number;
  checked: boolean;
  expendable: boolean;
};
```

### ID stability analysis

| Question | Answer | Evidence |
|---|---|---|
| Is the item ID a UUID? | YES | `crypto.randomUUID()` at `usePackData.ts:594,101-105,116-121` |
| Is the ID stable within a single session/list? | YES | Never regenerated unless missing |
| Is the ID stable when a Locker entry is loaded into a new tab? | YES | `sanitizeItems` uses `...item` spread; assigns new UUID ONLY if `item.id` is missing (`usePackData.ts:116-121`) |
| Is there a master-level stable item ID across independent lists? | **NO** | No such concept exists |
| Does a list item carry a `masterItemId` or `sourceId`? | **NO** | `GearItem` has 7 fields — none is a reference to another item |
| Does category identity use a stable ID? | **NO** | Category identity is the exact name string; no UUID |
| Does any item carry provenance / ancestry? | **NO** | Zero provenance tracking |

### MASTER ITEM HAS STABLE ID = **PARTIAL**
(UUID is stable within the list it belongs to; there is no master-level stable identity concept)

### DESTINATION LIST ITEM RETAINS MASTER ITEM ID = **NO**
(No master item entity exists to retain an ID from)

### PROVENANCE FROM LIST ITEM BACK TO MASTER ITEM = **NO**

---

## 7. Add-to-List Active Path (Audit C)

### The three ways items enter a list today

#### Path 1 — Blank "Add Item" (primary)
```
UI: GearCategory.tsx:354-360 → <button onClick={() => addItem(name)}>Add Item</button>
Handler: usePackData.ts:589-605
```
```ts
const addItem = useCallback((category: string, prefill?: Partial<GearItem>) => {
  pushAndSet(prev => ({
    ...prev,
    items: {
      ...prev.items,
      [category]: [...(prev.items[category] || []), {
        id: crypto.randomUUID(),   // ← always new UUID
        sub: prefill?.sub ?? '',
        desc: prefill?.desc ?? '',
        weightOz: prefill?.weightOz ?? 0,
        qty: prefill?.qty ?? 1,
        checked: prefill?.checked ?? true,
        expendable: prefill?.expendable ?? false,
      }],
    },
  }));
}, [pushAndSet]);
```
Result: fresh UUID, empty or prefilled fields, no source reference.

#### Path 2 — Scanner import (ImportGearPanel → /api/import-gear)
```
UI: ImportGearPanel.tsx:157-163 → POST /api/import-gear (multipart PDF/DOCX)
Server: importGear.ts → returns ParsedItem[] { sub, desc, weight, destination, ... }
Handler: Checklist.tsx:3041-3055 → addItem(resolved, prefill)
```
Result: same `addItem` function → fresh UUID → no reference to source file or source item.

#### Path 3 — Locker "Load this list" (whole-store copy)
```
UI: LockerPanel.tsx:218-224 → Load button
Handler: Checklist.tsx:1941-1951 → window.open('/checklist?savedListId=<entry.id>', '_blank')
Load: usePackData.ts:374-408 → reads entry.store, writes to fork localStorage key
Item IDs: sanitizeItems (usePackData.ts:116-121) → preserves existing IDs via ...item spread
```
Result: the **entire Store** is cloned into a new browser tab's isolated localStorage. Items keep their existing UUIDs from the saved entry. No individual item selection; no master-item reference; the fork tab is completely independent.

### CLASSIFICATION: **C. FULL COPY / CLONE**

There is no item-level picker, no master-item reference, no `masterItemId`. Every path that puts items into a list produces independent records. The Locker load path copies whole stores and preserves existing UUIDs as a side effect of the `...item` spread — not as a designed provenance mechanism.

---

## 8. Current Propagation Behaviour (Audit D)

Each list is an isolated `Store` in its own `localStorage` key. There is no shared mutable state between lists.

| Change event | Does it propagate? | Evidence |
|---|---|---|
| Master item name changes in one list | **NO** | `updateItem` (`usePackData.ts:~580`) updates only current Store |
| Master item weight changes | **NO** | Same |
| Master item subtitle/brand changes | **NO** | Same |
| Master item category changes (Move) | **NO** | `moveItem` operates within current Store only |
| Master item deleted | **NO** | `removeItem` filters from current Store only (`usePackData.ts:607-615`) |
| Destination list item changes | **NO** | Fork is isolated; `pushAndSet` records undo in current Store only |
| Destination list item → reverse propagates to "master"? | **NO** | No mechanism exists |

**Plain statement: Zero propagation in any direction between lists. Every list is completely independent.**

---

## 9. Field Ownership Table (Audit E)

| Field | Current Location | Current Semantics | Master-Specific? | List-Instance-Specific? | Ambiguous? | Recommended Future Home | Why |
|---|---|---|---|---|---|---|---|
| `id` | `GearItem` in list Store | UUID of this list item | NO | YES | NO | List instance ID — keep on instance | Instance identity, not master identity |
| `masterItemId` | DOES NOT EXIST | — | — | — | — | Add to `GearItem` (optional) | Enables provenance without breaking existing lists |
| `desc` | `GearItem` | Item name/description | YES | Possible override | YES | Master item (snapshot on instance) | Real-world item identity |
| `sub` | `GearItem` | Brand / model / subtitle | YES | Possible override | YES | Master item (snapshot on instance) | Manufacturer/brand is master data |
| `weightOz` | `GearItem` | Weight in ounces | YES | Possible list override | YES | Master item (canonical); list can override | Manufacturer weight = master; list may use different qty/config |
| `qty` | `GearItem` | Quantity in this list | NO | **YES** | NO | List instance | Quantity is always trip/list-specific |
| `checked` | `GearItem` | Packed/selected state | NO | **YES** | NO | List instance | Represents trip-specific packing state |
| `expendable` | `GearItem` | Expendable behaviour | PARTIAL | PARTIAL | YES | Master item default; list may override | "This item is always expendable" is master data; could be overridden per trip |
| Category assignment | `PackState` key | Category within this list | PARTIAL | PARTIAL | YES | Master item has default category; list may place elsewhere | User may categorize differently per list |
| `CategoryMeta.countsToBase` | `CategoryMeta` per list | Whether category counts toward base weight | NO | YES | NO | List instance (per category) | Trip-context decision |
| `CategoryMeta.subLabel` | `CategoryMeta` | Column heading override | NO | YES | NO | List instance | Display preference per list |

---

## 10. Photo Attachment Foundation (Audit F)

**Scenario:** One real-world item ("Blue Patagonia Jacket") exists conceptually. User has it in 5 lists. Where should ONE persistent photo live?

| Option | How it works | Verdict |
|---|---|---|
| 1. Photo reference on Master item | Photo stored once on a master record; all list instances resolve photo via `masterItemId` | ✓ CLEANEST — one photo per real-world item; no duplication |
| 2. Photo copied to each list instance | Each of the 5 list instances stores its own `photoId`; 5 separate photo blobs | ✗ Storage waste; updating the photo requires updating 5 copies |
| 3. Photo via `masterItemId` lookup | Same as option 1 but requires provenance tracking — `masterItemId` on each instance | ✓ Same as option 1 if masterItemId exists |
| 4. Current architecture | No photo support anywhere | — |

**Recommendation:** Option 1 / Option 3 (equivalent when `masterItemId` exists). The photo lives exactly once on the Master item. List instances display it by resolving `masterItemId → masterPhoto`. This requires creating a Master Item entity — but that entity is the same one needed for domains, storage locations, and the Catalog tab. It is the same future work needed regardless of photos.

**027M decision revisited:** 027M recommended `photoId?: string` on `GearItem`. That is correct for a v1 where items do not yet have master-level identity. Once Master items are introduced, photo migrates to the master record and list items resolve via `masterItemId`. The migration path is clear and non-destructive.

---

## 11. Storage Location Foundation (Audit G)

### Current `Move` behaviour
`moveItem` (`usePackData.ts`) moves an item from one **category** to another within the SAME list. It is category reassignment only. The "Move: Toiletry Bag ∨" UI visible in the design prototype selects a different category, not a real-world storage location.

### Storage location anywhere in codebase
**None.** No `storageLocation`, `bag`, `container`, `location`, or `bin` field on any item type. No Storage Location entity, DB table, route, or UI panel exists.

### Where storage location eventually belongs
Storage location metadata is **master item data** — it describes where the real-world item is physically kept, independent of any particular list. A "Blue Patagonia Jacket" always lives in the bedroom closet regardless of which packing list it appears in.

### Separate entity required
YES — a `StorageLocation` entity (distinct from `GearItem` and distinct from a list category) is eventually required. The hierarchy:

```
StorageLocation entity (future)
  id: UUID
  userId: string
  name: string         // "Bedroom Closet", "Garage Cabinet"
  parentId?: UUID      // Home → Garage → Cabinet → Bin
  photoId?: UUID
```

Master item would eventually reference `storageLocationId`. This is Phase 2+ work.

---

## 12. Current Category Model (Audit H)

### Category identity
- **Identifier = category name string** (e.g. `"Backpack"`, `"Shelter"`)
- No UUID, no numeric ID, no slug
- No `Category` interface — categories are keys in `PackState` (a `Record<string, GearItem[]>`)
- `CategoryMeta` is `{ countsToBase: boolean; subLabel?: string; descLabel?: string }`

### Scope and hierarchy
- **Per-list** — categories live inside each `Store`; no global category registry
- **Flat** — no parent pointer, no domain field, no taxonomy
- `EXCLUSIVE_GROUPS` is the only categorical rule (e.g. Backpack is a subtype of Backpack category) — a behaviour rule, not a hierarchy

### Default category order
```ts
const DEFAULT_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];
```

### Renaming behaviour
Renaming a category rebuilds all maps under the new string key (`usePackData.ts:641-655`). The old name is gone; the new name becomes the identifier. This means **category identity is mutable** — a rename is a destructive identity change, not a display name change.

### CURRENT CATEGORY MODEL = **FLAT**

### Future domain compatibility
Adding a `Domain` layer above categories requires an optional forward-compatible field. The smallest compatible model:

```
A new optional top-level record in the Store or a separate lightweight registry:
  domainAssignments: Record<categoryName, domainId>
```

This allows existing lists to function without domain assignment (no domain = unassigned / "Other"), while new or migrated lists can carry domain metadata. Changing the category identifier from a name string to a UUID would be the cleaner long-term solution but requires a migration of all existing saved lists.

**Recommended minimum first step (no implementation here):**
- Add an optional `domainId?: string` to `CategoryMeta`
- Populate it only for Master item categories
- Existing list categories remain domain-free until a future migration

This does NOT require immediate list migration.

---

## 13. Custom List All-Domain Capability (Audit I)

| Capability | Current status | Notes |
|---|---|---|
| Browse all Master items | **NOT PRESENT** | No master item browser exists |
| Search all Master items | **NOT PRESENT** | No search across items exists |
| Filter by category | **NOT PRESENT** | In the context of a picker |
| Select items across categories | **NOT PRESENT** | Items can only be added one-at-a-time from within a category |
| Select items across future domains | **NOT PRESENT** | No domain model |
| Add item not in Master List | **YES** | Blank "Add Item" button, always from scratch |
| Save new custom item back to Master List | **NOT PRESENT** | No "save to master" behavior |

### Smallest future picker architecture

A future item picker for Custom List creation needs:
```
ItemPickerSheet (Vaul Drawer or full-page panel)
  ┌──────────────────────────────────────┐
  │ [Search...    ]  [Domain ▾] [Cat ▾]  │
  │                                      │
  │  All Domains > All Categories         │
  │  ─────────────────────────────────── │
  │  ☐  Blue Patagonia Jacket  12.0 oz  │
  │  ☐  MSR Hubba Hubba NX    64.0 oz  │
  │  ...                                 │
  │  [Add selected (3)]                  │
  └──────────────────────────────────────┘
```

This picker reads from the **Master Item registry** (the future entity, not the current list). A Custom List must NOT be restricted to one domain — the picker shows all domains with optional filters. Selected items are added to the custom list as snapshot instances with `masterItemId` references.

---

## 14. Master List vs Catalog Relationship (Audit J)

### Current state
The Catalog tab is **not implemented**. `MobileFunctionalV3.tsx:202,207` labels it in the V3 prototype bottom nav as disabled (`aria-disabled`). No route, no component, no data model, no content. `App.tsx:220-248` confirms no `/catalog` route exists.

No TrailWeigh product catalog, manufacturer database, or community gear database exists in the codebase.

### Clean future relationship

```
TrailWeigh Product Catalog (future)
  = curated/community gear database
  = manufacturer items, weights, specs
  = NOT user-owned data

User's Master Item Registry (future)
  = user's personal owned/reusable items
  = items the user actually has
  = lives in Locker alongside saved lists

Flow:
  Catalog item → user taps "Add to My Gear" →
  creates/enriches a Master Item → 
  Master Item appears in user's item picker →
  user adds it to Custom Lists with snapshot + masterItemId
```

The Catalog and the user's Master List are **distinct** data sources. The Catalog is read-only reference data; the Master List is user-owned writable data. They should never be merged into one table.

**First implementation of Catalog tab (recommended):** Browse user's own Master Items (personal Catalog), NOT a community database. Community/manufacturer Catalog is a much larger future phase that requires its own backend, data licensing, and community tooling.

---

## 15. Add New Item Behavior (Audit K)

### Current behavior
- Blank `addItem(category)` → new UUID, empty fields → lives ONLY in current list
- Items do NOT automatically become Master List entries (no Master Item entity exists)
- Scanner import → same `addItem` function → same result — isolated to current list
- No "save to master" behavior anywhere

### Future behavior (compatible with current architecture)

Add New Item flow (approved UI, from 027N spec):
```
Step 1: Name / Description
Step 2: Weight / Quantity  
Step 3: Photo (Take Photo | Choose Photo | Skip Photo)
  [optional: Save to My Gear for reuse ☐]
```

The "Save to My Gear" checkbox (when checked) creates a Master Item entry from the new item, so it appears in future item pickers. When unchecked, the item exists only in the current list. This is additive and backward-compatible — existing "Add Item" behavior is unchanged; the optional save step is new.

---

## 16. Delete / Edit Semantics With Reusable Master Items (Audit L)

### Current behavior
All edits and deletes affect only the current list. No propagation whatsoever.

### Future implications once Master items exist

| Event | Live Reference (A) | Snapshot + MasterID (B) | Pure Copy (C) |
|---|---|---|---|
| Master item renamed | All lists show new name | Lists show snapshot name; can offer "re-sync" | Lists unaffected |
| Master item photo replaced | All lists show new photo | Lists show master photo via lookup; auto-updated | Lists have no photo link |
| Master item storage location changed | All lists show new location | Lists resolve location via masterItemId | Lists unaffected |
| Master item deleted | Lists have BROKEN references | Lists show snapshot data; masterItemId marked stale ("unlisted gear") | Lists unaffected |
| List item quantity changed | Only list instance changes | Only list instance changes | Only list instance changes |
| List item weight overridden | Risk: user expects override but master changes propagate | Override stored on instance; master weight shown alongside | Fully isolated |

### Recommendation

**Snapshot + MasterID (B)** for TrailWeigh, with selective re-sync:

- Deleting a master item → mark `masterItemId` as stale in any list instances; display item as "Unlisted gear" with a soft indicator — no crash, no data loss
- Renaming a master item → snapshot name in list is preserved; offer a "Sync name from master" button if user wishes
- Photo change → resolved at display time via masterItemId — auto-updated everywhere (photo is the one field that should always be live from master, not snapshotted)
- Storage location change → resolved at display time via masterItemId — auto-updated
- Weight change → list instance keeps its snapshot weight; "Master weight updated" indicator available

This avoids broken lists (the main risk of live reference) while enabling shared photo/location data (the main limitation of pure copy).

---

## 17. Recommended Identity Model (Audit M)

### **B. SNAPSHOT + MASTER ID**

```
Master Item entity (new, future):
  masterItemId: UUID (stable, permanent)
  desc: string
  sub: string
  weightOz: number  (canonical / manufacturer weight)
  photoId?: string  (one photo, lives here)
  storageLocationId?: string
  domainId?: string
  categoryDefault?: string
  createdAt: Date
  userId: string

GearItem (extended, future):
  id: UUID           (list-instance ID — unchanged)
  masterItemId?: string  (optional provenance link)
  desc: string       (snapshot at time of add; can be list-overridden)
  sub: string        (snapshot)
  weightOz: number   (snapshot; can be list-overridden)
  qty: number        (LIST-INSTANCE — always)
  checked: boolean   (LIST-INSTANCE — always)
  expendable: boolean (snapshot; can be list-overridden)
```

### Why this model for each concern

| Concern | How B handles it |
|---|---|
| Photos | Live on Master item; resolved via `masterItemId` — one update reaches all lists |
| Storage location | Live on Master item; resolved via `masterItemId` |
| Item name/model | Snapshot on instance; can re-sync from master optionally |
| Weight | Snapshot on instance (list may use different qty/config); master shows canonical |
| List-specific quantity | Always on instance — master has no qty concept |
| Checked/selected state | Always on instance — trip-specific |
| Checklist packed/progress | Always on instance |
| Deletion safety | Stale `masterItemId` → "unlisted gear" indicator; no crash; snapshot preserved |
| Offline/local behavior | Snapshot fields are self-contained; list works offline even without master record |
| Cross-device future | Master Item registry synced via API; list snapshots synced via existing Locker API |

---

## 18. Visual Library / Locker Relationship (Audit N)

### Refined model in light of Master Items

027M recommended `Locker > Photos tab`. Given that the Master Item registry IS the natural home for photos and storage information, the better Locker architecture is:

```
Locker (bottom nav destination)
  ├─ Lists        → saved gear lists (existing LockerEntry cards)
  ├─ Items        → Master Item registry (browse, search, manage owned gear)
  └─ Locations    → Storage Locations (future — bins, shelves, closets)
```

**NOT** `Files | Photos` — because "Photos" implies a photo-grid browser divorced from item context. The Visual Library is better understood as the Items tab filtered to items that have photos, or a photo-grid view of the Items tab. Photos are always associated with a real Master item — browsing orphaned photo blobs is not useful.

**How the Visual Library works in this model:**
- Locker > Items tab → shows Master Item cards (name, sub, photo thumbnail if exists, storage location)
- A "Photos" grid view toggle within the Items tab shows photo thumbnails in a grid
- Tapping a photo opens the Master Item detail
- This is the Visual Library — not a separate photo album, but a visual view of the Master Item registry

This eliminates the `Locker > Photos` tab as a standalone destination. Instead: `Locker > Items` with a list/grid view toggle serves both the item-management and visual-library use cases.

---

## 19. Mobile Control-Wiring Readiness (Audit O)

### A. SAFE TO WIRE NOW (no data model changes required)

| Control | Basis |
|---|---|
| Hamburger / menu | Navigation toggle — pure UI |
| Large + = Create New List | Calls `emptyData()` or `seedInitialData()` in new tab — existing function |
| Search | Filters current list items by `desc`/`sub` — reads existing GearItem fields |
| Bottom nav: List | Active tab — current list, already rendered in V3 |
| Bottom nav: Locker | Opens existing LockerPanel |
| Bottom nav: Summary | Weight summary — existing `WeightSummary` / weight calculation hooks |
| Bottom nav: More | Settings panel — Imperial/Metric, Light/Dark, Help, About — all existing |
| Scan Gear List | Opens `ImportGearPanel` — existing component |
| Share | Existing share link API |
| Print | Existing export/print path |
| Save | Existing Locker save path |
| Undo / Redo | Existing `undo`/`redo` from `usePackData` |
| Reset | Existing `resetList` |
| Imperial / Metric | Existing unit context/toggle |
| Pack Summary / Weight Distribution | Existing weight breakdown views |
| Help / About | Existing `HelpPage` / `AboutPage` |
| Category icon accordion | Already wired in MobileFunctionalV3 |
| Category reorder handle | DnD library (e.g. `@dnd-kit/core`) needed — one new dependency; existing `moveCategory`/`reorderCategory` hooks are ready |
| Add Category | Existing `addCategory` hook |
| Item: checkbox | Existing `toggleItem` |
| Item: expand/collapse | Existing accordion state |
| Item: Weight | Existing `updateItem` |
| Item: Quantity | Existing `updateItem` |
| Item: Total | Derived display — no new logic |
| Item: Move | Existing `moveItem` (category reassignment within list) |
| Item: Add Item | Existing `addItem` |

### B. SHOULD WAIT (depends on Master item identity / photo backend)

| Control | Why it should wait |
|---|---|
| Item photo row (Camera + Add Photo / View) | Requires `photoId` on `GearItem` + item photo store — 027M Phase 0 work |
| Add New Item → photo step | Same as above |
| Locker > Items tab (Master Item registry) | Requires Master Item entity and storage |
| Catalog tab (item picker from master) | Requires Master Item registry |

### C. SAFE TO WIRE AS NAVIGATION PLACEHOLDER (labelled, not fake)

| Control | How |
|---|---|
| Bottom nav: Catalog | Renders disabled tab with "Coming soon" or leaves tab visible but tapping shows empty state: "Your gear library — add items to get started" |
| Locker > Items tab | Show empty state: "Your saved gear items will appear here" — tab visible, zero content, no fake data |
| Item photo row | Render the approved UI row (`[Camera] Add Photo`) but disabled or wired to a toast: "Photo support coming soon" — so the approved visual hierarchy is established |

**Verdict: Full mobile control-wiring CAN proceed for all non-photo, non-Master-item controls in one prompt.** The photo row and Master item flows can be wired as explicit placeholders with real visual placement but disabled state. This lets the comprehensive wiring proceed without waiting for backend work.

---

## 20. Complete Architecture Table

| Concept | Current Active Model | Current Identity | Copy or Reference? | Current Persistence | Cross-Device? | Future Master-List Home | List-Instance Home | Photo Impact | Storage Impact | Change Required? | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Master item | No entity — USE PATTERN only | None | N/A | N/A | N/A | New Master Item registry (in Locker API) | GearItem snapshot + `masterItemId?` | Photo lives on master | Storage location on master | YES — new entity | HIGH |
| Destination list item | `GearItem` in Store | UUID (stable within list) | FULL COPY | localStorage + Locker API (JSON) | YES (via Locker sync) | Same (snapshot fields on instance) | `GearItem` + `masterItemId?` | `photoId?` resolves via master | `storageLocationId?` via master | YES — add `masterItemId?` field | HIGH |
| Category | `PackState` key (name string) | Name string (mutable) | Per-list copy | localStorage per list | YES (embedded in Locker payload) | Optional `domainId?` on `CategoryMeta` | `PackState` key (unchanged) | None | None | PARTIAL — `domainId?` optional field | HIGH |
| Future domain | DOES NOT EXIST | None | N/A | N/A | N/A | Light domain registry (id, name, icon) | `domainId?` on category | None | None | YES — new lightweight entity | HIGH |
| User-created custom item | `GearItem` in current list | UUID | FULL COPY | localStorage | YES (via Locker) | Opt-in: "Save to My Gear" → creates Master Item | `GearItem` in list (unchanged) | `photoId?` at list-instance level until master entity exists | None | YES — "Save to My Gear" UI | MEDIUM |
| Catalog product | DOES NOT EXIST | None | N/A | N/A | N/A | TrailWeigh community catalog (Phase 3+) | Adds to Master Item on user selection | Photo from catalog (if provided) | None | YES — major future work | HIGH |
| Item photo | DOES NOT EXIST | None | N/A | N/A | NO | Master Item entity (`photoId`) | `photoId?` on GearItem (v1 interim) | Core of this feature | None | YES — 027M Phase 0 | HIGH |
| Storage location | DOES NOT EXIST | None | N/A | N/A | N/A | `StorageLocation` entity + `storageLocationId` on Master Item | Resolved from master via `masterItemId` | `photoId?` on storage location | Core of this feature | YES — Phase 2 | HIGH |
| Checklist-use state (`checked`) | `GearItem.checked` | Per-item boolean in list | Per-list copy | localStorage | YES (via Locker) | NOT on master — always list-instance | `GearItem.checked` (unchanged) | None | None | NO | HIGH |
| Quantity (`qty`) | `GearItem.qty` | Integer in list | Per-list copy | localStorage | YES (via Locker) | NOT on master (or master has qty=1 default) | `GearItem.qty` (unchanged) | None | None | NO (semantics unchanged) | HIGH |
| Weight (`weightOz`) | `GearItem.weightOz` | Float oz in list | Per-list copy (snapshot) | localStorage | YES (via Locker) | Master canonical weight | `GearItem.weightOz` snapshot; overrideable | None | None | Model: add master weight; instance keeps snapshot | MEDIUM |
| Selected state (`checked`) | `GearItem.checked` | Boolean | Per-list | localStorage | YES | NOT on master | List instance | None | None | NO | HIGH |
| Scanner imported item | `GearItem` via `addItem` | New UUID | Full copy, no source link | localStorage | YES (via Locker) | Opt-in: "Save to My Gear" | `GearItem` (unchanged) | Can add photo after import | None | Minor — opt-in save | MEDIUM |

---

## 21. Blue Patagonia Jacket — End-to-End Example

### CURRENT FACT (based on active code)

**Step 1 — Item in the current gear list:**
The user creates their gear list and adds the jacket:
```
addItem('Clothing Packed', { desc: 'Blue Patagonia Jacket', sub: 'Nano Puff', weightOz: 12.0 })
→ GearItem { id: 'uuid-A', desc: 'Blue Patagonia Jacket', sub: 'Nano Puff', weightOz: 12.0, qty: 1, checked: true }
Stored in localStorage key: trailweigh:store:v5  (or user-scoped variant)
```

**Step 2 — User saves "Backpacking" to Locker and loads into new tab:**
```
Save → LockerEntry { id: 'lock-1', name: 'Backpacking', store: { items: { 'Clothing Packed': [{ id: 'uuid-A', ... }] }, ... } }
Load → window.open('/checklist?savedListId=lock-1')
Fork tab → localStorage key: trailweigh:store:v5-fork-xxx
  → sanitizeItems preserves id: 'uuid-A' (same ID, isolated fork)
```

**Step 3 — User saves "Italy Travel" to Locker from the same original list and loads it:**
```
Load → window.open('/checklist?savedListId=lock-1')
Fork tab 2 → localStorage key: trailweigh:store:v5-fork-yyy
  → jacket is ALSO uuid-A in this fork (same saved Locker entry)
```

**Step 4 — User changes jacket weight in original tab to 11.5 oz:**
```
updateItem('Clothing Packed', 'uuid-A', { weightOz: 11.5 })
→ Only original tab's localStorage changes
→ Backpacking fork: uuid-A still shows 12.0 oz — NO propagation
→ Italy Travel fork: uuid-A still shows 12.0 oz — NO propagation
→ Locker entry 'lock-1' still has 12.0 oz (until user re-saves)
```

**Step 5 — User changes qty to 2 in Italy fork:**
```
updateItem('Clothing Packed', 'uuid-A', { qty: 2 })
→ Only Italy fork's localStorage changes
→ Original and Backpacking unaffected
```

**Summary of CURRENT behavior:**
- The jacket exists as three completely independent `GearItem` records across three browser tabs
- No shared identity, no propagation, no photo, no storage location
- The three uuid-A instances happen to share the same UUID only because they came from the same Locker save — not because of any designed master-item relationship

---

### RECOMMENDED FUTURE (Snapshot + MasterID model)

**Step 1 — Master Item created:**
```
MasterItem {
  masterItemId: 'master-jacket-001'
  userId: 'user-123'
  desc: 'Blue Patagonia Jacket'
  sub: 'Nano Puff'
  weightOz: 12.0          ← canonical manufacturer/owner weight
  photoId: 'photo-uuid-X' ← ONE photo, stored once
  storageLocationId: 'loc-bedroom-closet'
  domainId: 'clothing'
  categoryDefault: 'Clothing Packed'
}
```

**Step 2 — Added to Backpacking list:**
```
GearItem {
  id: 'inst-B1'                           ← list-instance UUID
  masterItemId: 'master-jacket-001'       ← provenance link
  desc: 'Blue Patagonia Jacket'           ← snapshot
  sub: 'Nano Puff'                        ← snapshot
  weightOz: 12.0                          ← snapshot
  qty: 1
  checked: true
}
```

**Step 3 — Added to Italy Travel list:**
```
GearItem {
  id: 'inst-B2'                           ← different instance UUID
  masterItemId: 'master-jacket-001'       ← same provenance link
  desc: 'Blue Patagonia Jacket'           ← snapshot
  weightOz: 12.0                          ← snapshot
  qty: 2                                  ← Italy-specific
  checked: true
}
```
Photo displayed in both lists by resolving: `masterItemId → MasterItem.photoId → load photo blob`.
Storage location displayed: `masterItemId → MasterItem.storageLocationId → "Bedroom Closet"`.

**Step 4 — User updates master weight to 11.5 oz:**
```
MasterItem { ..., weightOz: 11.5 }
→ Both list snapshots still show 12.0 oz (no forced propagation)
→ Both lists show a soft indicator: "Master weight updated to 11.5 oz — Sync?"
→ User taps Sync → instance weightOz updated to 11.5 in that list
```

**Step 5 — User changes Italy qty to 2 (already set above):**
```
GearItem inst-B2 { ..., qty: 2 }
→ Only Italy instance changes — master and Backpacking unaffected
```

**Step 6 — User deletes Master item:**
```
MasterItem 'master-jacket-001' → deleted
→ Both list instances: masterItemId becomes stale
→ Items display as "Unlisted gear" with snapshot name/weight intact
→ No crash, no data loss — snapshot fields self-sufficient
→ Photo is no longer resolvable → graceful placeholder shown
```

---

## 22. Smallest Safe Future Implementation Sequence

### Phase 0 — Item photo wiring (no Master item entity, device-local)
_(As per 027M recommendation — safe to implement immediately)_
1. Add `photoId?: string` to `GearItem` type
2. Add `itemPhotos` IndexedDB store (new store in existing `trailweigh` DB)
3. Wire photo row in item expanded panel: `[Camera] Add Photo` / `[Camera] View`
4. Wire Add New Item photo step: Take Photo | Choose Photo | Skip
5. Collapsed row circular thumbnail (when `photoId` set)
6. Photo resolves from IndexedDB — device-local only, disclosed to user

### Phase 1 — Master Item registry (foundation)
1. Add `masterItemId?: string` to `GearItem` type
2. Create `master_items` table in DB (or use Locker API with a new `type: 'masterItem'` entry)
3. Add "Save to My Gear" opt-in to Add New Item and item edit panel
4. Add Locker > Items tab using `tabs.tsx` — shows saved Master Items
5. Master items carry `photoId` → migrate device-local photo to server-backed storage (027M Phase 1)
6. List items resolve photo via `masterItemId → MasterItem.photoId` (with local fallback)

### Phase 2 — Storage locations + domain taxonomy
1. `StorageLocation` entity with optional `parentId` and `photoId`
2. `domainId?` optional field on `CategoryMeta`
3. Light domain registry (6-10 fixed top-level domains)
4. Locker > Locations tab (future, Phase 2+)

### Phase 3 — Full Catalog + item picker
1. Item picker for Custom List creation (browse Master Items)
2. Community/TrailWeigh product Catalog (backend, data licensing — major work)
3. Catalog → "Add to My Gear" → creates/enriches Master Item flow

---

## 23. Only Material User Decisions

### Decision 1 — When should the Master Item registry be introduced?

**Tradeoff:** Photos, storage locations, and the Catalog tab all eventually depend on a Master Item entity. Introducing it sooner means photos and storage are designed correctly from the start. Introducing it later means a v1 photo implementation uses `photoId` directly on `GearItem` (027M Phase 0), which then needs a migration path when Master Items arrive.

**RECOMMENDED DEFAULT — USER MAY OVERRIDE:**
Proceed with 027M Phase 0 (device-local `photoId` on `GearItem`) for the immediate control-wiring phase. Design the Master Item registry as the clearly stated next backend milestone. The migration path (photo moves from GearItem to MasterItem) is straightforward and non-destructive. This lets the comprehensive control-wiring proceed immediately without waiting for new backend work.

---

### Decision 2 — What should the Catalog tab show first?

**Tradeoff:** Option A = Catalog tab shows the user's own Master Items (personal gear library) — useful immediately once Master Items exist, no community data needed. Option B = Catalog tab waits until a community/manufacturer gear database is built — deferred significantly.

**RECOMMENDED DEFAULT — USER MAY OVERRIDE:**
Option A — Catalog tab = personal Master Item browser ("Your Gear Library"). This is useful immediately, aligns with the "browse all your gear and add to any list" use case, and does not require community data infrastructure. Community Catalog is a future phase layered on top.

---

### Decision 3 — Should category identity migrate from name-string to UUID?

**Tradeoff:** The current name-as-identifier model means renaming a category is a destructive identity change. A UUID-based identity would enable stable category references, domain assignment, and cross-list category identity. However, migrating all existing saved lists (Locker entries, localStorage, share links) from name keys to UUID keys is a non-trivial migration with breakage risk.

**RECOMMENDED DEFAULT — USER MAY OVERRIDE:**
Defer UUID-based category identity until Phase 2 domain work begins. Use the interim `domainId?` on `CategoryMeta` approach for domain tagging without requiring a full identifier migration. The existing `categoryAliases.ts` alias system already provides enough flexibility for import/migration matching.

---

## 24. Tests NOT RUN

| Test | Reason |
|---|---|
| All | 027N is read-only diagnostic. No code was written. No tests apply. |

---

## 25. USER VERIFICATION = PENDING

---

## 26. Final Status

```
027N READ-ONLY DIAGNOSTIC = PASS

APPLICATION CODE CHANGED = NO
MASTER LIST CHANGED = NO
V3 CHANGED = NO
/CHECKLIST CHANGED = NO
LOCKER CHANGED = NO
CATALOG CHANGED = NO
SCANNER CHANGED = NO
DATABASE/API/AUTH CHANGED = NO
NEW DEPENDENCY ADDED = NO
REPLIT.MD CHANGED = NO
.AGENTS/MEMORY CHANGED = NO
DEPLOYMENT CHANGED = NO

MASTER LIST FOUND = MULTIPLE CONCEPTS
  (a) USER PATTERN: the current single gear list used as a master list — HelpPage.tsx
  (b) CODE REALITY: no separate Master Item entity, no master item registry

MASTER ITEM STABLE ID = PARTIAL
  (UUID stable within a list; no master-level stable identity across lists)

DESTINATION ITEM RETAINS MASTER ID = NO
  (full copy — no masterItemId field, no provenance)

CURRENT ADD MODEL = FULL COPY / CLONE
  (path 1: blank addItem → new UUID; 
   path 2: Scanner import → new UUID; 
   path 3: Locker load → whole-store clone, item UUIDs preserved but isolated)

MASTER-TO-LIST FIELD PROPAGATION EXISTS = NO

CURRENT CATEGORY MODEL = FLAT
  (name-as-identifier, per-list, no domain, no parent, no UUID)

CURRENT DOMAIN MODEL EXISTS = NO

CUSTOM LIST CAN ACCESS ENTIRE MASTER LIST = NO
  (no master item registry; no item picker; items added blank or via Scanner only)

PHOTO CAN ATTACH ONCE TO MASTER ID CLEANLY = NO
  (no Master Item entity yet; cleanly possible once entity is introduced)

STORAGE LOCATION CAN ATTACH TO MASTER ID CLEANLY = NO
  (same reason; cleanly possible once Master Item entity exists)

RECOMMENDED IDENTITY MODEL = B. SNAPSHOT + MASTER ID
  (list instance stores snapshot of desc/sub/weightOz + optional masterItemId;
   photo and storage location resolved via masterItemId lookup;
   deletion-safe: stale masterItemId shows "unlisted gear" with snapshot intact)

RECOMMENDED VISUAL LIBRARY / LOCKER MODEL =
  Locker > Lists | Items | Locations
  Items tab = Master Item registry with photo-grid view toggle = Visual Library
  NOT a standalone Photos tab divorced from item context

FULL MOBILE CONTROL-WIRING CAN PROCEED NEXT = PARTIAL
  All non-photo, non-Master-item controls: YES — wire immediately
  Photo row + Add Item photo step: wire as disabled placeholder (correct visual placement)
  Catalog tab: wire as empty-state placeholder ("Your Gear Library — coming soon")
  Locker > Items tab: wire as empty-state placeholder
  Master Item registry: Phase 1 — after control wiring
  Photo backend: Phase 1 (server-backed) after Phase 0 device-local

USER VERIFICATION = PENDING
```
