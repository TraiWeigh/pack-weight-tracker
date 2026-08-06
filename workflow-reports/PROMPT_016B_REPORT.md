# Prompt 016B — Fix Theme Label and Reliable Photo Storage

**Date:** 2026-08-06  
**Status:** ✅ COMPLETE — all 5 defects resolved, 659/659 tests pass

---

## 1. Requirements

Five confirmed defects from Prompts 016 and 016A:

| # | Defect | Root cause |
|---|--------|-----------|
| D1 | Closed Theme dropdown trigger is blank | `BackgroundPickerPanel` trigger button lacked `text-foreground` — no explicit foreground colour |
| D2 | Uploaded photos disappear after page refresh | Binary blobs stored in large `dataUrl` fields inside `localStorage` (quota exceeded, silent loss) |
| D3 | Selecting a custom photo produces "The quota has been exceeded." | Same root cause — full base64 image data written to `localStorage` on every selection |
| D4 | Large image base64 data stored directly in localStorage | Architectural design defect — no binary blob store |
| D5 | Storage failure reaches the Vite error screen | `processFiles` propagated the `QuotaExceededError` uncaught |

---

## 2. Architecture decisions

### 2.1 IndexedDB for photo blobs

All photo binary data moved from `localStorage` to an IndexedDB object store:

```
Database : trailweigh
Version  : 1
Store    : bgPhotos   (keyPath: photoId)
Record   : { photoId, blob, mimeType, width, height }
```

`localStorage` (and Locker entries) store only photo IDs; object URLs are created on demand and revoked when no longer needed.

### 2.2 Background type change

```typescript
// Before (016A)
type Background = { type: 'preset'; id: string } | { type: 'custom'; dataUrl: string };

// After (016B)
type Background = { type: 'preset'; id: string } | { type: 'custom'; photoId: string };
```

### 2.3 CollectionPhoto type change

```typescript
// Before
interface CollectionPhoto { id: string; dataUrl: string; }

// After  
interface CollectionPhoto { id: string; }  // blob in IndexedDB
```

### 2.4 Shared links and cross-device limitations

Custom photo blobs are stored in the **device-local** IndexedDB. Recipients of a shared link who do not have the photo in their own library see no background (graceful no-op — same behaviour as before for most users since `dataUrl` blobs were never transmitted in the share payload either).

---

## 3. Files changed

| File | Change type | Summary |
|------|-------------|---------|
| `src/lib/bgPhotoStore.ts` | **New** | IndexedDB CRUD, compression, validation, migration helpers, object URL lifecycle |
| `src/lib/bgCollections.ts` | Updated | `CollectionPhoto` drops `dataUrl`; `runMigration` takes `legacyPhotoId` not `legacyDataUrl` |
| `src/components/BackgroundPicker.tsx` | Major rewrite | Dropdown trigger + `text-foreground` (D1); IndexedDB upload flow (D2–D4); save-first with rollback; graceful error UI (D5); thumbnail object URL lifecycle; one-time migration effect |
| `src/hooks/usePackData.ts` | Line edit | `BgValue.type='custom'` field renamed `dataUrl` → `photoId` |
| `src/pages/Checklist.tsx` | Targeted edits | `customBgObjectUrl` state + async `useEffect`; background initializer rejects old `dataUrl` format; `bgImageUrl` reads object URL |
| `src/pages/SharedChecklistPage.tsx` | Targeted edits | Same async object URL pattern; custom background shows no-bg for sender photos not in recipient's library |
| `src/pages/ShortLinkView.tsx` | Line edit | `resolveBgUrl` returns null for custom backgrounds (no IndexedDB in static view) |

---

## 4. New file: `bgPhotoStore.ts` (key exports)

| Export | Description |
|--------|-------------|
| `openPhotoDb()` | Open / cache the IndexedDB connection (singleton) |
| `storePhoto(id, blob, mime, w, h)` | Upsert a photo blob record |
| `getPhotoBlob(id)` | Retrieve a blob; returns null on miss or error |
| `deletePhoto(id)` / `deletePhotos(ids[])` | Best-effort blob deletion |
| `getAllStoredPhotoIds()` | All stored keys (for GC) |
| `createPhotoObjectUrl(blob)` | `URL.createObjectURL` — consumers must revoke |
| `revokePhotoObjectUrl(url)` | `URL.revokeObjectURL` with try/catch |
| `validateImageFile(file)` | MIME/extension/size guard; returns null (ok) or error string |
| `compressPhotoFile(file)` | Canvas resize + JPEG/PNG encode; max 1920 px long edge |
| `dataUrlToBlob(url)` | Decode legacy base64 data-URLs to Blob |
| `migrateCollectionsToIndexedDb(cols)` | One-time migration of old photo collections |
| `migrateLegacyActiveBackground(url, id)` | Migrate old active-background data-URL |
| `isMigrationDone()` / `markMigrationDone()` | localStorage flag; migration runs once per device |
| `_resetDbForTesting(mockDb?)` | Test injection — not for production use |

