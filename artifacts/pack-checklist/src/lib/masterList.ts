/**
 * masterList.ts — Master List Phase 1 data foundation
 *
 * Canonical store: IndexedDB 'trailweigh' database (v2)
 *   'masterList'              keyPath: 'id'      — live MasterItem records
 *   'masterItemPhotos'        keyPath: 'photoId' — live item photo blobs
 *   'masterListTrash'         keyPath: 'id'      — soft-deleted items (lossless undo)
 *   'masterItemPhotosTrash'   keyPath: 'photoId' — soft-deleted photo blobs
 *
 * Recovery snapshot: localStorage 'trailweigh:masterList.snap'
 *   — text fields only (no blobs), ~5–50 KB for a typical library
 *   — written after every successful IDB mutation
 *   — used as fallback if IDB is unavailable or corrupt on mount
 *
 * Delete → trash is atomic (item + photo blob move in one IDB transaction).
 * Undo restores the complete item including its photo blob from the same
 * trash stores, also atomically. Nothing is permanently erased until the
 * caller explicitly calls purgeMasterItem() or purgeOldTrash().
 *
 * Isolation guarantees (structural, not just behavioural):
 *   ✓ Never reads/writes LOCKER_KEY, pack-checklist-v5-*, or any other
 *     existing storage key.
 *   ✓ 'checked' is excluded by validateMasterItem — it must never exist on
 *     a MasterItem.
 *   ✓ putMasterItem / deleteMasterItem never call updateItem, mutateSandbox,
 *     writeLockerEntries, or any checklist mutation.
 *   ✓ masterItemId on GearItem is a one-way link; dangling IDs (master item
 *     deleted) are non-crashing — the GearItem is fully functional either way.
 *   ✓ No silent sync: editing a MasterItem never propagates to checklists.
 */

import {
  openPhotoDb,
  ML_STORE,
  ML_PHOTO_STORE,
  ML_TRASH_STORE,
  ML_PHOTO_TRASH_STORE,
  dataUrlToBlob,
} from './bgPhotoStore';

// ── Constants ──────────────────────────────────────────────────────────────────

/** localStorage key for the text-only recovery snapshot (no photo blobs). */
export const MASTER_SNAP_KEY       = 'trailweigh:masterList.snap';
export const MASTER_SCHEMA_VERSION = 1 as const;
/** Trash entries older than this are eligible for permanent deletion. */
export const MASTER_TRASH_TTL_MS   = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ──────────────────────────────────────────────────────────────────────

export type MasterItem = {
  /** Stable UUID — assigned once at creation via crypto.randomUUID(). Never
   *  regenerated. Not derived from any mutable field. */
  id: string;
  /** Per-record schema version; enables lazy per-record migration. */
  schemaVersion: 1;

  // ── Gear fields (align with GearItem vocabulary for seamless add-to-list) ──
  /** Item name (= GearItem.desc when linked). Max 200 chars. */
  name: string;
  /** Item type/sub-type (= GearItem.sub when linked). Max 100 chars. */
  sub: string;
  /** Default/suggested category when adding to a checklist. Max 100 chars. */
  category: string;
  weightOz: number;
  /** Default quantity when added to a checklist. 1–99. */
  qty: number;
  expendable: boolean;

  // ── Optional enrichment ───────────────────────────────────────────────────
  /** Free-text notes. Max 5 000 chars. */
  notes?: string;
  /**
   * UUID reference to 'masterItemPhotos' IDB blob — NOT a data URL.
   * Absent = no photo. Set by putMasterItemAndPhoto().
   */
  photoId?: string;
  /** Future: reference to a global location record. */
  locationId?: string;

  // ── Timestamps ────────────────────────────────────────────────────────────
  /** Date.now() at creation. */
  dateAdded: number;
  /** Date.now() at last field edit. */
  dateModified: number;

  // NOTE: 'checked' is intentionally absent — it is list-specific state and
  // must never exist on a MasterItem. validateMasterItem() enforces this.
};

/** Trash record: full MasterItem plus when it was soft-deleted. */
export type MasterTrashEntry = MasterItem & { trashedAt: number };

