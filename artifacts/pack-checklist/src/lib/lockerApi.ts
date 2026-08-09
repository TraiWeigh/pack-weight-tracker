/**
 * lockerApi.ts — Prompt 022R (revised 022S)
 *
 * Client-side helpers for the server-backed Locker API.
 *
 * 022S changes:
 *  - credentials: 'include' on every fetch (ensures Clerk session cookies
 *    are forwarded through the Replit proxy and any cross-origin path)
 *  - safeFetch() centralises error detection and sanitised console logging
 *  - mergeLockerEntries() is a pure, exported function (testable without a browser)
 *  - migrateLockerToServer() returns { uploaded, failed } so callers can
 *    react to partial migration failures instead of silently discarding them
 */

import type { LockerEntry } from '../components/LockerPanel';

const BASE = '/api/locker';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Wraps fetch() with:
 *  - credentials: 'include' (always send session cookies, even through proxies)
 *  - response.ok check (fetch resolves for 4xx/5xx — those are still errors)
 *  - sanitised error logging (never logs tokens, cookies, or private data)
 *
 * Throws an Error on non-2xx responses or network failures.
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const resp = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (!resp.ok) {
    // Read a small excerpt for diagnostics; strip anything that looks like a token.
    const snippet = await resp.text().catch(() => '');
    const sanitised = snippet
      .slice(0, 200)
      .replace(/["']?(token|jwt|cookie|auth|key|secret)["']?\s*[:=]\s*\S+/gi, '[REDACTED]');
    console.error(
      `[lockerApi] ${options?.method ?? 'GET'} ${url} → HTTP ${resp.status}`,
      sanitised || '(empty body)',
    );
    throw new Error(`[lockerApi] HTTP ${resp.status} from ${url}`);
  }

  return resp;
}

// ── Merge algorithm (pure — no side effects, no I/O) ─────────────────────────

/**
 * Merge server-side and local Locker entries by stable ID.
 *
 * Rules (deterministic, no data loss):
 *   SERVER-ONLY id  → keep it; add to local cache
 *   LOCAL-ONLY  id  → keep it; upload to server
 *   SAME id on both → keep whichever has a newer savedAt timestamp;
 *                     if equal, server wins (it was already persisted);
 *                     if local is newer, upload local version to server
 *
 * Returns:
 *   merged    — all entries sorted by savedAt desc (the definitive list)
 *   localOnly — entries that exist only locally (or are locally newer);
 *               caller should POST these to the server
 */
export function mergeLockerEntries(
  serverEntries: LockerEntry[],
  localEntries:  LockerEntry[],
): { merged: LockerEntry[]; localOnly: LockerEntry[] } {
  const serverMap = new Map(serverEntries.map(e => [e.id, e]));
  const mergedMap = new Map<string, LockerEntry>(serverMap);
  const localOnly: LockerEntry[] = [];

  for (const localEntry of localEntries) {
    const serverEntry = serverMap.get(localEntry.id);
    if (!serverEntry) {
      // Local-only: add to merged and mark for upload
      mergedMap.set(localEntry.id, localEntry);
      localOnly.push(localEntry);
    } else if (localEntry.savedAt > serverEntry.savedAt) {
      // Local is genuinely newer: use local version, upload it to update server
      mergedMap.set(localEntry.id, localEntry);
      localOnly.push(localEntry); // POST with upsert updates the server row
    }
    // Server version is same age or newer → already in mergedMap, no upload needed
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => b.savedAt - a.savedAt);
  return { merged, localOnly };
}

// ── Public API helpers ────────────────────────────────────────────────────────

/**
 * Fetch all Locker entries for the authenticated user from the server.
 * Throws on network failure or non-2xx response (including 401 Unauthorized).
 */
export async function fetchLockerEntries(): Promise<LockerEntry[]> {
  const resp = await safeFetch(BASE);
  const data = (await resp.json()) as { entries?: LockerEntry[] };
  return Array.isArray(data.entries) ? data.entries : [];
}

/**
 * Create (or upsert by id) a Locker entry on the server.
 * The server uses ON CONFLICT DO UPDATE so re-uploading an existing id is safe.
 */
export async function serverSaveNew(entry: LockerEntry): Promise<void> {
  const { id, name, savedAt, ...payload } = entry;
  await safeFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, savedAt, ...payload }),
  });
}

/**
 * Replace an existing Locker entry with new content (same id).
 */
export async function serverSaveReplace(entry: LockerEntry): Promise<void> {
  const { id, name, savedAt, ...payload } = entry;
  await safeFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, savedAt, ...payload }),
  });
}

/**
 * Rename a Locker entry on the server.
 */
export async function serverRename(id: string, name: string): Promise<void> {
  await safeFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

/**
 * Delete a single Locker entry from the server.
 * 404 is treated as success (entry already gone).
 */
export async function serverDelete(id: string): Promise<void> {
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!resp.ok && resp.status !== 404) {
    console.error(`[lockerApi] DELETE ${BASE}/${id} → HTTP ${resp.status}`);
    throw new Error(`[lockerApi] HTTP ${resp.status} from DELETE ${BASE}/${id}`);
  }
}

/**
 * Delete multiple Locker entries from the server in parallel.
 */
export async function serverDeleteMany(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => serverDelete(id)));
}

// ── Migration ─────────────────────────────────────────────────────────────────

export interface MigrationResult {
  /** IDs successfully uploaded to the server */
  uploaded: string[];
  /** IDs that failed to upload (remain in localStorage — will retry next session) */
  failed: string[];
}

/**
 * Upload local-only Locker entries to the server.
 *
 * 022S behaviour (not fire-and-forget):
 *  - Uploads entries in series to avoid overloading the server.
 *  - Returns { uploaded, failed } so the caller can react to partial failures.
 *  - Failed entries remain in localStorage and will be re-tried on the next sync.
 *  - Never deletes or modifies local entries on failure.
 */
export async function migrateLockerToServer(
  entries: LockerEntry[],
): Promise<MigrationResult> {
  const uploaded: string[] = [];
  const failed:   string[] = [];

  for (const entry of entries) {
    try {
      await serverSaveNew(entry);
      uploaded.push(entry.id);
    } catch (err) {
      console.error(
        `[lockerApi] Migration failed for entry "${entry.name}" (${entry.id}):`,
        err instanceof Error ? err.message : String(err),
      );
      failed.push(entry.id);
    }
  }

  return { uploaded, failed };
}