---

## 5. Object URL lifecycle (no memory leaks)

**BackgroundPicker thumbnails:**
- Loaded when panel opens or active theme changes.
- Revoked when theme changes or panel unmounts.
- New photo URL created in-memory from the just-compressed blob (no extra IndexedDB round-trip).

**Checklist / SharedChecklistPage background URL:**
- Resolved async via `useEffect([activePhotoId])`.
- Previous URL revoked before fetching the new one.
- Revoked on effect cleanup (component unmount or photo change).

---

## 6. Migration (one-time, on first BackgroundPicker open)

1. Scan saved collections for any photo with a `dataUrl` field.
2. Convert each `dataUrl` → Blob → IndexedDB via `migrateCollectionsToIndexedDb`.
3. Check `localStorage[BG_STORAGE_KEY]` for old `{ type:'custom', dataUrl }` format.
4. Migrate the active background the same way; write `{ type:'custom', photoId }` back.
5. Set `localStorage['trailweigh:bgMigrationV1'] = '1'` — migration never re-runs.

Old LockerEntries with `{ type:'custom', dataUrl }` lose the custom background on load (treated as null). The photo data is not recoverable from Locker without re-upload; this is acceptable as the old format was lossy anyway (quota errors meant the data was often lost).

---

## 7. Error handling (D5 resolved)

`processFiles` now catches all errors and shows an in-panel message:

- **QuotaExceededError or `quota` in message:** "Photo storage is full. Remove unused theme photos before adding another."
- **Any other error:** "This photo could not be saved. Try a smaller image or remove unused theme photos."
- Failed uploads roll back: if `storePhoto` throws after the `photoId` was assigned, `deletePhoto(photoId)` is called before surfacing the message.
- The Vite error overlay is never reached.

---

## 8. Test results

### New suite: `bgPhotoStore016B.test.mjs` (29 tests, 8 suites)

| Suite | What's tested |
|-------|--------------|
| S1 — validateImageFile (8) | JPEG/PNG/WebP/GIF accepted; TIFF/SVG rejected; >25 MB rejected; boundary 25 MB accepted |
| S2 — dataUrlToBlob (3) | Valid JPEG and PNG conversion; malformed URL → null |
| S3 — isMigrationDone/markMigrationDone (3) | Absent flag → false; flag set → true; "1" written to localStorage |
| S4 — storePhoto/getPhotoBlob (4) | Store-then-retrieve; miss returns null; overwrite; mimeType/width/height persisted |
| S5 — deletePhoto/deletePhotos (4) | Delete removes entry; no-op for missing ID; deletePhotos removes multiple; empty array no-op |
| S6 — getAllStoredPhotoIds (2) | Returns all keys; empty store → [] |
| S7 — createPhotoObjectUrl/revokePhotoObjectUrl (4) | Non-empty string returned; each call unique; revoke no-op for unknown URL; URL removed from pool |
| S8 — Error resilience (1) | getPhotoBlob returns null when IndexedDB unavailable |

### Updated suites

| Suite | Tests | Status |
|-------|-------|--------|
| `bgCollections.test.mjs` | 33 | ✅ 33 pass — `dataUrl` fields removed from photo helpers and assertions |
| `bgCollections016A.test.mjs` | 28 | ✅ 28 pass — same |
| `bgPhotoStore016B.test.mjs` | 29 | ✅ 29 pass — new suite |

### Full suite totals

**659 tests / 659 passed / 0 failed** across 10 suites.

---

## 9. Prompt constraints verified

| Constraint | Status |
|-----------|--------|
| Showcase unchanged | ✅ |
| Print / PDF export unchanged | ✅ |
| Share Link UI unchanged | ✅ |
| AI scanning unchanged | ✅ |
| Importers unchanged | ✅ |
| Mobile Expo app unchanged | ✅ |
| Grid layout `lg:grid-cols-[1fr_365px]` unchanged | ✅ |
| QTY `translate-x-3` unchanged | ✅ |
| Prompt 015 palette persistence unchanged | ✅ |
| Locker entries use `photoId` reference (no blobs embedded) | ✅ |
| Share payload with custom bg renders as no-bg for recipient | ✅ |
| Do not rename Showcase / reorder Hide/Preview/Imperial | ✅ (next prompt) |

---

## 10. Visual verification

- App starts clean on Vite v7.3.6 (no console errors).
- Theme dropdown trigger label is visible in all colour modes (fixed `text-foreground`).
- Photos load from IndexedDB and display as thumbnails.
- Storage errors produce inline panel messages, not the Vite overlay.

---

## 11. Zip deliverable

`workflow-reports/trailweigh-016B-report.zip` — 4 files:
1. `PROMPT_016B_REPORT.md`
2. `TRAILWEIGH_COMPLETE_WORKFLOW.md` (master, post-016B)
3. `TRAILWEIGH_WORKFLOW_PROTOCOL.md`
4. `TESTING.md`
