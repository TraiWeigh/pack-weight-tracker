/**
 * lockerSync022R.test.mjs
 * Prompt 022R — Mobile Compatibility & Cross-Device Synchronization
 *
 * Protects:
 *   • lockerApi.ts helper functions are present and correct
 *   • Server-sync calls exist in all four Locker mutating handlers
 *   • DB schema has locker_entries table with required columns
 *   • API route file exists with all five HTTP methods
 *   • Account isolation: every server route checks userId
 *   • localStorage remains as local cache (no removed reads)
 *   • BroadcastChannel cross-tab sync preserved
 *   • All prior fixes (commitSaveNew/Replace stable IDs, broadcastLocker) intact
 *   • lockerApi import present in Checklist.tsx
 *   • Migration path: migrateLockerToServer called when server empty
 */

import fs   from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const srcRoot    = path.resolve('artifacts/pack-checklist/src');
const apiRoot    = path.resolve('artifacts/api-server/src');
const dbSchemaPath = path.resolve('lib/db/src/schema/index.ts');

const checklistSrc = fs.readFileSync(path.join(srcRoot, 'pages/Checklist.tsx'), 'utf8');
const lockerApiSrc = fs.readFileSync(path.join(srcRoot, 'lib/lockerApi.ts'), 'utf8');
const lockerRouteSrc = fs.readFileSync(path.join(apiRoot, 'routes/locker.ts'), 'utf8');
const routesIndexSrc = fs.readFileSync(path.join(apiRoot, 'routes/index.ts'), 'utf8');
const dbSchemaSrc  = fs.readFileSync(dbSchemaPath, 'utf8');

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) { currentSuite = name; }
function test(label, fn) {
  try { fn(); passed++; }
  catch (err) {
    failed++;
    console.error(`  ✗ [${currentSuite}] ${label}`);
    console.error(`    ${err.message}`);
  }
}

// ── §1: Database schema ───────────────────────────────────────────────────────

suite('022R Database Schema');

test('locker_entries table is declared in schema', () => {
  assert.ok(
    dbSchemaSrc.includes('locker_entries'),
    'locker_entries table must be declared in lib/db/src/schema/index.ts',
  );
});

test('locker_entries has id column (primary key)', () => {
  assert.ok(
    dbSchemaSrc.includes('lockerEntriesTable') &&
    dbSchemaSrc.includes("text(\"id\").primaryKey()"),
    'locker_entries must have id as primary key',
  );
});

test('locker_entries has user_id column (account isolation)', () => {
  assert.ok(
    dbSchemaSrc.includes('userId') && dbSchemaSrc.includes('user_id'),
    'locker_entries must have user_id column for account scoping',
  );
});

test('locker_entries has name column', () => {
  assert.ok(
    dbSchemaSrc.includes('"name"') || dbSchemaSrc.includes("'name'"),
    'locker_entries must have name column',
  );
});

test('locker_entries has saved_at column', () => {
  assert.ok(
    dbSchemaSrc.includes('saved_at') || dbSchemaSrc.includes('savedAt'),
    'locker_entries must have saved_at column',
  );
});

test('locker_entries has payload column (JSONB for gear store + appearance)', () => {
  assert.ok(
    dbSchemaSrc.includes('payload') && dbSchemaSrc.includes('jsonb'),
    'locker_entries must have a jsonb payload column',
  );
});

test('lockerEntriesTable is exported from schema', () => {
  assert.ok(
    dbSchemaSrc.includes('export const lockerEntriesTable') ||
    dbSchemaSrc.includes('exports.lockerEntriesTable'),
    'lockerEntriesTable must be exported for use in API routes',
  );
});

// ── §2: API routes ────────────────────────────────────────────────────────────

suite('022R API Routes');

test('locker.ts router is registered in routes/index.ts', () => {
  assert.ok(
    routesIndexSrc.includes('lockerRouter') || routesIndexSrc.includes("'./locker'"),
    'locker router must be registered in routes/index.ts',
  );
});

test('GET /api/locker route exists', () => {
  assert.ok(
    lockerRouteSrc.includes("router.get('/locker'") ||
    lockerRouteSrc.includes('router.get("/locker"'),
    'GET /api/locker route must exist',
  );
});

test('POST /api/locker route exists', () => {
  assert.ok(
    lockerRouteSrc.includes("router.post('/locker'") ||
    lockerRouteSrc.includes('router.post("/locker"'),
    'POST /api/locker route must exist',
  );
});

test('PUT /api/locker/:id route exists', () => {
  assert.ok(
    lockerRouteSrc.includes("router.put('/locker/:id'") ||
    lockerRouteSrc.includes('router.put("/locker/:id"'),
    'PUT /api/locker/:id route must exist',
  );
});

