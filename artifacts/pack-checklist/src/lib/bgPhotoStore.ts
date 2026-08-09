/**
 * bgPhotoStore.ts  —  Prompt 016B
 *
 * IndexedDB-backed blob store for custom background photos.
 *
 * Database     : 'trailweigh'
 * Version      : 1
 * Object store : 'bgPhotos'   keyPath: 'photoId'
 *
 * Record shape :
 *   { photoId: string, blob: Blob, mimeType: string,
 *     width: number, height: number }
 *
 * All photo binary data lives here.  Theme metadata in localStorage stores
 * only photo IDs.  The active-background state stores only a photoId reference.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

export const BG_DB_NAME   = 'trailweigh';
export const BG_DB_STORE  = 'bgPhotos';
export const BG_DB_VERSION = 1;

/** Maximum long-edge pixel dimension before downscaling. */
export const MAX_PHOTO_LONG_EDGE = 1920;
/** JPEG compression quality (0–1) for non-transparent images. */
export const PHOTO_JPEG_QUALITY  = 0.82;

// ── DB singleton ───────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

/**
 * Reset the cached DB connection.
 * Exported for test injection only — not for production use.
 */
export function _resetDbForTesting(mockDb?: IDBDatabase): void {
  _db = mockDb ?? null;
}

export function openPhotoDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BG_DB_NAME, BG_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BG_DB_STORE)) {
        db.createObjectStore(BG_DB_STORE, { keyPath: 'photoId' });
      }
    };
    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db!);
    };
    req.onerror = () => reject(req.error);
  });
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export async function storePhoto(
  photoId: string,
  blob: Blob,
  mimeType: string,
  width: number,
  height: number,
): Promise<void> {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(BG_DB_STORE, 'readwrite');
    const st  = tx.objectStore(BG_DB_STORE);
    const req = st.put({ photoId, blob, mimeType, width, height });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getPhotoBlob(photoId: string): Promise<Blob | null> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(BG_DB_STORE, 'readonly');
      const st  = tx.objectStore(BG_DB_STORE);
      const req = st.get(photoId);
      req.onsuccess = () => resolve((req.result as { blob: Blob } | undefined)?.blob ?? null);
      req.onerror   = () => reject(req.error);
    });
  } catch { return null; }
}

export async function deletePhoto(photoId: string): Promise<void> {
  try {
    const db = await openPhotoDb();
    await new Promise<void>((resolve, reject) => {
      const tx  = db.transaction(BG_DB_STORE, 'readwrite');
      const st  = tx.objectStore(BG_DB_STORE);
      const req = st.delete(photoId);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
      tx.onerror    = () => reject(tx.error);
    });
  } catch { /* best-effort */ }
}

export async function deletePhotos(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await Promise.all(ids.map(id => deletePhoto(id)));
}

export async function getAllStoredPhotoIds(): Promise<string[]> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(BG_DB_STORE, 'readonly');
      const st  = tx.objectStore(BG_DB_STORE);
      const req = st.getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror   = () => reject(req.error);
    });
  } catch { return []; }
}

/**
 * 023A — Delete all blobs whose photoId is NOT in `referencedIds`.
 * Call on BackgroundPickerPanel mount to clean up orphaned blobs left behind
 * by sessions where custom-theme deletion was deferred for undo support.
 * Best-effort: errors are swallowed so a cleanup failure never blocks the UI.
 */
export async function cleanupOrphanedPhotos(referencedIds: Set<string>): Promise<void> {
  try {
    const allIds = await getAllStoredPhotoIds();
    const orphaned = allIds.filter(id => !referencedIds.has(id));
    if (orphaned.length > 0) await deletePhotos(orphaned);
  } catch { /* best-effort */ }
}

// ── Object URL helpers ─────────────────────────────────────────────────────────

export function createPhotoObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokePhotoObjectUrl(url: string): void {
  try { URL.revokeObjectURL(url); } catch { /* ignore */ }
}

// ── Image validation ──────────────────────────────────────────────────────────

const SAFE_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
]);
const UNSAFE_EXT = /\.(tiff?|raw|cr2|cr3|nef|arw|dng|orf|rw2|pef|heic|heif|bmp|svg)$/i;

export function validateImageFile(file: File): string | null {
  if (!SAFE_MIME.has(file.type) || UNSAFE_EXT.test(file.name)) {
    return 'Only JPEG, PNG, WebP, and GIF are supported.';
  }
  if (file.size > 25 * 1024 * 1024) {
    return 'File is too large (max 25 MB).';
  }
  return null;
}

// ── Image compression ─────────────────────────────────────────────────────────

export interface CompressResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  /** Original file size in bytes (before compression). */
  originalSize: number;
}

/**
 * Compress / resize a user-uploaded File for IndexedDB storage.
 *
 * - Downscales if the long edge exceeds MAX_PHOTO_LONG_EDGE (1920 px).
 * - Preserves aspect ratio; never upscales.
 * - PNG output preserves transparency (no black fill).
 * - All other formats output as JPEG at PHOTO_JPEG_QUALITY (0.82).
 * - GIF: only the first frame (canvas snap at t=0).
 * - EXIF orientation is handled by the browser image-decode pipeline.
 */
