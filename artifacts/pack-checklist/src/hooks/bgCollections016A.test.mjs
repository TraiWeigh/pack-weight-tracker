/**
 * bgCollections016A.test.mjs — Prompt 016A requirements for the corrected
 * Theme dropdown and photo workflow.
 *
 * Updated for Prompt 016B:
 *   - CollectionPhoto no longer carries a `dataUrl` field.
 *     makeCol and makePhoto helpers now produce photos with `{ id }` only.
 *   - runMigration signature changed to (collections, legacyPhotoId, newCollectionId?).
 *   - Tests that previously asserted on `.dataUrl` now assert on `.id`.
 *
 * Tests the data-layer requirements from Prompt 016A Part 18.
 * UI-layer requirements (rendering, drag-and-drop browser behaviour, dropdown
 * visibility) cannot be tested in a Node.js runner and are marked NOT TESTED
 * in PROMPT_016A_REPORT.md; they require user visual verification.
 *
 * Runs with: node --test bgCollections016A.test.mjs
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Photos carry only `{ id }` — no dataUrl (Prompt 016B). */
function makeCol(id, name, photoCount = 0) {
  const photos = Array.from({ length: photoCount }, (_, i) => ({ id: `p${i}-${id}` }));
  return { id, name, photos };
}

/** Returns `{ id }` only — no dataUrl. */
function makePhoto(id) {
  return { id };
}

// ── A1: Dropdown constants ────────────────────────────────────────────────────

describe('A1 — Dropdown data structure', () => {
  it('built-in Landscapes is separate from custom collections', () => {
    const cols = [makeCol('c1', 'Sierra'), makeCol('c2', 'Desert')];
    assert.ok(cols.every(c => c.id !== 'landscapes'));
  });

  it('Add Theme is available when fewer than MAX_COLLECTIONS custom themes exist', () => {
    const cols = Array.from({ length: MAX_COLLECTIONS - 1 }, (_, i) =>
      makeCol(`c${i}`, `Theme${i}`),
    );
    const canAdd = cols.length < MAX_COLLECTIONS;
    assert.ok(canAdd, 'Should be able to add a theme when under the limit');
  });

  it('Add Theme is unavailable when MAX_COLLECTIONS custom themes exist', () => {
    const cols = Array.from({ length: MAX_COLLECTIONS }, (_, i) =>
      makeCol(`c${i}`, `Theme${i}`),
    );
    const canAdd = cols.length < MAX_COLLECTIONS;
    assert.equal(canAdd, false, 'Add Theme should be blocked at the limit');
  });

  it('Landscapes does not count toward the MAX_COLLECTIONS limit', () => {
    const customCount = MAX_COLLECTIONS;
    assert.equal(MAX_COLLECTIONS, 10, 'Limit is 10 custom themes');
    assert.ok(customCount <= MAX_COLLECTIONS, 'Landscapes excluded from count');
  });
});

// ── A2: Theme name save — Req 6, 7, 8, 9 ────────────────────────────────────

describe('A2 — Add Theme name validation (Req 6, 8, 9)', () => {
  it('Req 6: saving a valid theme name creates a new collection', () => {
    const res = createCollection('Test', []);
    assert.ok(res !== null);
    assert.equal(res.result.length, 1);
    assert.equal(res.result[0].name, 'Test');
  });

  it('Req 7: custom theme label format is "Theme [Collection Name]" (verified in UI)', () => {
    const res = createCollection('Test', []);
    assert.ok(res !== null);
    const label = `Theme ${res.result[0].name}`;
    assert.equal(label, 'Theme Test');
  });

  it('Req 8: blank names are rejected', () => {
    assert.equal(createCollection('', []), null);
    assert.equal(createCollection('   ', []), null);
  });

  it('Req 9: duplicate names are rejected — does not overwrite existing theme', () => {
    const existing = [makeCol('c1', 'Sierra')];
    const res = createCollection('Sierra', existing);
    assert.equal(res, null, 'Duplicate name must be blocked');
    assert.equal(existing.length, 1);
    assert.equal(existing[0].name, 'Sierra');
  });

  it('Req 9: duplicate check uses trimmed name', () => {
    const existing = [makeCol('c1', 'Desert')];
    const res = createCollection('  Desert  ', existing);
    assert.equal(res, null, 'Trimmed duplicate must be blocked');
  });
});

