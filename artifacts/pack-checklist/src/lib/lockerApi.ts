/**
 * lockerApi.ts — Prompt 022R
 *
 * Client-side helpers for the server-backed Locker API.
 * These functions mirror the localStorage operations in Checklist.tsx
 * and are called alongside them so every mutation is persisted to both
 * the local cache (for fast startup on the same device) and the server
 * (for cross-device sync).
 *
 * All functions are fire-and-forget from the caller's perspective —
 * they reject with an error that the caller can .catch(() => {}) if
 * a network failure is acceptable (localStorage is the safety net).
 */

import type { LockerEntry } from '../components/LockerPanel';

const BASE = '/api/locker';

/**
 * Fetch all saved Locker entries for the authenticated user.
 * Returns entries sorted by savedAt descending (server-side sort).
 */
export async function fetchLockerEntries(): Promise<LockerEntry[]> {
  const resp = await fetch(BASE);
  if (!resp.ok) {
    throw new Error(`[lockerApi] fetchLockerEntries failed: ${resp.status}`);
  }
  const data = (await resp.json()) as { entries: LockerEntry[] };
  return data.entries;
}

/**
 * Create a new Locker entry on the server.
 * Called alongside commitSaveNew in Checklist.tsx.
 */
export async function serverSaveNew(entry: LockerEntry): Promise<void> {
  const { id, name, savedAt, ...payload } = entry;
  const resp = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, savedAt, ...payload }),
  });
  if (!resp.ok) {
    throw new Error(`[lockerApi] serverSaveNew failed: ${resp.status}`);
  }
}

/**
 * Replace (update) an existing Locker entry on the server.
 * Called alongside commitSaveReplace in Checklist.tsx.
 */
export async function serverSaveReplace(entry: LockerEntry): Promise<void> {
  const { id, name, savedAt, ...payload } = entry;
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, savedAt, ...payload }),
  });
  if (!resp.ok) {
    throw new Error(`[lockerApi] serverSaveReplace failed: ${resp.status}`);
  }
}

/**
 * Rename a Locker entry on the server.
 * Called alongside handleRenameInLocker in Checklist.tsx.
 */
export async function serverRename(id: string, name: string): Promise<void> {
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!resp.ok) {
    throw new Error(`[lockerApi] serverRename failed: ${resp.status}`);
  }
}

/**
 * Delete a single Locker entry from the server.
 */
export async function serverDelete(id: string): Promise<void> {
  const resp = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  // 204 No Content is the success response; 404 is also acceptable (already gone)
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`[lockerApi] serverDelete failed: ${resp.status}`);
  }
}

/**
 * Delete multiple Locker entries from the server in parallel.
 * Called alongside handleConfirmedDelete in Checklist.tsx.
 */
export async function serverDeleteMany(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => serverDelete(id)));
}

/**
 * Push all local localStorage LockerEntries to the server (one-time migration).
 * Called when the server returns 0 entries but localStorage has entries.
 * After migration, subsequent sessions on any device will load from the server.
 */
export async function migrateLockerToServer(entries: LockerEntry[]): Promise<void> {
  // Push entries in series to avoid overloading the server with a large batch
  for (const entry of entries) {
    try {
      await serverSaveNew(entry);
    } catch {
      // Skip failed entries — they remain in localStorage and will be re-migrated
      // on a future session if the server sync succeeds.
    }
  }
}
