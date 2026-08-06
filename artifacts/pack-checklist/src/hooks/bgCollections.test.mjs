/**
 * bgCollections.test.mjs — unit tests for pure bgCollections.ts functions.
 *
 * Updated for Prompt 016B:
 *   - CollectionPhoto no longer carries a `dataUrl` field.
 *     makeCollection and makePhoto helpers now produce { id } only.
 *   - runMigration signature changed to (collections, legacyPhotoId, newCollectionId?).
 *     Tests updated: `dataUrl` argument removed; assertions on `.dataUrl` replaced by `.id`.
 *
 * Runs with: node --test bgCollections.test.mjs
 * All functions under test are pure: no DOM, no localStorage, no fetch.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libPath = path.resolve(__dirname, '../lib/bgCollections.ts');

const {
  PHOTO_COLLECTIONS_KEY,
  MAX_PHOTOS_PER_COLLECTION,
  MAX_COLLECTIONS,
  runMigration,
  createCollection,
  renameCollection,
  deleteCollection,
  addPhotoToCollection,
  deletePhotoFromCollection,
} = await import(libPath);

// ── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_IDS = {
  col1:     'aaaaaaaa-0000-0000-0000-000000000001',
  col2:     'aaaaaaaa-0000-0000-0000-000000000002',
  photo1:   'bbbbbbbb-0000-0000-0000-000000000001',
  photo2:   'bbbbbbbb-0000-0000-0000-000000000002',
  photo3:   'bbbbbbbb-0000-0000-0000-000000000003',
  newCol:   'cccccccc-0000-0000-0000-000000000001',
  newPhoto: 'dddddddd-0000-0000-0000-000000000001',
};

/** Make a collection whose photos carry only `{ id }` — no dataUrl. */
function makeCollection({ id, name, photoCount = 0 } = {}) {
  const photos = Array.from({ length: photoCount }, (_, i) => ({ id: `photo-${i}` }));
  return { id: id ?? FIXED_IDS.col1, name: name ?? 'Test', photos };
}

/** Make a single photo — only `{ id }`, no dataUrl. */
function makePhoto(id) {
  return { id };
}

// ── P1: Constants ─────────────────────────────────────────────────────────────

describe('P1 — Constants', () => {
  it('PHOTO_COLLECTIONS_KEY is the expected localStorage key', () => {
    assert.equal(PHOTO_COLLECTIONS_KEY, 'trailweigh:photoCollections');
  });

  it('MAX_PHOTOS_PER_COLLECTION is 10', () => {
    assert.equal(MAX_PHOTOS_PER_COLLECTION, 10);
  });

  it('MAX_COLLECTIONS is 10', () => {
    assert.equal(MAX_COLLECTIONS, 10);
  });
});

// ── P2: runMigration ──────────────────────────────────────────────────────────

describe('P2 — runMigration', () => {
  it('null legacyPhotoId returns collections unchanged', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Existing' })];
    const result = runMigration(cols, null);
    assert.deepEqual(result, cols);
  });

  it('empty-string legacyPhotoId returns collections unchanged', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Existing' })];
    const result = runMigration(cols, '');
    assert.deepEqual(result, cols);
  });

  it('fresh migration with no existing collections creates My Photos', () => {
    const result = runMigration([], FIXED_IDS.newPhoto, FIXED_IDS.newCol);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'My Photos');
    assert.equal(result[0].photos.length, 1);
    assert.equal(result[0].photos[0].id, FIXED_IDS.newPhoto);
    assert.equal(result[0].id, FIXED_IDS.newCol);
  });

  it('migration merges into an existing My Photos collection', () => {
    const existingPhoto = { id: FIXED_IDS.photo1 };
    const myPhotos = { id: FIXED_IDS.col1, name: 'My Photos', photos: [existingPhoto] };
    const result = runMigration([myPhotos], FIXED_IDS.newPhoto);
    assert.equal(result.length, 1);
    assert.equal(result[0].photos.length, 2);
    // New photo is prepended
    assert.equal(result[0].photos[0].id, FIXED_IDS.newPhoto);
    assert.equal(result[0].photos[1].id, FIXED_IDS.photo1);
  });

  it('migration is idempotent — same photoId is not added twice', () => {
    const myPhotos = {
      id: FIXED_IDS.col1,
      name: 'My Photos',
      photos: [{ id: FIXED_IDS.photo1 }],
    };
    const result = runMigration([myPhotos], FIXED_IDS.photo1);
    assert.equal(result[0].photos.length, 1);
  });

  it('My Photos is placed first when no collections existed before', () => {
    const result = runMigration([], FIXED_IDS.newPhoto, FIXED_IDS.newCol);
    assert.equal(result[0].name, 'My Photos');
  });
});

