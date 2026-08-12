/**
 * Share-link routes.
 *
 * POST /api/links — create a share record, return a short 10-char hex token.
 *   • payload.type === 'live-locker' (025P+, authenticated):
 *       Stores only { type, ownerId } — no gear data, no snapshot.
 *       ownerId is extracted from the Clerk JWT; any client-supplied ownerId is ignored.
 *   • all other payloads (frozen snapshot, legacy):
 *       Stored as-is for backward compatibility.
 *
 * GET /api/links/:id — retrieve/resolve a share record.
 *   • live-locker records: reads CURRENT Locker entries for ownerId from the DB,
 *       maps to a public Review DTO (no private fields), includes source version.
 *   • frozen snapshots: returns stored payload unchanged (backward compat).
 */

import { Router } from 'express';
import { randomBytes } from 'crypto';
import { db, shareLinksTable, lockerEntriesTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { getAuth } from '@clerk/express';

const router = Router();

// ── POST /api/links ────────────────────────────────────────────────────────────

router.post('/links', async (req, res) => {
  const { payload } = req.body as { payload?: unknown };
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'payload is required' });
  }

  const incoming = payload as Record<string, unknown>;

  // Live-locker share (025P): requires an authenticated owner.
  // ownerId is extracted from Clerk JWT — NEVER trusted from the client body.
  if (incoming.type === 'live-locker') {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required for live sharing' });
    }
    const id = randomBytes(5).toString('hex');
    await db.insert(shareLinksTable).values({
      id,
      payload: { type: 'live-locker', ownerId: userId } as unknown as Record<string, unknown>,
    });
    return res.json({ id });
  }

  // Frozen snapshot / legacy — store as-is (backward compat for existing clients).
  const id = randomBytes(5).toString('hex');
  await db.insert(shareLinksTable).values({ id, payload });
  return res.json({ id });
});

// ── GET /api/links/:id ─────────────────────────────────────────────────────────

router.get('/links/:id', async (req, res) => {
  const { id } = req.params;
  const rows = await db
    .select()
    .from(shareLinksTable)
    .where(eq(shareLinksTable.id, id))
    .limit(1);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const stored = rows[0].payload as Record<string, unknown>;

  // ── Live-locker resolver (025P) ──────────────────────────────────────────────
  if (stored.type === 'live-locker') {
    const ownerId = stored.ownerId as string;

    // Authorization boundary: only files belonging to ownerId are returned.
    // No other owner's data, no sibling collections, no private account info.
    const lockerRows = await db
      .select()
      .from(lockerEntriesTable)
      .where(eq(lockerEntriesTable.userId, ownerId));

    // Sort most-recently-saved first (mirrors GET /api/locker order).
    lockerRows.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    // Source version — changes on add, delete, rename (name), or content save (savedAt).
    // NOTE: PATCH (rename-only) updates name but NOT savedAt; include name in fingerprint.
    const sourceVersion = JSON.stringify(
      lockerRows
        .map(r => ({ i: r.id, n: r.name, t: r.savedAt.getTime() }))
        .sort((a, b) => a.i.localeCompare(b.i)),
    );

    // Map to public Review DTO — only review-visible fields, no private account data.
    const files = lockerRows.map(r => {
      const p = (typeof r.payload === 'object' && r.payload !== null
        ? r.payload : {}) as Record<string, unknown>;
      return {
        id:              r.id,
        name:            r.name,
        savedAt:         r.savedAt.getTime(),
        store:           p.store ?? { items: {}, order: [], meta: {} },
        background:      p.background ?? null,
        bgFade:          typeof p.bgFade          === 'number' ? p.bgFade          : 1,
        bgTone:          typeof p.bgTone          === 'string' ? p.bgTone          : 'light',
        bgSize:          typeof p.bgSize          === 'string' ? p.bgSize          : 'cover',
        chartPaletteKey: typeof p.chartPaletteKey === 'string' ? p.chartPaletteKey : undefined,
        barColor:        typeof p.barColor        === 'string' ? p.barColor        : '',
        barFont:         typeof p.barFont         === 'string' ? p.barFont         : '',
        barTextColor:    typeof p.barTextColor    === 'string' ? p.barTextColor    : '',
        barTransparency: typeof p.barTransparency === 'number' ? p.barTransparency : 1,
      };
    });

    return res.json({ type: 'live-locker', files, sourceVersion });
  }

  // ── Frozen snapshot (backward compat for pre-025P links) ────────────────────
  return res.json({ payload: rows[0].payload });
});

export default router;
