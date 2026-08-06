/**
 * bgPhotoStore016B.test.mjs — unit tests for bgPhotoStore.ts (Prompt 016B).
 *
 * Verifies:
 *   - validateImageFile (MIME type, extension, size guards)
 *   - dataUrlToBlob (base64 decode, MIME extraction, malformed input)
 *   - isMigrationDone / markMigrationDone (localStorage facade)
 *   - storePhoto / getPhotoBlob / deletePhoto / deletePhotos / getAllStoredPhotoIds
 *     (IndexedDB CRUD via in-process mock injected through _resetDbForTesting)
 *   - createPhotoObjectUrl / revokePhotoObjectUrl (URL mock)
 *
 * Node.js DOM-dependent functions (compressPhotoFile, migrateCollectionsToIndexedDb,
 * migrateLegacyActiveBackground) require a browser canvas and are NOT tested here;
 * they are covered by visual regression in the running web app.
 *
 * Runs with: node bgPhotoStore016B.test.mjs
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libPath = path.resolve(__dirname, '../lib/bgPhotoStore.ts');

// ── Mock globals required by bgPhotoStore.ts ──────────────────────────────────

// In-memory localStorage mock
const localStorageStore = new Map();
globalThis.localStorage = {
  getItem:    key => localStorageStore.get(key) ?? null,
  setItem:    (key, val) => localStorageStore.set(key, String(val)),
  removeItem: key => localStorageStore.delete(key),
  clear:      () => localStorageStore.clear(),
};

// URL.createObjectURL / revokeObjectURL mocks
let objUrlCounter = 0;
const activeObjectUrls = new Map();
globalThis.URL.createObjectURL = (blob) => {
  const url = `blob:mock://${++objUrlCounter}`;
  activeObjectUrls.set(url, blob);
  return url;
};
globalThis.URL.revokeObjectURL = (url) => {
  activeObjectUrls.delete(url);
};

// ── In-memory IndexedDB mock ──────────────────────────────────────────────────

function createMockDb() {
  const store = new Map(); // photoId → record

  function makeReq(value) {
    const req = { result: value, error: null, onsuccess: null, onerror: null };
    // Schedule microtask so callers set .onsuccess before it fires
    queueMicrotask(() => req.onsuccess?.({ target: req }));
    return req;
  }

  function makeErrReq(err) {
    const req = { result: undefined, error: err, onsuccess: null, onerror: null };
    queueMicrotask(() => req.onerror?.({ target: req }));
    return req;
  }

  const objectStore = {
    put(record) {
      store.set(record.photoId, { ...record });
      return makeReq(undefined);
    },
    get(key) {
      return makeReq(store.get(key) ?? undefined);
    },
    delete(key) {
      store.delete(key);
      return makeReq(undefined);
    },
    getAllKeys() {
      return makeReq([...store.keys()]);
    },
  };

  const tx = {
    error: null,
    onerror: null,
    objectStore: () => objectStore,
  };

  return {
    transaction: () => tx,
    _store: store,    // exposed for test inspection
    _objectStore: objectStore,
    _makeErrReq: makeErrReq,
  };
}

// ── Load the module under test ────────────────────────────────────────────────

const mod = await import(libPath);
const {
  _resetDbForTesting,
  validateImageFile,
  dataUrlToBlob,
  isMigrationDone,
  markMigrationDone,
  BG_MIGRATION_KEY,
  storePhoto,
  getPhotoBlob,
  deletePhoto,
  deletePhotos,
  getAllStoredPhotoIds,
  createPhotoObjectUrl,
  revokePhotoObjectUrl,
} = mod;

// ── S1: validateImageFile ─────────────────────────────────────────────────────

describe('S1 — validateImageFile', () => {
  function fakeFile(name, type, size = 1024) {
    return { name, type, size };
  }

  it('accepts image/jpeg', () => {
    assert.equal(validateImageFile(fakeFile('photo.jpg', 'image/jpeg')), null);
  });

  it('accepts image/png', () => {
    assert.equal(validateImageFile(fakeFile('photo.png', 'image/png')), null);
  });

  it('accepts image/webp', () => {
    assert.equal(validateImageFile(fakeFile('photo.webp', 'image/webp')), null);
  });

  it('accepts image/gif', () => {
    assert.equal(validateImageFile(fakeFile('photo.gif', 'image/gif')), null);
  });

  it('rejects TIFF by extension', () => {
    const err = validateImageFile(fakeFile('photo.tiff', 'image/tiff'));
    assert.ok(typeof err === 'string', 'Should return an error string');
    assert.ok(err.length > 0);
  });

  it('rejects SVG by extension', () => {
    const err = validateImageFile(fakeFile('icon.svg', 'image/svg+xml'));
    assert.ok(typeof err === 'string');
  });

  it('rejects a file exceeding 25 MB', () => {
    const tooBig = fakeFile('huge.jpg', 'image/jpeg', 26 * 1024 * 1024);
    const err = validateImageFile(tooBig);
    assert.ok(typeof err === 'string');
    assert.ok(err.toLowerCase().includes('large') || err.toLowerCase().includes('mb'));
  });

  it('accepts a file exactly at 25 MB (boundary)', () => {
    const boundary = fakeFile('ok.jpg', 'image/jpeg', 25 * 1024 * 1024);
    assert.equal(validateImageFile(boundary), null);
  });
});

// ── S2: dataUrlToBlob ─────────────────────────────────────────────────────────

describe('S2 — dataUrlToBlob', () => {
  it('converts a valid JPEG data URL to a Blob', () => {
    // Minimal 1×1 white JPEG in base64
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';
    const blob = dataUrlToBlob(dataUrl);
    assert.ok(blob instanceof Blob || (blob && blob.constructor.name === 'Blob'), 'Should return a Blob');
    assert.equal(blob.type, 'image/jpeg');
    assert.ok(blob.size > 0);
  });

  it('returns null for a data URL without a comma', () => {
    const result = dataUrlToBlob('data:image/jpeg;base64:NOCOMMA');
    assert.equal(result, null);
  });

  it('extracts the correct MIME type from the data URL header', () => {
    // 1-pixel transparent PNG
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);
    assert.ok(blob !== null);
    assert.equal(blob.type, 'image/png');
  });
});

// ── S3: isMigrationDone / markMigrationDone ───────────────────────────────────

describe('S3 — isMigrationDone / markMigrationDone', () => {
  beforeEach(() => {
    localStorageStore.delete(BG_MIGRATION_KEY);
  });

  it('returns false when the migration key is absent', () => {
    assert.equal(isMigrationDone(), false);
  });

  it('returns true after markMigrationDone() is called', () => {
    markMigrationDone();
    assert.equal(isMigrationDone(), true);
  });

  it('markMigrationDone writes "1" to localStorage', () => {
    markMigrationDone();
    assert.equal(localStorageStore.get(BG_MIGRATION_KEY), '1');
  });
});

// ── S4: storePhoto / getPhotoBlob ─────────────────────────────────────────────

describe('S4 — storePhoto / getPhotoBlob', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDb();
    _resetDbForTesting(mockDb);
  });

  after(() => {
    _resetDbForTesting(); // clear cached db reference
  });

  it('stores a photo and retrieves it by photoId', async () => {
    const photoId  = 'test-photo-1';
    const fakeBlob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
    await storePhoto(photoId, fakeBlob, 'image/jpeg', 800, 600);
    const retrieved = await getPhotoBlob(photoId);
    assert.ok(retrieved instanceof Blob || (retrieved && retrieved.constructor.name === 'Blob'));
  });

  it('returns null for a photoId that was never stored', async () => {
    const result = await getPhotoBlob('nonexistent-photo-id');
    assert.equal(result, null);
  });

  it('overwrites an existing photo when storePhoto is called again with the same ID', async () => {
    const photoId = 'overwrite-test';
    const blob1   = new Blob(['version1'], { type: 'image/jpeg' });
    const blob2   = new Blob(['version2'], { type: 'image/jpeg' });
    await storePhoto(photoId, blob1, 'image/jpeg', 100, 100);
    await storePhoto(photoId, blob2, 'image/jpeg', 200, 200);
    const record = mockDb._store.get(photoId);
    assert.ok(record, 'record should exist in the mock store');
    assert.equal(record.width, 200, 'width should reflect the second write');
  });

  it('storePhoto persists mimeType, width, and height alongside blob', async () => {
    const photoId = 'meta-test';
    const blob    = new Blob(['data'], { type: 'image/png' });
    await storePhoto(photoId, blob, 'image/png', 1280, 720);
    const rec = mockDb._store.get(photoId);
    assert.equal(rec.mimeType, 'image/png');
    assert.equal(rec.width,    1280);
    assert.equal(rec.height,   720);
  });
});

// ── S5: deletePhoto / deletePhotos ────────────────────────────────────────────

describe('S5 — deletePhoto / deletePhotos', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDb();
    _resetDbForTesting(mockDb);
  });

  after(() => { _resetDbForTesting(); });

  it('deletePhoto removes the photo from the store', async () => {
    const photoId = 'del-test';
    const blob    = new Blob(['data'], { type: 'image/jpeg' });
    await storePhoto(photoId, blob, 'image/jpeg', 1, 1);
    assert.ok(mockDb._store.has(photoId), 'should exist before deletion');
    await deletePhoto(photoId);
    assert.equal(mockDb._store.has(photoId), false, 'should be gone after deletion');
  });

  it('deletePhoto is a no-op for a photoId that was never stored', async () => {
    // Should not throw
    await deletePhoto('never-existed');
  });

  it('deletePhotos removes all specified IDs', async () => {
    const ids = ['p1', 'p2', 'p3'];
    for (const id of ids) {
      await storePhoto(id, new Blob(['x'], { type: 'image/jpeg' }), 'image/jpeg', 1, 1);
    }
    assert.equal(mockDb._store.size, 3);
    await deletePhotos(['p1', 'p3']);
    assert.equal(mockDb._store.has('p1'), false);
    assert.equal(mockDb._store.has('p3'), false);
    assert.equal(mockDb._store.has('p2'), true, 'p2 should still exist');
  });

  it('deletePhotos with an empty array is a no-op', async () => {
    await storePhoto('keep', new Blob(['x'], { type: 'image/jpeg' }), 'image/jpeg', 1, 1);
    await deletePhotos([]);
    assert.equal(mockDb._store.has('keep'), true);
  });
});

// ── S6: getAllStoredPhotoIds ───────────────────────────────────────────────────

describe('S6 — getAllStoredPhotoIds', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDb();
    _resetDbForTesting(mockDb);
  });

  after(() => { _resetDbForTesting(); });

  it('returns all photoIds currently in the store', async () => {
    await storePhoto('a', new Blob(['x']), 'image/jpeg', 1, 1);
    await storePhoto('b', new Blob(['y']), 'image/jpeg', 1, 1);
    const ids = await getAllStoredPhotoIds();
    assert.ok(ids.includes('a'));
    assert.ok(ids.includes('b'));
    assert.equal(ids.length, 2);
  });

  it('returns an empty array when the store is empty', async () => {
    const ids = await getAllStoredPhotoIds();
    assert.deepEqual(ids, []);
  });
});

// ── S7: createPhotoObjectUrl / revokePhotoObjectUrl ───────────────────────────

describe('S7 — createPhotoObjectUrl / revokePhotoObjectUrl', () => {
  it('createPhotoObjectUrl returns a non-empty string URL', () => {
    const blob = new Blob(['image-data'], { type: 'image/jpeg' });
    const url  = createPhotoObjectUrl(blob);
    assert.equal(typeof url, 'string');
    assert.ok(url.length > 0);
  });

  it('each call to createPhotoObjectUrl returns a unique URL', () => {
    const blob = new Blob(['data'], { type: 'image/jpeg' });
    const url1 = createPhotoObjectUrl(blob);
    const url2 = createPhotoObjectUrl(blob);
    assert.notEqual(url1, url2);
  });

  it('revokePhotoObjectUrl does not throw for an unknown URL', () => {
    // Revoking a URL that was never created is a valid no-op
    revokePhotoObjectUrl('blob:mock://does-not-exist');
  });

  it('revokePhotoObjectUrl removes the URL from active pool', () => {
    const blob = new Blob(['data'], { type: 'image/jpeg' });
    const url  = createPhotoObjectUrl(blob);
    assert.ok(activeObjectUrls.has(url), 'URL should be active before revoke');
    revokePhotoObjectUrl(url);
    assert.equal(activeObjectUrls.has(url), false, 'URL should be gone after revoke');
  });
});

// ── S8: Error-resilience ──────────────────────────────────────────────────────

describe('S8 — getPhotoBlob returns null on IndexedDB error', () => {
  it('returns null rather than throwing when IndexedDB is unavailable', async () => {
    // Simulate DB unavailable by resetting to null (forces re-open via indexedDB global)
    // In a Node.js environment without indexedDB, openPhotoDb() itself would throw.
    // We verify that getPhotoBlob catches all errors and returns null.
    _resetDbForTesting(); // clears cached db → next call will try indexedDB.open()

    // Make indexedDB.open() fail
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = {
      open: () => {
        const req = { result: null, error: new Error('unavailable'), onsuccess: null, onerror: null };
        queueMicrotask(() => req.onerror?.({ target: req }));
        return req;
      },
    };

    const result = await getPhotoBlob('any-id');
    assert.equal(result, null, 'getPhotoBlob must return null on DB error');

    // Restore
    globalThis.indexedDB = origIdb;
    const fresh = createMockDb();
    _resetDbForTesting(fresh);
  });
});