export function compressPhotoFile(file: File): Promise<CompressResult> {
  const originalSize = file.size;
  return new Promise((resolve, reject) => {
    const isPng   = file.type === 'image/png';
    const reader  = new FileReader();
    reader.onload = (e) => {
      const img    = new Image();
      img.onload  = () => {
        const longEdge = Math.max(img.width, img.height);
        const scale    = longEdge > MAX_PHOTO_LONG_EDGE ? MAX_PHOTO_LONG_EDGE / longEdge : 1;
        const w        = Math.round(img.width  * scale);
        const h        = Math.round(img.height * scale);
        const canvas   = document.createElement('canvas');
        canvas.width   = w;
        canvas.height  = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas 2D context unavailable')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const outType    = isPng ? 'image/png' : 'image/jpeg';
        const outQuality = isPng ? undefined : PHOTO_JPEG_QUALITY;
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('canvas.toBlob returned null')); return; }
            resolve({ blob, mimeType: outType, width: w, height: h, originalSize });
          },
          outType,
          outQuality,
        );
      };
      img.onerror   = () => reject(new Error('Image decode failed'));
      img.src       = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

// ── data-URL conversion ───────────────────────────────────────────────────────

/**
 * Convert a base64 data-URL to a Blob.
 * Returns null if the input is malformed or missing the base64 segment.
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return null;
    const header    = dataUrl.slice(0, comma);
    const b64       = dataUrl.slice(comma + 1);
    const mimeMatch = header.match(/:(.*?);/);
    const mime      = mimeMatch?.[1] ?? 'image/jpeg';
    const binary    = atob(b64);
    const bytes     = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch { return null; }
}

/** Decode an image to get its pixel dimensions.  Returns 0×0 on failure. */
function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload  = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = src;
    } catch { resolve({ width: 0, height: 0 }); }
  });
}

// ── Migration from old localStorage format ─────────────────────────────────────

export const BG_MIGRATION_KEY     = 'trailweigh:bgMigrationV1';
export const BG_MIGRATION_VERSION = 1;

/** Returns true if the one-time migration has already run successfully. */
export function isMigrationDone(): boolean {
  try { return localStorage.getItem(BG_MIGRATION_KEY) === '1'; } catch { return false; }
}

export function markMigrationDone(): void {
  try { localStorage.setItem(BG_MIGRATION_KEY, '1'); } catch { /* ignore */ }
}

/** A photo record that may still carry the legacy `dataUrl` field. */
export interface LegacyPhoto {
  id: string;
  dataUrl?: string;
}

/** A photo collection that may contain legacy photos. */
export interface LegacyCollection {
  id: string;
  name: string;
  photos: LegacyPhoto[];
}

/** A clean photo collection where every photo has only an `id`. */
export interface CleanCollection {
  id: string;
  name: string;
  photos: { id: string }[];
}

export interface MigrateResult {
  /** Updated collections without any `dataUrl` fields. */
  collections: CleanCollection[];
  migratedCount: number;
  failedCount: number;
}

/**
 * Migrate old photo collections (stored with `dataUrl` in each CollectionPhoto)
 * to the new format: blobs in IndexedDB, only IDs in localStorage metadata.
 *
 * - Photos already lacking `dataUrl` (already migrated) are passed through.
 * - If a photo fails to decode or store, it is removed from the theme; the
 *   theme itself is preserved.
 * - Safe to run when no old data is present.
 * - Idempotent: photos without `dataUrl` are never re-processed.
 */
export async function migrateCollectionsToIndexedDb(
  collections: LegacyCollection[],
): Promise<MigrateResult> {
  let migratedCount = 0;
  let failedCount   = 0;
  const out: CleanCollection[] = [];

  for (const col of collections) {
    const cleanPhotos: { id: string }[] = [];
    for (const photo of col.photos ?? []) {
      if (!photo.id) continue;
      if (!photo.dataUrl) {
        // Already migrated
        cleanPhotos.push({ id: photo.id });
        continue;
      }
      try {
        const blob = dataUrlToBlob(photo.dataUrl);
        if (!blob) { failedCount++; continue; }
        const dims = await readImageDimensions(photo.dataUrl);
        await storePhoto(photo.id, blob, blob.type || 'image/jpeg', dims.width, dims.height);
        cleanPhotos.push({ id: photo.id });
        migratedCount++;
      } catch (err) {
        console.warn('[TrailWeigh] Migration: failed to migrate photo', photo.id, err);
        failedCount++;
      }
    }
    out.push({ id: col.id, name: col.name, photos: cleanPhotos });
  }

  return { collections: out, migratedCount, failedCount };
}

/**
 * Migrate the legacy single active-background data-URL
 * (`localStorage['trailweigh:background'] = { type:'custom', dataUrl }`)
 * to IndexedDB.
 *
 * @param dataUrl  The data-URL string from the old localStorage record.
 * @param photoId  Stable ID to assign the stored photo.
 * @returns true on success, false on failure.
 */
export async function migrateLegacyActiveBackground(
  dataUrl: string,
  photoId: string,
): Promise<boolean> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    if (!blob) return false;
    const dims = await readImageDimensions(dataUrl);
    await storePhoto(photoId, blob, blob.type || 'image/jpeg', dims.width, dims.height);
    return true;
  } catch { return false; }
}
