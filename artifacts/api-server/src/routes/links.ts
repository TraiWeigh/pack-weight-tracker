import { Router } from 'express';
import { randomBytes } from 'crypto';
import { db, shareLinksTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/links — store pack snapshot, return a short ID
router.post('/links', async (req, res) => {
  const { payload } = req.body as { payload?: unknown };
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'payload is required' });
  }
  const id = randomBytes(5).toString('hex'); // 10-char hex, e.g. "a3f9c02b1e"
  await db.insert(shareLinksTable).values({ id, payload });
  return res.json({ id });
});

// GET /api/links/:id — retrieve pack snapshot by short ID
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
  return res.json({ payload: rows[0].payload });
});

export default router;