/** Internal IDB record shape for photo blobs. */
type PhotoRecord = {
  photoId: string;
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
};

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'idb-error' | 'quota' | 'validation' | 'unknown'; message: string };

export type LoadResult = {
  items: MasterItem[];
  /** 'idb' = canonical IDB, 'snap' = localStorage recovery fallback, 'empty' = no data found. */
  source: 'idb' | 'snap' | 'empty';
};

export type ImportResult = {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
};

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Strict allowlist validator. Returns a clean MasterItem or null if the id
 * field is absent/empty (the only non-negotiable field).
 *
 * Unknown fields from future schema versions are silently dropped, providing
 * safe downgrade behaviour. 'checked' is explicitly excluded — it must never
 * be stored on a MasterItem.
 */
export function validateMasterItem(raw: unknown): MasterItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : null;
  if (!id) return null;   // non-negotiable; drop without warning

  return {
    id,
    schemaVersion:  MASTER_SCHEMA_VERSION,
    name:           typeof r.name === 'string'         ? r.name.slice(0, 200).trim()    : '',
    sub:            typeof r.sub === 'string'           ? r.sub.slice(0, 100).trim()     : '',
    category:       typeof r.category === 'string'     ? r.category.slice(0, 100).trim(): '',
    weightOz:       typeof r.weightOz === 'number' && Number.isFinite(r.weightOz)
                      ? Math.max(0, r.weightOz) : 0,
    qty:            typeof r.qty === 'number'
                      ? Math.max(1, Math.min(99, Math.round(r.qty))) : 1,
    expendable:     typeof r.expendable === 'boolean'  ? r.expendable  : false,
    notes:          typeof r.notes === 'string'        ? r.notes.slice(0, 5000) : undefined,
    photoId:        typeof r.photoId === 'string' && r.photoId ? r.photoId : undefined,
    locationId:     typeof r.locationId === 'string'   ? r.locationId  : undefined,
    dateAdded:      typeof r.dateAdded === 'number'  && r.dateAdded > 0
                      ? r.dateAdded  : Date.now(),
    dateModified:   typeof r.dateModified === 'number' && r.dateModified > 0
                      ? r.dateModified : Date.now(),
    // 'checked' intentionally omitted — never stored on a MasterItem
  };
}

// ── Snapshot helpers ───────────────────────────────────────────────────────────

/**
 * Write a text-only snapshot to localStorage (no blobs — all items including
 * those with photoId references, but not the actual binary data). Best-effort:
 * quota errors are swallowed so a full localStorage never blocks main writes.
 */
function writeSnap(items: MasterItem[]): void {
  try {
    localStorage.setItem(MASTER_SNAP_KEY, JSON.stringify({
      __v:       MASTER_SCHEMA_VERSION,
      updatedAt: Date.now(),
      items,
    }));
  } catch { /* quota on localStorage — snap is best-effort */ }
}

/** Read the recovery snapshot from localStorage. Returns [] on any error. */
function readSnap(): MasterItem[] {
  try {
    const raw = localStorage.getItem(MASTER_SNAP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: unknown[] };
    if (!Array.isArray(parsed?.items)) return [];
    return parsed.items
      .map(validateMasterItem)
      .filter((x): x is MasterItem => x !== null);
  } catch { return []; }
}

// ── Internal IDB helpers ───────────────────────────────────────────────────────