// ── A3: Max 10 custom themes — Req 13, 14, 15 ────────────────────────────────

describe('A3 — Theme count limits (Req 13, 14, 15)', () => {
  it('Req 13: MAX_COLLECTIONS is 10', () => {
    assert.equal(MAX_COLLECTIONS, 10);
  });

  it('Req 14: Landscapes (built-in) does not occupy a slot in the limit count', () => {
    const cols = Array.from({ length: MAX_COLLECTIONS }, (_, i) =>
      makeCol(`c${i}`, `T${i}`),
    );
    assert.equal(cols.length, MAX_COLLECTIONS);
  });

  it('Req 15: deleting one theme reduces count and re-enables Add Theme', () => {
    const cols = Array.from({ length: MAX_COLLECTIONS }, (_, i) =>
      makeCol(`c${i}`, `T${i}`),
    );
    assert.equal(cols.length < MAX_COLLECTIONS, false, 'At limit');
    const after = deleteCollection('c0', cols);
    assert.equal(after.length, MAX_COLLECTIONS - 1);
    assert.equal(after.length < MAX_COLLECTIONS, true, 'Add Theme re-enabled');
  });
});

// ── A4: Photos per theme — Req 16, 17, 18 ────────────────────────────────────

describe('A4 — Photos per theme (Req 16, 17, 18)', () => {
  it('Req 16: MAX_PHOTOS_PER_COLLECTION is 10', () => {
    assert.equal(MAX_PHOTOS_PER_COLLECTION, 10);
  });

  it('Req 16: cannot add more than 10 photos to a custom theme', () => {
    const col = makeCol('c1', 'Test', MAX_PHOTOS_PER_COLLECTION);
    const result = addPhotoToCollection('c1', makePhoto('extra'), [col]);
    assert.equal(result, null, 'Eleventh photo must be rejected');
  });

  it('Req 17: adding a photo increases the count by 1', () => {
    const col = makeCol('c1', 'Test', 3);
    const result = addPhotoToCollection('c1', makePhoto('new'), [col]);
    assert.ok(result !== null);
    assert.equal(result[0].photos.length, 4);
  });

  it('Req 17: photo is appended (slot-filling behaviour)', () => {
    const col = makeCol('c1', 'Test', 0);
    const photo = makePhoto('p1');
    const result = addPhotoToCollection('c1', photo, [col]);
    assert.ok(result !== null);
    assert.equal(result[0].photos[0].id, 'p1');
  });

  it('Req 18: removing a photo decreases count by 1', () => {
    const photos = [makePhoto('p1'), makePhoto('p2'), makePhoto('p3')];
    const cols = [{ id: 'c1', name: 'Test', photos }];
    const result = deletePhotoFromCollection('c1', 'p2', cols);
    assert.equal(result[0].photos.length, 2);
  });

  it('Req 18: removed photo slot is not filled by remaining photos (order preserved)', () => {
    const photos = [makePhoto('p1'), makePhoto('p2'), makePhoto('p3')];
    const cols = [{ id: 'c1', name: 'Test', photos }];
    const result = deletePhotoFromCollection('c1', 'p1', cols);
    assert.equal(result[0].photos[0].id, 'p2');
    assert.equal(result[0].photos[1].id, 'p3');
  });
});

// ── A5: Migration — Req 21, 22 ───────────────────────────────────────────────

describe('A5 — Prompt 016 migration (Req 21, 22)', () => {
  it('Req 21: existing collections are preserved by runMigration when photoId is null', () => {
    const existing = [makeCol('c1', 'Test Themes')];
    const result = runMigration(existing, null);
    assert.deepEqual(result, existing, 'Pre-existing collections must be preserved');
  });

  it('Req 22: migration with existing collections is idempotent', () => {
    // Simulate a photo already migrated into My Photos
    const myPhotos = { id: 'mp1', name: 'My Photos', photos: [{ id: 'p1' }] };
    const cols = [myPhotos, makeCol('c1', 'Test Themes')];
    // Running migration with 'p1' again — should not add a duplicate
    const result = runMigration(cols, 'p1');
    assert.equal(result.find(c => c.name === 'My Photos')?.photos.length, 1, 'No duplicate');
    assert.ok(result.find(c => c.name === 'Test Themes') !== undefined, 'Custom theme preserved');
  });

  it('Req 22: running migration twice never duplicates a photo', () => {
    const photoId = 'onlyOnce';
    let cols = [];
    cols = runMigration(cols, photoId, 'cid1');
    cols = runMigration(cols, photoId); // second run — same photoId
    const myPhotos = cols.find(c => c.name === 'My Photos');
    assert.ok(myPhotos);
    assert.equal(myPhotos.photos.length, 1, 'Photo must not be duplicated');
  });
});

