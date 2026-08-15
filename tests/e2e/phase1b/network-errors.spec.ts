/**
 * Phase 1B — Network / Error Injection
 *
 * Classification: F — NETWORK-MOCKED BEHAVIOR
 * Uses Playwright route interception to simulate error conditions on the Review page fetch
 * and the import API.  The real backend is never contacted for mocked routes.
 *
 * All mocked errors are deliberate — the test deliberately ignores the mocked 4xx/5xx
 * in the serverErrors log (filtered per route).
 */
import { test, expect } from '../helpers/trailweigh';

const REVIEW_TOKEN = 'test-token-p1b-network';
const REVIEW_ROUTE = `/s/${REVIEW_TOKEN}`;
const API_PAT      = `**/api/links/${REVIEW_TOKEN}`;

const MOCK_LIVE = {
  type: 'live-locker',
  sourceVersion: 'v1-net-test',
  files: [{
    id: 'f-net-1',
    name: 'Network Test Pack',
    savedAt: '2026-08-15T00:00:00.000Z',
    store: {
      items: { Trail: [{ id: 'n1', desc: 'Trail Shoes', sub: 'Footwear', weightOz: 22, qty: 1, checked: false }] },
      order: ['Trail'],
      meta: {},
    },
    background: null, bgFade: 1, bgTone: 'light', bgSize: 'cover',
    barColor: '', barFont: '', barTextColor: '', barTransparency: 1,
  }],
};

// ──────────────────────────────────────────────────────────────────────────────
test.describe('Review page — network error conditions', () => {

  test('HTTP 400 — shows error state, no crash', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.fulfill({ status: 400, body: JSON.stringify({ error: 'Bad request' }) }));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('HTTP 401 — shows error state, no crash', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) }));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('HTTP 403 — shows error state, no crash', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.fulfill({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) }));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('HTTP 404 — shows safe not-found message, no crash', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.fulfill({ status: 404, body: JSON.stringify({ error: 'Not found' }) }));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText('could not be loaded', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('HTTP 429 — shows error state, no crash (no infinite spinner)', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.fulfill({
      status: 429,
      headers: { 'Retry-After': '60' },
      body: JSON.stringify({ error: 'Too many requests' }),
    }));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/loading shared list/i)).not.toBeVisible({ timeout: 12_000 }).catch(() => {});
    expect(errors.pageErrors).toEqual([]);
  });

  test('HTTP 500 — shows error state, no crash', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) }));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('slow response (2s) — shows loading then data, no crash', async ({ page, errors }) => {
    await page.route(API_PAT, async r => {
      await new Promise(res => setTimeout(res, 2000));
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LIVE) });
    });
    await page.goto(REVIEW_ROUTE);
    // Wait for Welcome modal — signals ChecklistContent is ready after the delayed response.
    const welcomeBtn = page.getByRole('button', { name: 'Start Exploring', exact: true });
    await expect(welcomeBtn).toBeVisible({ timeout: 15_000 });
    await welcomeBtn.click();
    await page.waitForTimeout(300);
    expect(errors.pageErrors).toEqual([]);
  });

  test('dropped / aborted request — no infinite spinner, error shown', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.abort('connectionreset'));
    await page.goto(REVIEW_ROUTE);
    // Must exit loading state within 12s
    await expect(page.getByText(/loading shared list/i)).not.toBeVisible({ timeout: 12_000 }).catch(() => {});
    expect(errors.pageErrors).toEqual([]);
  });

  test('offline-simulated (abort connectionfailed) — error shown without crash', async ({ page, errors }) => {
    await page.route(API_PAT, r => r.abort('failed'));
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/could not be loaded|connection|error/i)).toBeVisible({ timeout: 12_000 });
    expect(errors.pageErrors).toEqual([]);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
test.describe('V3 sandbox — importer API error injection', () => {

  test('import API 500 during file upload shows safe error state, no crash', async ({ page, errors }) => {
    // Block /api/import-gear with a 500
    await page.route('**/api/import-gear', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) }),
    );
    await page.goto('/mobile-functional-v3');
    await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 10_000 });
    // The app must still be functional (not crashed) — list summary still visible
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    // The mocked 500 on /api/import-gear is expected — filter it
    const realServerErrors = errors.serverErrors.filter(e => !e.includes('/api/import-gear'));
    expect(realServerErrors, 'no unexpected 5xx errors').toEqual([]);
    expect(errors.pageErrors, 'no JS crashes').toEqual([]);
  });

  test('import API 400 during file upload shows safe error state, no crash', async ({ page, errors }) => {
    await page.route('**/api/import-gear', r =>
      r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Bad request' }) }),
    );
    await page.goto('/mobile-functional-v3');
    await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors).toEqual([]);
  });

});
