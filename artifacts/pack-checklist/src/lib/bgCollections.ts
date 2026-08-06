/**
 * bgCollections.ts  —  updated Prompt 016B
 *
 * Pure data-layer functions for personal photo collections / custom themes.
 * No browser APIs, no React — fully testable with Node.js built-in runner.
 *
 * Storage key: 'trailweigh:photoCollections' in localStorage.
 * Collections are a GLOBAL library (not per Locker file).
 *
 * PHOTO STORAGE (Prompt 016B):
 * CollectionPhoto no longer carries a `dataUrl`.  Binary blobs are stored
 * in IndexedDB via bgPhotoStore.ts.  Each CollectionPhoto is just { id }.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CollectionPhoto {
  id: string;
  // No `dataUrl` — binary stored in IndexedDB (bgPhotoStore.ts).
}

export interface PhotoCollection {
  id: string;
  name: string;
  photos: CollectionPhoto[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** localStorage key for the global personal photo library. */
export const PHOTO_COLLECTIONS_KEY = 'trailweigh:photoCollections';

/** Maximum photos allowed per collection / custom theme. */
export const MAX_PHOTOS_PER_COLLECTION = 10;

/** Maximum number of custom themes (built-in Landscapes does NOT count). */
export const MAX_COLLECTIONS = 10;

// ── Pure functions ────────────────────────────────────────────────────────────

/**
 * Migrate a legacy single custom-background photo into the "My Photos"
 * collection.  Accepts a `legacyPhotoId` — the ID of a photo whose blob has
 * already been stored in IndexedDB by the calling code.
 *
 * Idempotent: if a photo with `legacyPhotoId` already exists in My Photos,
 * it is not added again.  If legacyPhotoId is null or empty, returns
 * existingCollections unchanged.
 */
export function runMigration(
  existingCollections: PhotoCollection[],
  legacyPhotoId: string | null,
  newCollectionId?: string,
): PhotoCollection[] {
  if (!legacyPhotoId) return existingCollections;

  const myPhotosIdx = existingCollections.findIndex(c => c.name === 'My Photos');
  const myPhotos: PhotoCollection =
    myPhotosIdx >= 0
      ? existingCollections[myPhotosIdx]
      : { id: newCollectionId ?? crypto.randomUUID(), name: 'My Photos', photos: [] };

  // Idempotency: don't add if the same photo ID is already present
  if (myPhotos.photos.some(p => p.id === legacyPhotoId)) {
    return existingCollections;
  }

  const updatedMyPhotos: PhotoCollection = {
    ...myPhotos,
    photos: [{ id: legacyPhotoId }, ...myPhotos.photos],
  };

  if (myPhotosIdx >= 0) {
    return existingCollections.map((c, i) => (i === myPhotosIdx ? updatedMyPhotos : c));
  }
  return [updatedMyPhotos, ...existingCollections];
}

/**
 * Create a named collection and append it to the end of the list.
 *
 * Returns null when:
 *   - the name is blank after trimming, OR
 *   - another collection already has exactly the same trimmed name.
 */
export function createCollection(
  name: string,
  collections: PhotoCollection[],
  newId?: string,
): { result: PhotoCollection[]; newId: string } | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (collections.some(c => c.name === trimmed)) return null;
  const id = newId ?? crypto.randomUUID();
  const entry: PhotoCollection = { id, name: trimmed, photos: [] };
  return { result: [...collections, entry], newId: id };
}

/**
 * Rename a collection.
 *
 * Returns null when:
 *   - newName is blank after trimming, OR
 *   - another collection (different ID) already has exactly the same trimmed name.
 */
export function renameCollection(
  id: string,
  newName: string,
  collections: PhotoCollection[],
): PhotoCollection[] | null {
  const trimmed = newName.trim();
  if (!trimmed) return null;
  if (collections.some(c => c.name === trimmed && c.id !== id)) return null;
  return collections.map(c => (c.id === id ? { ...c, name: trimmed } : c));
}

/**
 * Delete a collection by ID.
 * Other collections are unaffected.
 * Has no effect if the ID does not exist.
 */
export function deleteCollection(
  id: string,
  collections: PhotoCollection[],
): PhotoCollection[] {
  return collections.filter(c => c.id !== id);
}

/**
 * Add a photo to a collection.
 *
 * Returns null when:
 *   - the collection ID does not exist, OR
 *   - the collection already holds MAX_PHOTOS_PER_COLLECTION photos.
 *
 * The photo is appended to the END of the collection's photo list.
 */
export function addPhotoToCollection(
  collectionId: string,
  photo: CollectionPhoto,
  collections: PhotoCollection[],
): PhotoCollection[] | null {
  const col = collections.find(c => c.id === collectionId);
  if (!col) return null;
  if (col.photos.length >= MAX_PHOTOS_PER_COLLECTION) return null;
  return collections.map(c =>
    c.id === collectionId
      ? { ...c, photos: [...c.photos, photo] }
      : c,
  );
}

/**
 * Delete one photo from a collection.
 * Other photos in the same collection are unaffected.
 * Other collections are unaffected.
 * Has no effect if either ID does not exist.
 */
export function deletePhotoFromCollection(
  collectionId: string,
  photoId: string,
  collections: PhotoCollection[],
): PhotoCollection[] {
  return collections.map(c =>
    c.id === collectionId
      ? { ...c, photos: c.photos.filter(p => p.id !== photoId) }
      : c,
  );
}