// ── P3: createCollection ──────────────────────────────────────────────────────

describe('P3 — createCollection', () => {
  it('creates a new empty collection with a trimmed name', () => {
    const res = createCollection('  My Trip  ', [], FIXED_IDS.newCol);
    assert.ok(res !== null);
    assert.equal(res.result.length, 1);
    assert.equal(res.result[0].name, 'My Trip');
    assert.equal(res.result[0].photos.length, 0);
    assert.equal(res.result[0].id, FIXED_IDS.newCol);
    assert.equal(res.newId, FIXED_IDS.newCol);
  });

  it('returns null for a blank name', () => {
    const res = createCollection('   ', []);
    assert.equal(res, null);
  });

  it('returns null when a collection with the same name already exists', () => {
    const existing = [makeCollection({ id: FIXED_IDS.col1, name: 'Duplicate' })];
    const res = createCollection('Duplicate', existing, FIXED_IDS.newCol);
    assert.equal(res, null, 'Duplicate name should be rejected');
  });

  it('duplicate check is case-sensitive and whitespace-trimmed', () => {
    const existing = [makeCollection({ id: FIXED_IDS.col1, name: 'Sierra' })];
    const sameExact = createCollection('  Sierra  ', existing, FIXED_IDS.newCol);
    assert.equal(sameExact, null, 'Trimmed duplicate should be rejected');
    const diffCase = createCollection('sierra', existing, FIXED_IDS.newCol);
    assert.ok(diffCase !== null, 'Different case should be allowed');
  });

  it('appends new collection to the end of the list', () => {
    const existing = [
      makeCollection({ id: FIXED_IDS.col1, name: 'First' }),
      makeCollection({ id: FIXED_IDS.col2, name: 'Second' }),
    ];
    const res = createCollection('Third', existing, FIXED_IDS.newCol);
    assert.ok(res !== null);
    assert.equal(res.result.length, 3);
    assert.equal(res.result[2].name, 'Third');
  });
});

// ── P4: renameCollection ──────────────────────────────────────────────────────

describe('P4 — renameCollection', () => {
  it('renames a collection by ID', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Old Name' })];
    const result = renameCollection(FIXED_IDS.col1, 'New Name', cols);
    assert.ok(result !== null);
    assert.equal(result[0].name, 'New Name');
  });

  it('returns null for a blank new name', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Old Name' })];
    const result = renameCollection(FIXED_IDS.col1, '  ', cols);
    assert.equal(result, null);
  });

  it('returns null when another collection has the same name', () => {
    const cols = [
      makeCollection({ id: FIXED_IDS.col1, name: 'Alpha' }),
      makeCollection({ id: FIXED_IDS.col2, name: 'Beta' }),
    ];
    const result = renameCollection(FIXED_IDS.col1, 'Beta', cols);
    assert.equal(result, null);
  });

  it('allows renaming to the same name (no-op is valid)', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Same' })];
    const result = renameCollection(FIXED_IDS.col1, 'Same', cols);
    assert.ok(result !== null);
    assert.equal(result[0].name, 'Same');
  });

  it('other collections are unaffected by rename', () => {
    const cols = [
      makeCollection({ id: FIXED_IDS.col1, name: 'Alpha' }),
      makeCollection({ id: FIXED_IDS.col2, name: 'Beta' }),
    ];
    const result = renameCollection(FIXED_IDS.col1, 'Gamma', cols);
    assert.ok(result !== null);
    assert.equal(result[1].name, 'Beta');
  });

  it('renaming preserves all photos in the collection', () => {
    const photos = [makePhoto(FIXED_IDS.photo1), makePhoto(FIXED_IDS.photo2)];
    const cols = [{ id: FIXED_IDS.col1, name: 'Old', photos }];
    const result = renameCollection(FIXED_IDS.col1, 'New', cols);
    assert.ok(result !== null);
    assert.equal(result[0].photos.length, 2);
    assert.equal(result[0].photos[0].id, FIXED_IDS.photo1);
    assert.equal(result[0].photos[1].id, FIXED_IDS.photo2);
  });
});

// ── P5: deleteCollection ──────────────────────────────────────────────────────

