import { test as base, expect, type Page } from '@playwright/test';

/** Collected runtime error evidence for one test. */
export interface ErrorLog {
  pageErrors: string[];
  failedRequests: string[];
  serverErrors: string[]; // HTTP >= 500
  consoleErrors: string[];
}

/**
 * Extended test fixture that records pageerror / requestfailed / 5xx /
 * console.error evidence for every test. Assert with `expectClean(errors)`
 * at the end of a test (or make targeted assertions for expected failures).
 */
export const test = base.extend<{ errors: ErrorLog }>({
  errors: async ({ page }, use) => {
    const log: ErrorLog = { pageErrors: [], failedRequests: [], serverErrors: [], consoleErrors: [] };
    page.on('pageerror', (e) => log.pageErrors.push(e.message));
    page.on('requestfailed', (r) => log.failedRequests.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText ?? 'unknown'}`));
    page.on('response', (r) => { if (r.status() >= 500) log.serverErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
    page.on('console', (m) => { if (m.type() === 'error') log.consoleErrors.push(m.text()); });
    await use(log);
  },
});

export { expect };

/**
 * Known-benign dev-environment noise that must not fail core tests.
 * Keep this list narrow and documented:
 * - net::ERR_ABORTED — requests canceled by navigation/reload, not app faults.
 * - Vite HMR/websocket churn in the dev server.
 */
const BENIGN_REQUEST_FAILURE = /net::ERR_ABORTED|\/@vite|vite.*(ws|hmr)|websocket/i;

/** All collected runtime errors must be empty (after the narrow allowlist). */
export function expectClean(errors: ErrorLog) {
  expect(errors.pageErrors, 'uncaught page errors').toEqual([]);
  expect(errors.serverErrors, 'unexpected HTTP 5xx responses').toEqual([]);
  expect(errors.consoleErrors, 'console.error output').toEqual([]);
  const realFailures = errors.failedRequests.filter((f) => !BENIGN_REQUEST_FAILURE.test(f));
  expect(realFailures, 'failed network requests (allowlist-filtered)').toEqual([]);
}

/** Navigate to the isolated demo route and wait for full mount. */
export async function gotoDemo(page: Page) {
  const resp = await page.goto('/mobile-functional-v3');
  expect(resp, 'initial navigation response').not.toBeNull();
  expect(resp!.ok(), `document request failed: HTTP ${resp?.status()}`).toBe(true);
  await expect(page.getByText('LIST SUMMARY')).toBeVisible();
  await page.waitForLoadState('networkidle');
  return resp!;
}

/** Read the LIST SUMMARY card counters. */
export async function summary(page: Page) {
  const selText = (await page.getByText(/^\d+ Selected$/).textContent()) ?? '';
  const notText = (await page.getByText(/^\d+ Not Selected$/).textContent()) ?? '';
  const catText = (await page.getByText(/^\d+ categor(y|ies)$/).textContent()) ?? '';
  const selected = parseInt(selText, 10);
  const notSelected = parseInt(notText, 10);
  const categories = parseInt(catText, 10);
  return { selected, notSelected, categories, items: selected + notSelected };
}

/** Open the full-screen menu (hamburger). */
export async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeVisible();
}

/** Close whatever overlay is showing via its Back to list control. */
export async function backToList(page: Page) {
  const back = page.getByRole('button', { name: 'Back to list' }).first();
  if (await back.isVisible().catch(() => false)) await back.click();
  await expect(page.getByText('LIST SUMMARY')).toBeVisible();
}

/** Click a menu action then return to the list if the menu remains open. */
export async function menuAction(page: Page, name: string | RegExp) {
  await openMenu(page);
  await page.getByRole('button', { name }).click();
  // Some actions keep the menu open; normalize state back to the list view.
  const back = page.getByRole('button', { name: 'Back to list' }).first();
  if (await back.isVisible().catch(() => false)) await back.click();
}

/** The open/close wedge for a category (name reflects current state). */
export function wedge(page: Page, cat: string) {
  return page.getByRole('button', { name: new RegExp(`^(Open|Close) ${escapeRe(cat)} category$`) });
}

export async function openCategory(page: Page, cat: string) {
  // Tolerate an already-open category (e.g. after a menu/overlay round-trip).
  if (await page.getByRole('button', { name: `Close ${cat} category` }).isVisible().catch(() => false)) return;
  await page.getByRole('button', { name: `Open ${cat} category` }).click();
  await expect(page.getByRole('button', { name: `Close ${cat} category` })).toBeVisible();
}

export async function isCategoryOpen(page: Page, cat: string) {
  return page.getByRole('button', { name: `Close ${cat} category` }).isVisible().catch(() => false);
}

/** Open the Category Options sheet for a category. */
export async function openCategoryOptions(page: Page, cat: string) {
  await page.getByRole('button', { name: `Category options for ${cat}` }).click();
  await expect(page.getByText('Category Options')).toBeVisible();
}

/** Add a category through the bottom "Add Category" flow. Returns without asserting success. */
export async function addCategory(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add a new category to this list' }).click();
  await page.getByLabel('New category name').fill(name);
  await page.getByRole('button', { name: 'Confirm add category' }).click();
}

/** First item row (expand-details button) currently visible in an open category. */
export function itemRows(page: Page) {
  return page.getByRole('button', { name: / — (expand|collapse) details$/ });
}

export function itemCheckboxes(page: Page) {
  return page.getByRole('checkbox', { name: /(selected for checklist|not selected)$/ });
}

/** Ensure an item's detail panel is open (tolerates already-open state). */
export async function openItemDetail(page: Page, name: string) {
  const expand = page.getByRole('button', { name: `${name} — expand details` });
  if (await expand.isVisible().catch(() => false)) await expand.click();
  await expect(page.getByRole('button', { name: `${name} — collapse details` })).toBeVisible();
}

/** Extract an item's display name from its row aria-label. */
export async function itemNameOf(rowAriaLabel: string) {
  return rowAriaLabel.replace(/ — (expand|collapse) details$/, '');
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Seed data facts for the unauthenticated demo list (fresh context). */
export const SEED = {
  listName: 'Demo Pack List',
  categories: ['Backpack', 'Clothing', 'Toiletries', 'Electronics', 'Shelter', 'Kitchen'],
  items: 21,
  selected: 16,
  notSelected: 5,
  backpackSelectedOz: '72.50 oz',
};
