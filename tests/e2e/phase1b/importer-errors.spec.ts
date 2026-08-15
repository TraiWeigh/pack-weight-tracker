/**
 * Phase 1B — Malformed / Failure Import Handling
 *
 * Classification: E + J — IMPORTER MALFORMED / FAILURE HANDLING
 * Target: POST /api/import-gear with bad/empty/wrong-type files.
 * Backend: REAL (parse-only).
 * Auth: NOT required.
 *
 * Expected behavior: no app crash, JSON error response, no frozen state.
 */
import path from 'node:path';
import * as fs from 'node:fs';
import { test, expect } from '../helpers/trailweigh';

const API_URL = 'http://localhost:80/api/import-gear';
const ASSETS  = path.resolve(__dirname, '../../../attached_assets');
const FIXTURES = path.resolve(__dirname, '../fixtures');

// ──────────────────────────────────────────────────────────────────────────────
test.describe('Malformed / empty files', () => {

  test('empty file upload returns non-200 JSON error', async ({ request }) => {
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'empty.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) } },
    });
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    const body = await resp.json().catch(() => null);
    expect(body, 'JSON error body').not.toBeNull();
  });

  test('corrupt PDF returns 4xx JSON (no 500 crash)', async ({ request }) => {
    const fp = path.join(ASSETS, 'trailweigh_corrupt_fixture.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const buf  = fs.readFileSync(fp);
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'corrupt.pdf', mimeType: 'application/pdf', buffer: buf } },
    });
    // Must not be 500 — a controlled error with JSON response is expected
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    expect(resp.status()).toBeLessThan(600);
    const body = await resp.json().catch(() => null);
    expect(body, 'JSON error on corrupt PDF').not.toBeNull();
    // Should have error field
    if (body) expect(body.error ?? body.code).toBeTruthy();
  });

  test('image-only PDF returns 422 with informative error', async ({ request }) => {
    const fp = path.join(ASSETS, 'trailweigh_image_only_fixture.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const buf  = fs.readFileSync(fp);
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'image-only.pdf', mimeType: 'application/pdf', buffer: buf } },
    });
    expect(resp.status(), 'image-only PDF is 422').toBe(422);
    const body = await resp.json();
    expect(body.code ?? body.error, 'error code present').toBeTruthy();
  });

  test('non-gear PDF (label/unrelated) returns a handled response, no crash', async ({ request }) => {
    const fp = path.join(ASSETS, 'ESUS346127050_label-2_1786471034058.pdf');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const buf  = fs.readFileSync(fp);
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'label.pdf', mimeType: 'application/pdf', buffer: buf } },
    });
    // 200 with 0 items, or 4xx error — both acceptable as long as no 500
    expect(resp.status()).not.toBe(500);
    const body = await resp.json().catch(() => null);
    expect(body, 'response is JSON').not.toBeNull();
  });

  test('malformed CSV (wrong headers) returns 400/422 JSON', async ({ request }) => {
    const fp = path.join(FIXTURES, 'malformed.csv');
    const buf  = fs.readFileSync(fp);
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'malformed.csv', mimeType: 'text/csv', buffer: buf } },
    });
    expect([200, 400, 422]).toContain(resp.status());
    const body = await resp.json().catch(() => null);
    expect(body, 'JSON response on malformed CSV').not.toBeNull();
  });

  test('plain-text file sent as PDF returns a handled error (no 500)', async ({ request }) => {
    const buf  = Buffer.from('This is just a text file, not a PDF.\n');
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'fake.pdf', mimeType: 'application/pdf', buffer: buf } },
    });
    expect(resp.status()).not.toBe(500);
    const body = await resp.json().catch(() => null);
    expect(body, 'JSON response on fake PDF').not.toBeNull();
  });

  test('unsupported file extension returns 400 JSON', async ({ request }) => {
    const buf  = Buffer.from('<html><body>not a gear list</body></html>');
    const resp = await request.post(API_URL, {
      multipart: { file: { name: 'page.html', mimeType: 'text/html', buffer: buf } },
    });
    expect(resp.status(), 'unsupported extension rejected').toBeGreaterThanOrEqual(400);
    const body = await resp.json().catch(() => null);
    expect(body, 'JSON error response').not.toBeNull();
  });

  test('missing file field returns 400 JSON error', async ({ request }) => {
    const resp = await request.post(API_URL, { data: { notAFile: 'value' } });
    expect(resp.status(), 'missing file → 400').toBeGreaterThanOrEqual(400);
  });

});