describe('P5 — deleteCollection', () => {
  it('deletes a collection by ID', () => {
    const cols = [
      makeCollection({ id: FIXED_IDS.col1, name: 'Alpha' }),
      makeCollection({ id: FIXED_IDS.col2, name: 'Beta' }),
    ];
    const result = deleteCollection(FIXED_IDS.col1, cols);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Beta');
  });

  it('has no effect when the ID does not exist', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Alpha' })];
    const result = deleteCollection('nonexistent-id', cols);
    assert.equal(result.length, 1);
  });

  it('deleting last collection returns an empty array', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Last' })];
    const result = deleteCollection(FIXED_IDS.col1, cols);
    assert.deepEqual(result, []);
  });

  it('deleting one theme reduces count and makes room for another', () => {
    const cols = Array.from({ length: 10 }, (_, i) => ({
      id: `col-${i}`, name: `Theme${i}`, photos: [],
    }));
    assert.equal(cols.length, MAX_COLLECTIONS);
    const after = deleteCollection('col-0', cols);
    assert.equal(after.length, 9);
    const res = createCollection('NewTheme', after);
    assert.ok(res !== null, 'Should be able to add a theme after deletion');
    assert.equal(res.result.length, 10);
  });
});

// ── P6: addPhotoToCollection ──────────────────────────────────────────────────

describe('P6 — addPhotoToCollection', () => {
  it('adds a photo to an existing collection', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1 })];
    const photo = makePhoto(FIXED_IDS.photo1);
    const result = addPhotoToCollection(FIXED_IDS.col1, photo, cols);
    assert.ok(result !== null);
    assert.equal(result[0].photos.length, 1);
    assert.equal(result[0].photos[0].id, FIXED_IDS.photo1);
  });

  it('returns null when the collection ID does not exist', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1 })];
    const result = addPhotoToCollection('nonexistent-id', makePhoto(FIXED_IDS.photo1), cols);
    assert.equal(result, null);
  });

  it(`returns null when the collection already has ${MAX_PHOTOS_PER_COLLECTION} photos`, () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, photoCount: MAX_PHOTOS_PER_COLLECTION })];
    const result = addPhotoToCollection(FIXED_IDS.col1, makePhoto(FIXED_IDS.photo1), cols);
    assert.equal(result, null);
  });

  it('appends the photo to the END of the collection', () => {
    const existing = makePhoto(FIXED_IDS.photo1);
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [existing] }];
    const result = addPhotoToCollection(FIXED_IDS.col1, makePhoto(FIXED_IDS.photo2), cols);
    assert.ok(result !== null);
    assert.equal(result[0].photos.length, 2);
    assert.equal(result[0].photos[1].id, FIXED_IDS.photo2);
  });

  it('other collections are unaffected by the add', () => {
    const cols = [
      makeCollection({ id: FIXED_IDS.col1 }),
      makeCollection({ id: FIXED_IDS.col2, name: 'Untouched' }),
    ];
    const result = addPhotoToCollection(FIXED_IDS.col1, makePhoto(FIXED_IDS.photo1), cols);
    assert.ok(result !== null);
    assert.equal(result[1].photos.length, 0);
  });
});

// ── P7: deletePhotoFromCollection ─────────────────────────────────────────────

describe('P7 — deletePhotoFromCollection', () => {
  it('removes a photo from a collection by IDs', () => {
    const photo = makePhoto(FIXED_IDS.photo1);
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [photo] }];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, FIXED_IDS.photo1, cols);
    assert.equal(result[0].photos.length, 0);
  });

  it('other photos in the same collection are unaffected', () => {
    const p1 = makePhoto(FIXED_IDS.photo1);
    const p2 = makePhoto(FIXED_IDS.photo2);
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [p1, p2] }];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, FIXED_IDS.photo1, cols);
    assert.equal(result[0].photos.length, 1);
    assert.equal(result[0].photos[0].id, FIXED_IDS.photo2);
  });

  it('has no effect when photo ID does not exist in the collection', () => {
    const photo = makePhoto(FIXED_IDS.photo1);
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [photo] }];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, 'nonexistent-photo', cols);
    assert.equal(result[0].photos.length, 1);
  });

  it('other collections are unaffected by the delete', () => {
    const p1 = makePhoto(FIXED_IDS.photo1);
    const p2 = makePhoto(FIXED_IDS.photo2);
    const cols = [
      { id: FIXED_IDS.col1, name: 'Target', photos: [p1] },
      { id: FIXED_IDS.col2, name: 'Other',  photos: [p2] },
    ];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, FIXED_IDS.photo1, cols);
    assert.equal(result[1].photos.length, 1);
    assert.equal(result[1].photos[0].id, FIXED_IDS.photo2);
  });
});