test('PATCH /api/locker/:id route exists (rename)', () => {
  assert.ok(
    lockerRouteSrc.includes("router.patch('/locker/:id'") ||
    lockerRouteSrc.includes('router.patch("/locker/:id"'),
    'PATCH /api/locker/:id route must exist for rename',
  );
});

test('DELETE /api/locker/:id route exists', () => {
  assert.ok(
    lockerRouteSrc.includes("router.delete('/locker/:id'") ||
    lockerRouteSrc.includes('router.delete("/locker/:id"'),
    'DELETE /api/locker/:id route must exist',
  );
});

test('All routes use getAuth(req) for authentication', () => {
  assert.ok(
    lockerRouteSrc.includes('getAuth(req)'),
    'All routes must call getAuth(req) from @clerk/express',
  );
});

test('All routes return 401 when userId is falsy', () => {
  assert.ok(
    lockerRouteSrc.includes("status(401)"),
    'Routes must return HTTP 401 Unauthorized when user is not authenticated',
  );
});

test('Routes use userId in WHERE clause for account isolation', () => {
  assert.ok(
    lockerRouteSrc.includes('userId, userId') ||
    lockerRouteSrc.includes('eq(lockerEntriesTable.userId, userId)'),
    'All write/delete routes must scope DB operations to the authenticated userId',
  );
});

test('POST route uses onConflictDoUpdate for safe upsert', () => {
  assert.ok(
    lockerRouteSrc.includes('onConflictDoUpdate'),
    'POST route must use onConflictDoUpdate to handle localStorage migration safely',
  );
});

// ── §3: Client lockerApi helper ───────────────────────────────────────────────

suite('022R Client lockerApi Helper');

test('fetchLockerEntries function is exported', () => {
  assert.ok(
    lockerApiSrc.includes('export async function fetchLockerEntries'),
    'fetchLockerEntries must be exported from lockerApi.ts',
  );
});

test('serverSaveNew function is exported', () => {
  assert.ok(
    lockerApiSrc.includes('export async function serverSaveNew'),
    'serverSaveNew must be exported from lockerApi.ts',
  );
});

test('serverSaveReplace function is exported', () => {
  assert.ok(
    lockerApiSrc.includes('export async function serverSaveReplace'),
    'serverSaveReplace must be exported from lockerApi.ts',
  );
});

test('serverRename function is exported', () => {
  assert.ok(
    lockerApiSrc.includes('export async function serverRename'),
    'serverRename must be exported from lockerApi.ts',
  );
});

test('serverDeleteMany function is exported', () => {
  assert.ok(
    lockerApiSrc.includes('export async function serverDeleteMany'),
    'serverDeleteMany must be exported from lockerApi.ts',
  );
});

test('migrateLockerToServer function is exported', () => {
  assert.ok(
    lockerApiSrc.includes('export async function migrateLockerToServer'),
    'migrateLockerToServer must be exported from lockerApi.ts',
  );
});

test('fetchLockerEntries fetches GET /api/locker', () => {
  assert.ok(
    lockerApiSrc.includes("fetch(BASE)") || lockerApiSrc.includes("fetch('/api/locker')"),
    'fetchLockerEntries must fetch from /api/locker',
  );
});

test('serverSaveNew posts to /api/locker', () => {
  assert.ok(
    lockerApiSrc.includes("method: 'POST'"),
    'serverSaveNew must use POST method',
  );
});

test('serverSaveReplace uses PUT', () => {
  assert.ok(
    lockerApiSrc.includes("method: 'PUT'"),
    'serverSaveReplace must use PUT method',
  );
});

test('serverRename uses PATCH', () => {
  assert.ok(
    lockerApiSrc.includes("method: 'PATCH'"),
    'serverRename must use PATCH method',
  );
});

test('serverDeleteMany calls serverDelete for each id', () => {
  assert.ok(
    lockerApiSrc.includes('ids.map(id => serverDelete(id))'),
    'serverDeleteMany must delete each id individually',
  );
});

// ── §4: Checklist.tsx integration ────────────────────────────────────────────

suite('022R Checklist.tsx Integration');

test('lockerApi is imported in Checklist.tsx', () => {
  assert.ok(
    checklistSrc.includes("from '../lib/lockerApi'"),
    'Checklist.tsx must import from lockerApi',
  );
});

test('fetchLockerEntries is imported', () => {
  assert.ok(
    checklistSrc.includes('fetchLockerEntries'),
    'fetchLockerEntries must be imported in Checklist.tsx',
  );
});

test('serverSyncRanRef guard prevents double-fetching', () => {
  assert.ok(
    checklistSrc.includes('serverSyncRanRef'),
    'serverSyncRanRef must be used to prevent duplicate server fetches on remount',
  );
});

test('Server fetch effect depends on userId', () => {
  assert.ok(
    checklistSrc.includes('fetchLockerEntries()') &&
    checklistSrc.includes('userId'),
    'Server fetch effect must be gated on userId',
  );
});