/** getAll() from 'masterList', validate every record, return clean array. */
async function getAllItemsFromDb(db: IDBDatabase): Promise<MasterItem[]> {
  return new Promise<MasterItem[]>((resolve, reject) => {
    const tx  = db.transaction(ML_STORE, 'readonly');
    const req = tx.objectStore(ML_STORE).getAll() as IDBRequest<unknown[]>;
    req.onsuccess = () => {
      const validated = (req.result ?? [])
        .map(validateMasterItem)
        .filter((x): x is MasterItem => x !== null);
      resolve(validated);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Refresh the localStorage snapshot from IDB. Fire-and-forget. */
async function refreshSnap(db: IDBDatabase): Promise<void> {
  try {
    const items = await getAllItemsFromDb(db);
    writeSnap(items);
  } catch { /* best-effort */ }
}

// ── Load (IDB primary, snapshot fallback) ─────────────────────────────────────

/**
 * Load all Master List items.
 * 1. Try IndexedDB — canonical; validates every record.
 * 2. If IDB fails/empty-but-snap-exists → use localStorage snapshot.
 * 3. Both unavailable → return empty list.
 *
 * When source === 'snap', the UI should show a recovery banner and call
 * putMasterItem() on each item to re-seed IDB from the snapshot.
 */
export async function loadMasterItems(): Promise<LoadResult> {
  let db: IDBDatabase | null = null;
  try {
    db = await openPhotoDb();
    const items = await getAllItemsFromDb(db);
    // Refresh snap to keep it in sync (best-effort)
    refreshSnap(db).catch(() => {});
    return { items, source: 'idb' };
  } catch {
    // IDB unavailable or corrupt — try snapshot
    const snapItems = readSnap();
    if (snapItems.length > 0) return { items: snapItems, source: 'snap' };
    return { items: [], source: 'empty' };
  }
}

// ── Single-item read ───────────────────────────────────────────────────────────

/** Fetch one MasterItem by id. Returns null if not found or IDB unavailable. */
export async function getMasterItem(id: string): Promise<MasterItem | null> {
  try {
    const db = await openPhotoDb();
    return new Promise<MasterItem | null>((resolve) => {
      const req = db
        .transaction(ML_STORE, 'readonly')
        .objectStore(ML_STORE)
        .get(id) as IDBRequest<MasterItem | undefined>;
      req.onsuccess = () => resolve(req.result ? validateMasterItem(req.result) : null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

// ── Write helpers ──────────────────────────────────────────────────────────────

/**
 * Upsert a MasterItem (add or overwrite by id). Validates the record before
 * writing. Updates the localStorage snapshot on success.
 *
 * Does NOT write a photo blob. For adding/replacing a photo atomically,
 * use putMasterItemAndPhoto().
 */
export async function putMasterItem(item: MasterItem): Promise<WriteResult> {
  const clean = validateMasterItem(item);
  if (!clean) return { ok: false, reason: 'validation', message: 'Invalid MasterItem (id missing or empty)' };

  let db: IDBDatabase;
  try { db = await openPhotoDb(); }
  catch (err) { return { ok: false, reason: 'idb-error', message: String(err) }; }

  return new Promise<WriteResult>((resolve) => {
    const tx  = db.transaction(ML_STORE, 'readwrite');
    const req = tx.objectStore(ML_STORE).put(clean);

    tx.oncomplete = () => {
      refreshSnap(db).catch(() => {});
      resolve({ ok: true });
    };
    tx.onerror = () => resolve({
      ok: false, reason: 'idb-error', message: tx.error?.message ?? 'IDB write error',
    });
    req.onerror = () => resolve({
      ok: false, reason: 'idb-error', message: req.error?.message ?? 'IDB put error',
    });
  });
}

/**
 * Atomically write a MasterItem record and its photo blob in one transaction.
 * If the item previously had a different photoId, the old blob is deleted.
 * The item passed in should already have photoId set to the new photoId.
 */
export async function putMasterItemAndPhoto(
  item: MasterItem,
  photoId: string,
  blob: Blob,
  mimeType: string,
  width: number,
  height: number,
): Promise<WriteResult> {
  const clean = validateMasterItem({ ...item, photoId });
  if (!clean) return { ok: false, reason: 'validation', message: 'Invalid MasterItem' };

  let db: IDBDatabase;
  try { db = await openPhotoDb(); }
  catch (err) { return { ok: false, reason: 'idb-error', message: String(err) }; }

  return new Promise<WriteResult>((resolve) => {
    let abortReason: WriteResult | null = null;
    const abortWith = (r: WriteResult) => { abortReason = r; tx.abort(); };

    const tx         = db.transaction([ML_STORE, ML_PHOTO_STORE], 'readwrite');
    const listSt     = tx.objectStore(ML_STORE);
    const photoSt    = tx.objectStore(ML_PHOTO_STORE);
    const photoRec: PhotoRecord = { photoId, blob, mimeType, width, height };

    tx.oncomplete = () => {
      refreshSnap(db).catch(() => {});
      resolve({ ok: true });
    };
    tx.onerror = () => resolve({
      ok: false, reason: 'idb-error', message: tx.error?.message ?? 'IDB tx error',
    });
    tx.onabort = () => resolve(
      abortReason ?? { ok: false, reason: 'idb-error', message: 'Transaction aborted' },
    );

    // Read existing item to detect a photo replacement
    const getExisting = listSt.get(clean.id) as IDBRequest<MasterItem | undefined>;
    getExisting.onerror = () => abortWith({ ok: false, reason: 'idb-error', message: 'Failed to read existing item' });
    getExisting.onsuccess = () => {
      const existing = getExisting.result;
      // Delete old blob if it differs from the incoming one
      if (existing?.photoId && existing.photoId !== photoId) {
        photoSt.delete(existing.photoId);
      }
      photoSt.put(photoRec);
      listSt.put(clean);
    };
  });
}

/**
 * Atomically remove the photo associated with a MasterItem, clearing
 * photoId on the item record and deleting the blob in one transaction.
 */
export async function removeMasterItemPhoto(id: string): Promise<WriteResult> {
  let db: IDBDatabase;
  try { db = await openPhotoDb(); }
  catch (err) { return { ok: false, reason: 'idb-error', message: String(err) }; }

  return new Promise<WriteResult>((resolve) => {
    let abortReason: WriteResult | null = null;
    const abortWith = (r: WriteResult) => { abortReason = r; tx.abort(); };

    const tx      = db.transaction([ML_STORE, ML_PHOTO_STORE], 'readwrite');
    const listSt  = tx.objectStore(ML_STORE);
    const photoSt = tx.objectStore(ML_PHOTO_STORE);

    tx.oncomplete = () => { refreshSnap(db).catch(() => {}); resolve({ ok: true }); };
    tx.onerror    = () => resolve({ ok: false, reason: 'idb-error', message: tx.error?.message ?? 'IDB error' });
    tx.onabort    = () => resolve(abortReason ?? { ok: false, reason: 'idb-error', message: 'Transaction aborted' });

    const getReq = listSt.get(id) as IDBRequest<MasterItem | undefined>;
    getReq.onerror   = () => abortWith({ ok: false, reason: 'idb-error', message: 'Failed to read item' });
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) { abortWith({ ok: false, reason: 'not-found', message: `Item '${id}' not found` }); return; }
      if (item.photoId) photoSt.delete(item.photoId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photoId: _removed, ...rest } = item;
      listSt.put({ ...rest, dateModified: Date.now() });
    };
  });
}

// ── Delete → trash (lossless) ──────────────────────────────────────────────────

/**
 * Soft-delete a MasterItem by moving it — and its photo blob if present — to
 * the trash stores in a single atomic transaction.
 *
 * Lossless guarantee: undoDeleteMasterItem(id) restores both the item record
 * and its photo blob from trash. Nothing is permanently removed until the
 * caller calls purgeMasterItem() or purgeOldTrash().
 *
 * If the item's photo blob is missing from IDB (already lost by prior eviction),
 * the item is still trashed without its photo; undo will restore the item
 * record but cannot restore a blob that was not there.
 */
export async function deleteMasterItem(id: string): Promise<WriteResult> {
  let db: IDBDatabase;
  try { db = await openPhotoDb(); }
  catch (err) { return { ok: false, reason: 'idb-error', message: String(err) }; }

  return new Promise<WriteResult>((resolve) => {
    let abortReason: WriteResult | null = null;
    const abortWith = (r: WriteResult) => { abortReason = r; tx.abort(); };

    const tx = db.transaction(
      [ML_STORE, ML_PHOTO_STORE, ML_TRASH_STORE, ML_PHOTO_TRASH_STORE],
      'readwrite',
    );
    const listSt       = tx.objectStore(ML_STORE);
    const photoSt      = tx.objectStore(ML_PHOTO_STORE);
    const trashSt      = tx.objectStore(ML_TRASH_STORE);
    const photoTrashSt = tx.objectStore(ML_PHOTO_TRASH_STORE);

    tx.oncomplete = () => { refreshSnap(db).catch(() => {}); resolve({ ok: true }); };
    tx.onerror    = () => resolve({ ok: false, reason: 'idb-error', message: tx.error?.message ?? 'IDB error' });
    tx.onabort    = () => resolve(abortReason ?? { ok: false, reason: 'idb-error', message: 'Transaction aborted' });

    const getItem = listSt.get(id) as IDBRequest<MasterItem | undefined>;
    getItem.onerror   = () => abortWith({ ok: false, reason: 'idb-error', message: 'Failed to read item' });
    getItem.onsuccess = () => {
      const item = getItem.result;
      if (!item) { abortWith({ ok: false, reason: 'not-found', message: `Item '${id}' not found` }); return; }

      // Move item to trash
      const trashEntry: MasterTrashEntry = { ...item, trashedAt: Date.now() };
      trashSt.put(trashEntry);
      listSt.delete(id);

      if (!item.photoId) return; // no photo — done

      // Move photo to trash too (lossless delete)
      const getPhoto = photoSt.get(item.photoId) as IDBRequest<PhotoRecord | undefined>;
      getPhoto.onerror = () => abortWith({ ok: false, reason: 'idb-error', message: 'Failed to read photo for trash' });
      getPhoto.onsuccess = () => {
        const photoRec = getPhoto.result;
        if (photoRec) {
          photoTrashSt.put(photoRec);       // park blob in photo-trash
          photoSt.delete(item.photoId!);    // remove from live store
        }
        // photoRec null = blob was already missing — item trashes without photo;
        // this is the one case where undo cannot restore the photo. Documented.
      };
    };
  });
}

// ── Undo delete (from trash) ───────────────────────────────────────────────────

/**
 * Restore a soft-deleted MasterItem from trash, including its photo blob if
 * one was saved there. The operation is atomic: both item record and photo
 * are moved back in a single IDB transaction.
 *
 * After a successful undo, the item is removed from the trash stores and
 * appears in 'masterList' / 'masterItemPhotos' again.
 */
export async function undoDeleteMasterItem(id: string): Promise<WriteResult> {
  let db: IDBDatabase;
  try { db = await openPhotoDb(); }
  catch (err) { return { ok: false, reason: 'idb-error', message: String(err) }; }

  return new Promise<WriteResult>((resolve) => {
    let abortReason: WriteResult | null = null;
    const abortWith = (r: WriteResult) => { abortReason = r; tx.abort(); };

    const tx = db.transaction(
      [ML_STORE, ML_PHOTO_STORE, ML_TRASH_STORE, ML_PHOTO_TRASH_STORE],
      'readwrite',
    );
    const listSt       = tx.objectStore(ML_STORE);
    const photoSt      = tx.objectStore(ML_PHOTO_STORE);
    const trashSt      = tx.objectStore(ML_TRASH_STORE);
    const photoTrashSt = tx.objectStore(ML_PHOTO_TRASH_STORE);

    tx.oncomplete = () => { refreshSnap(db).catch(() => {}); resolve({ ok: true }); };
    tx.onerror    = () => resolve({ ok: false, reason: 'idb-error', message: tx.error?.message ?? 'IDB error' });
    tx.onabort    = () => resolve(abortReason ?? { ok: false, reason: 'idb-error', message: 'Transaction aborted' });

    const getTrash = trashSt.get(id) as IDBRequest<MasterTrashEntry | undefined>;
    getTrash.onerror   = () => abortWith({ ok: false, reason: 'idb-error', message: 'Failed to read trash' });
    getTrash.onsuccess = () => {
      const trashEntry = getTrash.result;
      if (!trashEntry) {
        abortWith({ ok: false, reason: 'not-found', message: `No trash entry for '${id}'` });
        return;
      }

      // Strip trashedAt — restore as a clean MasterItem
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trashedAt: _t, ...item } = trashEntry;
      listSt.put(item);
      trashSt.delete(id);

      if (!item.photoId) return; // no photo to restore

      // Restore photo blob from photo-trash
      const getPhoto = photoTrashSt.get(item.photoId) as IDBRequest<PhotoRecord | undefined>;
      getPhoto.onerror = () => abortWith({ ok: false, reason: 'idb-error', message: 'Failed to read trashed photo' });
      getPhoto.onsuccess = () => {
        const photoRec = getPhoto.result;
        if (photoRec) {
          photoSt.put(photoRec);             // restore to live store
          photoTrashSt.delete(item.photoId!);// clear from photo-trash
        }
        // photoRec null = blob was already gone before the delete (edge case);
        // restore item without photo rather than failing the undo.
      };
    };
  });
}

// ── Permanent purge ────────────────────────────────────────────────────────────

/**
 * Permanently delete a trash entry and its photo blob from the trash stores.
 * Call this after the undo window has expired (e.g. after a toast timeout).
 * Best-effort — errors are logged and swallowed.
 */
export async function purgeMasterItem(id: string): Promise<void> {
  try {
    const db = await openPhotoDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(
        [ML_TRASH_STORE, ML_PHOTO_TRASH_STORE],
        'readwrite',
      );
      const trashSt      = tx.objectStore(ML_TRASH_STORE);
      const photoTrashSt = tx.objectStore(ML_PHOTO_TRASH_STORE);

      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();  // best-effort

      // Need the photoId to delete the photo from trash
      const getReq = trashSt.get(id) as IDBRequest<MasterTrashEntry | undefined>;
      getReq.onsuccess = () => {
        const entry = getReq.result;
        if (entry?.photoId) photoTrashSt.delete(entry.photoId);
        trashSt.delete(id);
      };
      getReq.onerror = () => { trashSt.delete(id); };  // delete what we can
    });
  } catch (err) {
    console.warn('[masterList] purgeMasterItem error:', err);
  }
}

/**
 * Permanently delete all trash entries older than ttlMs (default: MASTER_TRASH_TTL_MS).
 * Call on Master List screen mount to keep the trash stores compact.
 * Best-effort — errors are logged and swallowed.
 */
export async function purgeOldTrash(ttlMs: number = MASTER_TRASH_TTL_MS): Promise<void> {
  try {
    const db  = await openPhotoDb();
    const all = await new Promise<MasterTrashEntry[]>((resolve) => {
      const req = db
        .transaction(ML_TRASH_STORE, 'readonly')
        .objectStore(ML_TRASH_STORE)
        .getAll() as IDBRequest<MasterTrashEntry[]>;
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror   = () => resolve([]);
    });
    const cutoff = Date.now() - ttlMs;
    const stale  = all.filter(e => e.trashedAt < cutoff);
    await Promise.all(stale.map(e => purgeMasterItem(e.id)));
  } catch (err) {
    console.warn('[masterList] purgeOldTrash error:', err);
  }
}

/**
 * Return all trash entries sorted newest-first (most recently deleted first).
 * Useful for displaying an undo list in the UI.
 */
export async function listTrashedItems(): Promise<MasterTrashEntry[]> {
  try {
    const db = await openPhotoDb();
    return new Promise<MasterTrashEntry[]>((resolve) => {
      const req = db
        .transaction(ML_TRASH_STORE, 'readonly')
        .objectStore(ML_TRASH_STORE)
        .getAll() as IDBRequest<MasterTrashEntry[]>;
      req.onsuccess = () => {
        const entries = (req.result ?? []).slice().sort((a, b) => b.trashedAt - a.trashedAt);
        resolve(entries);
      };
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

// ── Photo CRUD ─────────────────────────────────────────────────────────────────

/**
 * Store a compressed photo blob for a Master List item.
 * Use putMasterItemAndPhoto() instead when adding a new item with a photo,
 * so the item record and blob are written atomically.
 */
export async function storeMasterItemPhoto(
  photoId: string,
  blob: Blob,
  mimeType: string,
  width: number,
  height: number,
): Promise<void> {
  const db = await openPhotoDb();
  await new Promise<void>((resolve, reject) => {
    const tx  = db.transaction(ML_PHOTO_STORE, 'readwrite');
    const req = tx.objectStore(ML_PHOTO_STORE).put({ photoId, blob, mimeType, width, height });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Fetch the photo blob for a Master List item.
 * Returns null if not found or IDB is unavailable — the UI should show a
 * placeholder, never an error.
 */
export async function getMasterItemPhotoBlob(photoId: string): Promise<Blob | null> {
  try {
    const db = await openPhotoDb();
    return new Promise<Blob | null>((resolve) => {
      const req = db
        .transaction(ML_PHOTO_STORE, 'readonly')
        .objectStore(ML_PHOTO_STORE)
        .get(photoId) as IDBRequest<PhotoRecord | undefined>;
      req.onsuccess = () => resolve(req.result?.blob ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

/**
 * Remove orphaned photo blobs from 'masterItemPhotos' — blobs whose photoId
 * is not referenced by any live MasterItem. Safe to call on mount; best-effort.
 */
export async function cleanupOrphanedMasterPhotos(): Promise<void> {
  try {
    const db = await openPhotoDb();

    // Collect referenced photo IDs from live items
    const items = await getAllItemsFromDb(db);
    const referenced = new Set(items.map(i => i.photoId).filter(Boolean) as string[]);

    // Collect all stored photo IDs
    const allPhotoIds = await new Promise<string[]>((resolve) => {
      const req = db
        .transaction(ML_PHOTO_STORE, 'readonly')
        .objectStore(ML_PHOTO_STORE)
        .getAllKeys() as IDBRequest<string[]>;
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror   = () => resolve([]);
    });

    // Delete orphans
    const orphans = allPhotoIds.filter(id => !referenced.has(id));
    if (orphans.length === 0) return;

    await new Promise<void>((resolve) => {
      const tx = db.transaction(ML_PHOTO_STORE, 'readwrite');
      const st = tx.objectStore(ML_PHOTO_STORE);
      orphans.forEach(id => st.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();  // best-effort
    });
  } catch (err) {
    console.warn('[masterList] cleanupOrphanedMasterPhotos error:', err);
  }
}

// ── Export ─────────────────────────────────────────────────────────────────────

type ExportItem = Omit<MasterItem, 'photoId'> & {
  photoId?: string;
  /** Only present when withPhotos:true and blob was found. Base64 data URL. */
  photoDataUrl?: string;
};

/** Convert a Blob to a base64 data URL. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Serialise the Master List to a JSON string.
 *
 * opts.withPhotos = false (default) — text fields only; photoId references
 *   are included but no binary data. Compact and quota-safe.
 *
 * opts.withPhotos = true — photo blobs are fetched from IDB and embedded as
 *   base64 data URLs under the 'photoDataUrl' key. File will be large but
 *   fully self-contained for cross-device restore.
 */
export async function exportMasterListJson(opts: { withPhotos?: boolean } = {}): Promise<string> {
  const { withPhotos = false } = opts;
  const db    = await openPhotoDb();
  const items = await getAllItemsFromDb(db);

  const exportItems: ExportItem[] = await Promise.all(
    items.map(async (item) => {
      if (!withPhotos || !item.photoId) return item;
      try {
        const blob = await getMasterItemPhotoBlob(item.photoId);
        if (!blob) return item;
        const photoDataUrl = await blobToDataUrl(blob);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { photoId: _id, ...rest } = item;
        return { ...rest, photoDataUrl };
      } catch {
        return item;  // include item without photo on any error
      }
    }),
  );

  return JSON.stringify(
    {
      format:     'trailweigh-master-list',
      version:    MASTER_SCHEMA_VERSION,
      exportedAt: Date.now(),
      items:      exportItems,
    },
    null,
    2,
  );
}

// ── Import ─────────────────────────────────────────────────────────────────────

/**
 * Import a Master List from a JSON string produced by exportMasterListJson().
 *
 * mode 'merge'   — add items not yet present; replace existing items only
 *                  when the imported record has a newer dateModified. Existing
 *                  items not in the import are left untouched.
 *
 * mode 'replace' — clear all live items and photos, then write the imported
 *                  set. Trash entries are preserved (they remain undoable).
 *
 * Handles both text-only exports (photoId present, no blob) and
 * full exports (photoDataUrl present — blob is decoded and stored in IDB).
 */
export async function importMasterListJson(
  json: string,
  mode: 'merge' | 'replace',
): Promise<ImportResult> {
  const result: ImportResult = { added: 0, updated: 0, skipped: 0, errors: 0 };

  let parsed: { items?: unknown[] };
  try { parsed = JSON.parse(json) as { items?: unknown[] }; }
  catch { return { ...result, errors: 1 }; }
  if (!Array.isArray(parsed?.items)) return { ...result, errors: 1 };

  let db: IDBDatabase;
  try { db = await openPhotoDb(); }
  catch { return { ...result, errors: 1 }; }

  // Resolve incoming items, decoding any embedded photos
  type ResolvedItem = { item: MasterItem; photoRec?: PhotoRecord };
  const incoming: ResolvedItem[] = [];

  for (const raw of parsed.items) {
    const r = raw as Record<string, unknown>;
    // Handle full exports: photoDataUrl → blob in IDB
    let photoId: string | undefined = typeof r.photoId === 'string' ? r.photoId : undefined;
    let photoRec: PhotoRecord | undefined;

    if (typeof r.photoDataUrl === 'string' && r.photoDataUrl) {
      const blob = dataUrlToBlob(r.photoDataUrl);
      if (blob) {
        photoId = typeof r.photoId === 'string' && r.photoId
          ? r.photoId
          : crypto.randomUUID();
        photoRec = { photoId, blob, mimeType: blob.type || 'image/jpeg', width: 0, height: 0 };
      }
    }

    const validated = validateMasterItem({ ...r, photoId });
    if (!validated) { result.errors++; continue; }
    incoming.push({ item: validated, photoRec });
  }

  if (mode === 'replace') {
    // Clear live stores, then write incoming
    await new Promise<void>((resolve) => {
      const tx       = db.transaction([ML_STORE, ML_PHOTO_STORE], 'readwrite');
      tx.oncomplete  = () => resolve();
      tx.onerror     = () => resolve();
      tx.objectStore(ML_STORE).clear();
      tx.objectStore(ML_PHOTO_STORE).clear();
    });
    for (const { item, photoRec } of incoming) {
      if (photoRec) {
        const r = await putMasterItemAndPhoto(item, photoRec.photoId, photoRec.blob, photoRec.mimeType, 0, 0);
        if (r.ok) result.added++; else result.errors++;
      } else {
        const r = await putMasterItem(item);
        if (r.ok) result.added++; else result.errors++;
      }
    }
  } else {
    // Merge: load existing, compare dateModified
    const existing = await getAllItemsFromDb(db);
    const existingMap = new Map(existing.map(e => [e.id, e]));

    for (const { item, photoRec } of incoming) {
      const current = existingMap.get(item.id);
      if (!current) {
        // New item
        const r = photoRec
          ? await putMasterItemAndPhoto(item, photoRec.photoId, photoRec.blob, photoRec.mimeType, 0, 0)
          : await putMasterItem(item);
        if (r.ok) result.added++; else result.errors++;
      } else if (item.dateModified > current.dateModified) {
        // Imported version is newer — update
        const r = photoRec
          ? await putMasterItemAndPhoto(item, photoRec.photoId, photoRec.blob, photoRec.mimeType, 0, 0)
          : await putMasterItem(item);
        if (r.ok) result.updated++; else result.errors++;
      } else {
        result.skipped++;
      }
    }
  }

  // Final snapshot refresh
  refreshSnap(db).catch(() => {});
  return result;
}
