/**
 * bgCollections.test.mjs — 18 test scenarios for pure bgCollections.ts functions.
 *
 * Runs with: node --test bgCollections.test.mjs
 * All functions under test are pure: no DOM, no localStorage, no fetch.
 *
 * The TypeScript source is transpiled inline via tsx so we can import it
 * directly from the test runner.  All 18 scenarios must pass.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Dynamic import with tsx (same pattern as other test suites) ───────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libPath = path.resolve(__dirname, '../lib/bgCollections.ts');

// tsx registers itself at the package level; we can import TS directly.
const {
  PHOTO_COLLECTIONS_KEY,
  MAX_PHOTOS_PER_COLLECTION,
  runMigration,
  createCollection,
  renameCollection,
  deleteCollection,
  addPhotoToCollection,
  deletePhotoFromCollection,
} = await import(libPath);

// ── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_IDS = {
  col1:   'aaaaaaaa-0000-0000-0000-000000000001',
  col2:   'aaaaaaaa-0000-0000-0000-000000000002',
  photo1: 'bbbbbbbb-0000-0000-0000-000000000001',
  photo2: 'bbbbbbbb-0000-0000-0000-000000000002',
  photo3: 'bbbbbbbb-0000-0000-0000-000000000003',
  newCol: 'cccccccc-0000-0000-0000-000000000001',
  newPhoto: 'dddddddd-0000-0000-0000-000000000001',
};

function makeCollection({ id, name, photoCount = 0 } = {}) {
  const photos = Array.from({ length: photoCount }, (_, i) => ({
    id: `photo-${i}`,
    dataUrl: `data:image/jpeg;base64,photo${i}`,
  }));
  return { id: id ?? FIXED_IDS.col1, name: name ?? 'Test', photos };
}

// ── P1: Constants ─────────────────────────────────────────────────────────────

describe('P1 — Constants', () => {
  it('PHOTO_COLLECTIONS_KEY is the expected localStorage key', () => {
    assert.equal(PHOTO_COLLECTIONS_KEY, 'trailweigh:photoCollections');
  });

  it('MAX_PHOTOS_PER_COLLECTION is 10', () => {
    assert.equal(MAX_PHOTOS_PER_COLLECTION, 10);
  });
});

// ── P2: runMigration ──────────────────────────────────────────────────────────

describe('P2 — runMigration', () => {
  it('null legacyDataUrl returns collections unchanged', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Existing' })];
    const result = runMigration(cols, null);
    assert.deepEqual(result, cols);
  });

  it('empty-string legacyDataUrl returns collections unchanged', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, name: 'Existing' })];
    const result = runMigration(cols, '');
    assert.deepEqual(result, cols);
  });

  it('fresh migration with no existing collections creates My Photos', () => {
    const dataUrl = 'data:image/jpeg;base64,testPhoto';
    const result = runMigration(
      [],
      dataUrl,
      FIXED_IDS.newPhoto,
      FIXED_IDS.newCol,
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'My Photos');
    assert.equal(result[0].photos.length, 1);
    assert.equal(result[0].photos[0].dataUrl, dataUrl);
    assert.equal(result[0].photos[0].id, FIXED_IDS.newPhoto);
    assert.equal(result[0].id, FIXED_IDS.newCol);
  });

  it('migration merges into an existing My Photos collection', () => {
    const existingPhoto = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,existing' };
    const myPhotos = {
      id: FIXED_IDS.col1,
      name: 'My Photos',
      photos: [existingPhoto],
    };
    const dataUrl = 'data:image/jpeg;base64,newPhoto';
    const result = runMigration([myPhotos], dataUrl, FIXED_IDS.newPhoto);
    assert.equal(result.length, 1);
    assert.equal(result[0].photos.length, 2);
    // New photo is prepended
    assert.equal(result[0].photos[0].dataUrl, dataUrl);
    assert.equal(result[0].photos[1].dataUrl, existingPhoto.dataUrl);
  });

  it('migration is idempotent — same dataUrl is not added twice', () => {
    const dataUrl = 'data:image/jpeg;base64,same';
    const myPhotos = {
      id: FIXED_IDS.col1,
      name: 'My Photos',
      photos: [{ id: FIXED_IDS.photo1, dataUrl }],
    };
    const result = runMigration([myPhotos], dataUrl, FIXED_IDS.newPhoto);
    assert.equal(result[0].photos.length, 1);
  });

  it('My Photos is placed first when no collections existed before', () => {
    const dataUrl = 'data:image/jpeg;base64,test';
    const result = runMigration([], dataUrl, FIXED_IDS.newPhoto, FIXED_IDS.newCol);
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

  it('allows duplicate names (disambiguated by ID)', () => {
    const existing = [makeCollection({ id: FIXED_IDS.col1, name: 'Duplicate' })];
    const res = createCollection('Duplicate', existing, FIXED_IDS.newCol);
    assert.ok(res !== null);
    assert.equal(res.result.length, 2);
    // Both exist; the one with newCol ID is the new one
    const newOne = res.result.find(c => c.id === FIXED_IDS.newCol);
    assert.ok(newOne);
    assert.equal(newOne.name, 'Duplicate');
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
});

// ── P6: addPhotoToCollection ──────────────────────────────────────────────────

describe('P6 — addPhotoToCollection', () => {
  it('adds a photo to an existing collection', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1 })];
    const photo = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,abc' };
    const result = addPhotoToCollection(FIXED_IDS.col1, photo, cols);
    assert.ok(result !== null);
    assert.equal(result[0].photos.length, 1);
    assert.equal(result[0].photos[0].id, FIXED_IDS.photo1);
  });

  it('returns null when the collection ID does not exist', () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1 })];
    const photo = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,abc' };
    const result = addPhotoToCollection('nonexistent-id', photo, cols);
    assert.equal(result, null);
  });

  it(`returns null when the collection already has ${MAX_PHOTOS_PER_COLLECTION} photos`, () => {
    const cols = [makeCollection({ id: FIXED_IDS.col1, photoCount: MAX_PHOTOS_PER_COLLECTION })];
    const photo = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,extra' };
    const result = addPhotoToCollection(FIXED_IDS.col1, photo, cols);
    assert.equal(result, null);
  });

  it('appends the photo to the END of the collection', () => {
    const existing = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,first' };
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [existing] }];
    const newPhoto = { id: FIXED_IDS.photo2, dataUrl: 'data:image/jpeg;base64,second' };
    const result = addPhotoToCollection(FIXED_IDS.col1, newPhoto, cols);
    assert.ok(result !== null);
    assert.equal(result[0].photos.length, 2);
    assert.equal(result[0].photos[1].id, FIXED_IDS.photo2);
  });

  it('other collections are unaffected by the add', () => {
    const cols = [
      makeCollection({ id: FIXED_IDS.col1 }),
      makeCollection({ id: FIXED_IDS.col2, name: 'Untouched' }),
    ];
    const photo = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,abc' };
    const result = addPhotoToCollection(FIXED_IDS.col1, photo, cols);
    assert.ok(result !== null);
    assert.equal(result[1].photos.length, 0);
  });
});

// ── P7: deletePhotoFromCollection ─────────────────────────────────────────────

describe('P7 — deletePhotoFromCollection', () => {
  it('removes a photo from a collection by IDs', () => {
    const photo = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,abc' };
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [photo] }];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, FIXED_IDS.photo1, cols);
    assert.equal(result[0].photos.length, 0);
  });

  it('other photos in the same collection are unaffected', () => {
    const p1 = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,a1' };
    const p2 = { id: FIXED_IDS.photo2, dataUrl: 'data:image/jpeg;base64,a2' };
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [p1, p2] }];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, FIXED_IDS.photo1, cols);
    assert.equal(result[0].photos.length, 1);
    assert.equal(result[0].photos[0].id, FIXED_IDS.photo2);
  });

  it('has no effect when photo ID does not exist in the collection', () => {
    const photo = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,abc' };
    const cols = [{ id: FIXED_IDS.col1, name: 'Test', photos: [photo] }];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, 'nonexistent-photo', cols);
    assert.equal(result[0].photos.length, 1);
  });

  it('other collections are unaffected by the delete', () => {
    const p1 = { id: FIXED_IDS.photo1, dataUrl: 'data:image/jpeg;base64,abc' };
    const p2 = { id: FIXED_IDS.photo2, dataUrl: 'data:image/jpeg;base64,xyz' };
    const cols = [
      { id: FIXED_IDS.col1, name: 'Target', photos: [p1] },
      { id: FIXED_IDS.col2, name: 'Other',  photos: [p2] },
    ];
    const result = deletePhotoFromCollection(FIXED_IDS.col1, FIXED_IDS.photo1, cols);
    assert.equal(result[1].photos.length, 1);
    assert.equal(result[1].photos[0].id, FIXED_IDS.photo2);
  });
});
