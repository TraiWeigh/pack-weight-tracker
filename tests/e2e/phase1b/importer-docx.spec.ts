/**
 * Phase 1B — DOCX Importer
 *
 * Classification: E — IMPORTER / PARSER LOGIC
 * Target: POST /api/import-gear with DOCX fixture files.
 * Backend: REAL (parse-only).
 * Auth: NOT required.
 * Fixtures: attached_assets/*.docx
 */
import path from 'node:path';
import * as fs from 'node:fs';
import { test, expect } from '../helpers/trailweigh';

const API_URL = 'http://localhost:80/api/import-gear';
const ASSETS  = path.resolve(__dirname, '../../../attached_assets');

async function postDocx(request: import('@playwright/test').APIRequestContext, filePath: string) {
  const buf  = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  return request.post(API_URL, {
    multipart: {
      file: {
        name,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: buf,
      },
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
test.describe('DOCX importer — structured fixture', () => {

  test('document-style DOCX returns 200 with items', async ({ request }) => {
    const fp = path.join(ASSETS, '03_document_style_pack_list_1786443199277.docx');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postDocx(request, fp);
    expect(resp.status(), 'document DOCX returns 200').toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.items), 'items is array').toBe(true);
    expect(body.items.length, 'document DOCX has items').toBeGreaterThan(0);
  });

  test('document-style DOCX: no item has NaN weightOz', async ({ request }) => {
    const fp = path.join(ASSETS, '03_document_style_pack_list_1786443199277.docx');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postDocx(request, fp);
    if (resp.status() !== 200) return;
    const body = await resp.json();
    for (const item of body.items) {
      expect(isNaN(item.weightOz), `NaN weightOz on "${item.desc}"`).toBe(false);
    }
  });

  test('document-style DOCX: items have non-empty desc', async ({ request }) => {
    const fp = path.join(ASSETS, '03_document_style_pack_list_1786443199277.docx');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postDocx(request, fp);
    if (resp.status() !== 200) return;
    const body = await resp.json();
    for (const item of body.items) {
      expect((item.desc ?? '').trim(), 'non-empty desc').not.toBe('');
    }
  });

});

test.describe('DOCX importer — plain bold category labels', () => {

  test('plain-bold-headings DOCX (12 items) returns 200', async ({ request }) => {
    const fp = path.join(ASSETS, '10_TrailWeigh_DOCX_Plain_Bold_Category_Labels_12_Items_1786473910898.docx');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postDocx(request, fp);
    expect(resp.status(), 'plain bold DOCX returns 200').toBe(200);
    const body = await resp.json();
    expect(body.items.length, '12-item DOCX returns 12 items').toBe(12);
  });

  test('plain-bold-headings DOCX: no duplicate rows', async ({ request }) => {
    const fp = path.join(ASSETS, '10_TrailWeigh_DOCX_Plain_Bold_Category_Labels_12_Items_1786473910898.docx');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postDocx(request, fp);
    if (resp.status() !== 200) return;
    const body = await resp.json();
    const keys = body.items.map((i: any) => `${i.sub}|${i.desc}|${i.weightOz}`);
    expect(new Set(keys).size, 'no duplicates').toBe(body.items.length);
  });

});

test.describe('DOCX importer — bullet list fixture', () => {

  test('bullet-list DOCX (12 items) returns 200', async ({ request }) => {
    const fp = path.join(ASSETS, '11_TrailWeigh_DOCX_Bullet_List_12_Items_1786474939741.docx');
    if (!fs.existsSync(fp)) { test.skip(); return; }
    const resp = await postDocx(request, fp);
    expect(resp.status(), 'bullet list DOCX returns 200').toBe(200);
    const body = await resp.json();
    expect(body.items.length, 'bullet list DOCX has items').toBeGreaterThan(0);
  });

});