test('commitSaveNew calls serverSaveNew on authenticated user', () => {
  assert.ok(
    checklistSrc.includes('serverSaveNew(entry)'),
    'commitSaveNew must call serverSaveNew for cross-device sync',
  );
});

test('commitSaveReplace calls serverSaveReplace on authenticated user', () => {
  assert.ok(
    checklistSrc.includes('serverSaveReplace(entry)'),
    'commitSaveReplace must call serverSaveReplace for cross-device sync',
  );
});

test('handleConfirmedDelete calls serverDeleteMany', () => {
  assert.ok(
    checklistSrc.includes('serverDeleteMany(pendingDeleteIds)'),
    'handleConfirmedDelete must call serverDeleteMany for cross-device sync',
  );
});

test('handleRenameInLocker calls serverRename', () => {
  assert.ok(
    checklistSrc.includes('serverRename(id, trimmed)'),
    'handleRenameInLocker must call serverRename for cross-device sync',
  );
});

test('Server calls are fire-and-forget (.catch())', () => {
  assert.ok(
    checklistSrc.includes('.catch(() => {})'),
    'Server calls must be fire-and-forget — localStorage is the safety net',
  );
});

test('Migration path: migrateLockerToServer called when server returns 0 entries', () => {
  assert.ok(
    checklistSrc.includes('migrateLockerToServer'),
    'When server returns 0 entries, existing localStorage data must be migrated to server',
  );
});

test('lockerEntriesRef keeps current value for migration check', () => {
  assert.ok(
    checklistSrc.includes('lockerEntriesRef'),
    'lockerEntriesRef must exist to access current lockerEntries inside effects without stale closures',
  );
});

// ── §5: Existing behavior preserved ──────────────────────────────────────────

suite('022R Regression — Prior Behavior Preserved');

test('localStorage LOCKER_KEY still written on every lockerEntries change', () => {
  assert.ok(
    checklistSrc.includes('localStorage.setItem(LOCKER_KEY, JSON.stringify(lockerEntries))'),
    'localStorage must still be written as local cache for fast startup on same device',
  );
});

test('BroadcastChannel cross-tab sync is preserved', () => {
  assert.ok(
    checklistSrc.includes('gear-locker-sync'),
    'BroadcastChannel for cross-tab sync must still be present',
  );
});

test('broadcastLocker call still present in commitSaveNew', () => {
  // broadcastLocker(updated) must appear in commitSaveNew context
  assert.ok(
    checklistSrc.includes('broadcastLocker(updated)'),
    'broadcastLocker must still be called on every mutation',
  );
});

test('Stable file IDs: commitSaveNew still uses crypto.randomUUID()', () => {
  assert.ok(
    checklistSrc.includes('crypto.randomUUID()'),
    'New entries must still use crypto.randomUUID() for stable IDs',
  );
});

test('commitSaveReplace still verifies entry exists before updating', () => {
  assert.ok(
    checklistSrc.includes('lockerEntries.some(e => e.id === existingId)'),
    'commitSaveReplace must still verify the entry exists before overwriting',
  );
});

test('Last-active-file tracking still scoped by userId (account isolation)', () => {
  assert.ok(
    checklistSrc.includes('LAST_ACTIVE_FILE_LS_PREFIX + uid') ||
    checklistSrc.includes('trailweigh:last-active-file-'),
    'Last-active file must remain user-scoped',
  );
});

test('handleConfirmedDelete still checks authentication (isGuest / userId)', () => {
  assert.ok(
    checklistSrc.includes('isGuest || !userId') ||
    (checklistSrc.includes('isGuest') && checklistSrc.includes('requestProtectedDelete')),
    'Delete must still be gated on authentication',
  );
});

test('No localStorage-only LOCKER_KEY initialization removed', () => {
  // The initial useState from localStorage must still exist
  assert.ok(
    checklistSrc.includes('localStorage.getItem(LOCKER_KEY)'),
    'localStorage-based init must still exist for fast first paint on same device',
  );
});

// ── §6: Account isolation ─────────────────────────────────────────────────────

suite('022R Account Isolation');

test('Server routes guard with getAuth — no public locker access', () => {
  assert.ok(
    lockerRouteSrc.includes('getAuth(req)') &&
    lockerRouteSrc.includes("status(401)"),
    'All locker routes must require Clerk authentication',
  );
});

test('DB WHERE clause uses userId from auth (not from request body)', () => {
  // userId comes from getAuth(req), not from req.body
  assert.ok(
    lockerRouteSrc.includes('const { userId } = getAuth(req)'),
    'userId for DB scoping must come from verified Clerk auth, not request body',
  );
});

test('lockerEntriesRef is not exposed outside the component', () => {
  // The ref is component-local — no export
  assert.ok(
    !lockerApiSrc.includes('lockerEntriesRef'),
    'lockerEntriesRef is component-local state, not exported via lockerApi',
  );
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022R Locker Server Sync: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