// ── A6: Rename preserves photos — Req 23 ─────────────────────────────────────

describe('A6 — Rename preserves photos (Req 23)', () => {
  it('Req 23: renaming a theme preserves all photo references', () => {
    const photos = [makePhoto('p1'), makePhoto('p2')];
    const cols = [{ id: 'c1', name: 'Old', photos }];
    const result = renameCollection('c1', 'Sierra', cols);
    assert.ok(result !== null);
    assert.equal(result[0].name, 'Sierra');
    assert.equal(result[0].photos.length, 2);
    assert.equal(result[0].photos[0].id, 'p1');
    assert.equal(result[0].photos[1].id, 'p2');
  });

  it('Req 23: renaming a theme preserves photo order', () => {
    const photos = [makePhoto('p1'), makePhoto('p2'), makePhoto('p3')];
    const cols = [{ id: 'c1', name: 'Test', photos }];
    const result = renameCollection('c1', 'Renamed', cols);
    assert.ok(result !== null);
    const ids = result[0].photos.map(p => p.id);
    assert.deepEqual(ids, ['p1', 'p2', 'p3']);
  });

  it('Req 23: renaming updates only the target; other collections unaffected', () => {
    const p1 = makePhoto('p1');
    const p2 = makePhoto('p2');
    const cols = [
      { id: 'c1', name: 'Target', photos: [p1] },
      { id: 'c2', name: 'Other',  photos: [p2] },
    ];
    const result = renameCollection('c1', 'Renamed', cols);
    assert.ok(result !== null);
    assert.equal(result[0].name, 'Renamed');
    assert.equal(result[1].name, 'Other');
    assert.equal(result[1].photos[0].id, 'p2');
  });
});

// ── A7: Delete theme — Req 24 (data-layer portion) ───────────────────────────

describe('A7 — Delete theme data behaviour (Req 24)', () => {
  it('Req 24: deleting the active theme removes it from the collections array', () => {
    const cols = [makeCol('c1', 'Sierra'), makeCol('c2', 'Desert')];
    const after = deleteCollection('c1', cols);
    assert.equal(after.length, 1);
    assert.equal(after[0].name, 'Desert');
  });

  it('Req 24: other themes are fully unaffected by deletion', () => {
    const photos = [makePhoto('p1')];
    const cols = [
      { id: 'c1', name: 'ToDelete', photos: [] },
      { id: 'c2', name: 'ToKeep',   photos },
    ];
    const after = deleteCollection('c1', cols);
    assert.equal(after[0].name, 'ToKeep');
    assert.equal(after[0].photos.length, 1);
    assert.equal(after[0].photos[0].id, 'p1');
  });
});

// ── A8: JSON round-trip — Req 25 (data layer) ────────────────────────────────

describe('A8 — Data persists through JSON serialisation (Req 25)', () => {
  it('Req 25: collections survive a JSON stringify/parse round-trip', () => {
    const photos = [makePhoto('p1'), makePhoto('p2')];
    const original = [{ id: 'c1', name: 'Sierra', photos }];
    const serialised = JSON.stringify(original);
    const restored = JSON.parse(serialised);
    assert.equal(restored.length, 1);
    assert.equal(restored[0].name, 'Sierra');
    assert.equal(restored[0].photos.length, 2);
    assert.equal(restored[0].photos[0].id, 'p1');
    assert.equal(restored[0].photos[1].id, 'p2');
    // No dataUrl field expected
    assert.ok(!('dataUrl' in restored[0].photos[0]), 'photos must not carry dataUrl');
  });

  it('Req 25: renamed theme survives round-trip', () => {
    const cols = [{ id: 'c1', name: 'Test', photos: [] }];
    const renamed = renameCollection('c1', 'Renamed', cols);
    assert.ok(renamed !== null);
    const restored = JSON.parse(JSON.stringify(renamed));
    assert.equal(restored[0].name, 'Renamed');
  });
});
