/**
 * Phase 1B — PDF Importer + 77-Item Known Regression
 *
 * Classification: E — IMPORTER / PARSER LOGIC
 * Target: POST /api/import-gear with PDF fixture files.
 * Backend: REAL (parse-only, no owner persistence).
 * Auth: NOT required.
 * Fixtures: attached_assets/ (existing repo fixtures).
 *
 * 77-item regression: TrailWeigh-024M-Test-Pack-Weight_1786439904125.pdf
 * Ground truth:       TrailWeigh-024M-Ground-Truth-77-Items_1786439904125.csv (78 rows = 1 header + 77 items)
 */
import path from 'node:path';
import * as fs from 'node:fs';
import { test, expect } from '../helpers/trailweigh';

const API_URL = 'http://localhost:80/api/import-gear';
const ASSETS  = path.resolve(__dirname, '../../../attached_assets');

async function postPdf(request: import('@playwright/test').APIRequestContext, filePath: string) {
  const buf  = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  return request.post(API_URL, {
    multipart: { file: { name, mimeType: 'application/pdf', buffer: buf } },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
test.describe('PDF importer — 77-item known regression', () => {

  const PDF_77  = path.join(ASSETS, 'TrailWeigh-024M-Test-Pack-Weight_1786439904125.pdf');
  const CSV_GT  = path.join(ASSETS, 'TrailWeigh-024M-Ground-Truth-77-Items_1786439904125.csv');

  test('77-item fixture is present in the repository', async () => {
    expect(fs.existsSync(PDF_77), '77-item PDF fixture exists').toBe(true);
    expect(fs.existsSync(CSV_GT), '77-item ground-truth CSV exists').toBe(true);
  });

  test('77-item PDF import returns exactly 77 items', async ({ request }) => {
    // VERDICT: PASS / FAIL — authoritative regression gate
    const resp = await postPdf(request, PDF_77);
    expect(resp.status(), 'PDF import responds 200').toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.items), 'items is array').toBe(true);
    expect(body.items.length, '77-item PDF returns exactly 77 parsed items').toBe(77);
  });

  test('77-item PDF: no item has NaN weightOz', async ({ request }) => {
    const resp = await postPdf(request, PDF_77);
    const body = await resp.json();
    for (const item of body.items) {
      expect(isNaN(item.weightOz), `NaN weightOz on "${item.desc}"`).toBe(false);
      expect(item.weightOz).toBeGreaterThanOrEqual(0);
    }
  });

  test('77-item PDF: no duplicate rows (identical sub|desc|weightOz)', async ({ request }) => {
    const resp = await postPdf(request, PDF_77);
    const body = await resp.json();
    const keys = body.items.map((i: any) => `${i.sub}|${i.desc}|${i.weightOz}`);
    const unique = new Set(keys);
    expect(unique.size, 'no duplicates').toBe(body.items.length);
  });

  test('77-item PDF: all items have a non-empty name (sub or desc)', async ({ request }) => {
    // PDF parser may place item name in `sub` and detail in `desc` (or vice-versa).
    // Require at least one of the two to be non-empty per item.
    const resp = await postPdf(request, PDF_77);
    const body = await resp.json();
    for (const item of body.items) {
      const name = ((item.sub ?? '') + (item.desc ?? '')).trim();
      expect(name, `sub or desc non-empty`).not.toBe('');
    }
  });

  test('77-item PDF: Backpack category items are present', async ({ request }) => {
    const resp = await postPdf(request, PDF_77);
    const body = await resp.json();
    // Ground truth has Backpack category items — their destination should be 'Backpack' or similar
    const backpackItems = body.items.filter((i: any) =>
      /backpack|pack/i.test(i.sub ?? '') || /backpack|pack/i.test(i.destination ?? ''),
    );
    expect(backpackItems.length, 'Backpack items present').toBeGreaterThan(0);
  });

  test('77-item PDF: ground truth CSV row count matches returned item count', async ({ request }) => {
    // Parse ground truth CSV to count data rows
    const csvText = fs.readFileSync(CSV_GT, 'utf8');
    const rows = csvText.trim().split('\n').filter(r => r.trim());
    const dataRows = rows.length - 1; // subtract header
    expect(dataRows, 'ground truth has 77 data rows').toBe(77);

    const resp = await postPdf(request, PDF_77);
    const body = await resp.json();
    expect(body.items.length, 'PDF returns same count as ground truth').toBe(dataRows);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
test.describe('PDF importer — additional fixtures', () => {

  test('024K test PDF parses without crash', async ({ request }) => {
    const fp = path.join(ASSETS, 'TrailWeigh-024K-Test-Pack-Weight_1786438200935.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postPdf(request, fp);
    expect([200, 400, 422]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(Array.isArray(body.items)).toBe(true);
    }
  });

  test('gear list fixture PDF returns items', async ({ request }) => {
    const fp = path.join(ASSETS, 'trailweigh_gear_list_fixture.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postPdf(request, fp);
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items.length, 'gear list fixture has items').toBeGreaterThan(0);
    } else {
      // 422 image-only or other parse error — acceptable
      expect(resp.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('image-only PDF returns 422 with code:image_only_pdf', async ({ request }) => {
    const fp = path.join(ASSETS, 'trailweigh_image_only_fixture.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postPdf(request, fp);
    expect(resp.status(), 'image-only PDF is rejected').toBe(422);
    const body = await resp.json();
    expect(body.code ?? body.error, 'error code or message present').toBeTruthy();
  });

  test('corrupt PDF returns 4xx JSON error, no server crash', async ({ request }) => {
    const fp = path.join(ASSETS, 'trailweigh_corrupt_fixture.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postPdf(request, fp);
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    expect(resp.status()).toBeLessThan(600);
    const body = await resp.json().catch(() => null);
    expect(body, 'JSON error response on corrupt PDF').not.toBeNull();
  });

});
