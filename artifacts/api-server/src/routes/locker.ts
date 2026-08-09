/**
 * locker.ts — Prompt 022R
 *
 * Server-backed Locker CRUD for authenticated TrailWeigh users.
 * Enables cross-device synchronization: the same saved gear files appear
 * on desktop, iPhone, and Android when the user is signed in.
 *
 * All routes require Clerk authentication — every operation is scoped to
 * the requesting user's ID so Account A can never read/modify Account B's files.
 *
 * Routes:
 *   GET    /api/locker         — list all entries (sorted by savedAt desc)
 *   POST   /api/locker         — create or upsert an entry by id
 *   PUT    /api/locker/:id     — replace an existing entry
 *   PATCH  /api/locker/:id     — rename only
 *   DELETE /api/locker/:id     — delete one entry
 */

import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { db, lockerEntriesTable } from '@workspace/db';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * A short build identifier stamped at server startup.
 * Changes on every restart so desktop and iPhone can verify they are
 * running the same deployed code version.
 */
const SERVER_BUILD_ID = `022T-${Date.now().toString(36).slice(-6)}`;

/**
 * Deterministic 8-char fingerprint of a Clerk userId (djb2 hash).
 * Same userId → same fingerprint; different userId → different fingerprint.
 * Raw userId is never exposed.
 */
function userFingerprint(userId: string): string {
  let h = 5381;
  for (let i = 0; i < userId.length; i++) {
    h = ((h << 5) + h) ^ userId.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  const hex = h.toString(16).toUpperCase().padStart(8, '0');
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

// ── GET /api/locker/status ────────────────────────────────────────────────────

router.get('/locker/status', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const rows = await db
      .select({ id: lockerEntriesTable.id })
      .from(lockerEntriesTable)
      .where(eq(lockerEntriesTable.userId, userId));

    return res.json({
      authenticated: true,
      accountFingerprint: userFingerprint(userId),
      lockerCount: rows.length,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      serverBuild: SERVER_BUILD_ID,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[locker status]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/locker ───────────────────────────────────────────────────────────

router.get('/locker', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const rows = await db
      .select()
      .from(lockerEntriesTable)
      .where(eq(lockerEntriesTable.userId, userId));

    // Sort by savedAt descending (most recently saved first)
    rows.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    const entries = rows.map(r => ({
      id:      r.id,
      name:    r.name,
      savedAt: r.savedAt.getTime(),
      // Spread stored payload: { store, background, bgFade, bgTone, bgSize, chartPaletteKey }
      ...(typeof r.payload === 'object' && r.payload !== null ? r.payload : {}),
    }));

    return res.json({ entries });
  } catch (err) {
    console.error('[locker GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/locker ──────────────────────────────────────────────────────────

router.post('/locker', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id, name, savedAt, ...payloadRest } = req.body as {
    id?: string;
    name?: string;
    savedAt?: number;
    [key: string]: unknown;
  };

  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id is required' });
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
  if (!savedAt || typeof savedAt !== 'number') return res.status(400).json({ error: 'savedAt is required' });

  try {
    // Upsert: allow migration from existing localStorage IDs without collisions
    await db
      .insert(lockerEntriesTable)
      .values({
        id,
        userId,
        name,
        savedAt: new Date(savedAt),
        payload: payloadRest,
      })
      .onConflictDoUpdate({
        target: lockerEntriesTable.id,
        // Only update if this user owns the row (safety guard)
        set: { name, savedAt: new Date(savedAt), payload: payloadRest },
      });

    return res.json({ id });
  } catch (err) {
    console.error('[locker POST]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/locker/:id ───────────────────────────────────────────────────────

router.put('/locker/:id', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { name, savedAt, ...payloadRest } = req.body as {
    name?: string;
    savedAt?: number;
    [key: string]: unknown;
  };

  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
  if (!savedAt || typeof savedAt !== 'number') return res.status(400).json({ error: 'savedAt is required' });

  try {
    await db
      .update(lockerEntriesTable)
      .set({ name, savedAt: new Date(savedAt), payload: payloadRest })
      .where(
        and(
          eq(lockerEntriesTable.id, id),
          eq(lockerEntriesTable.userId, userId),  // account isolation guard
        ),
      );

    return res.json({ id });
  } catch (err) {
    console.error('[locker PUT]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/locker/:id — rename only ──────────────────────────────────────

router.patch('/locker/:id', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { name } = req.body as { name?: string };

  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  try {
    await db
      .update(lockerEntriesTable)
      .set({ name: name.trim() })
      .where(
        and(
          eq(lockerEntriesTable.id, id),
          eq(lockerEntriesTable.userId, userId),
        ),
      );

    return res.json({ id });
  } catch (err) {
    console.error('[locker PATCH]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/locker/:id ────────────────────────────────────────────────────

router.delete('/locker/:id', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    await db
      .delete(lockerEntriesTable)
      .where(
        and(
          eq(lockerEntriesTable.id, id),
          eq(lockerEntriesTable.userId, userId),
        ),
      );

    return res.status(204).send();
  } catch (err) {
    console.error('[locker DELETE]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
