/**
 * R0090 — right-edge visual correction.
 *
 * Chromium verifies layout safety and alignment only. The attached iPhone
 * screenshot remains the authoritative visual reference for final acceptance.
 */
import { test, expect } from '../helpers/trailweigh';

const GENERAL_INSET = 34;
const WEIGHT_INSET = 44;
const APPBAR_INSET = 16;

type Rect = { left: number; right: number; width: number; height: number };

async function rectOf(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  return page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
  });
}

function expectRightInset(rect: Rect, viewportWidth: number, inset: number, label: string) {
  expect(rect.right, `${label} must remain inside its R0090 right gutter`).toBeLessThanOrEqual(viewportWidth - inset + 1);
}

test.describe('R0090 — right-edge visual correction', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`keeps visible right-side content safe at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await page.goto('/mobile-functional-v3');
      await page.waitForSelector('.tw-v3-root');
      await page.getByTestId('active-list-name').waitFor({ state: 'visible' });

      const root = await rectOf(page, '.tw-v3-root');
      const appBar = await rectOf(page, '[data-testid="app-bar"]');
      const rightmostIcon = await rectOf(page, '[data-testid="appbar-icon-5"]');
      const summary = await rectOf(page, '[data-testid="list-summary-bar"]');
      const categoryCount = await rectOf(page, '[data-testid="summary-category-count"]');
      const selectedStatus = await rectOf(page, '[data-testid="summary-selected-status"]');
      const row = await rectOf(page, '[data-cat="Backpack"]');
      const wedge = await rectOf(page, '[data-testid="cat-header-Backpack"] > button');
      const title = await rectOf(page, '[data-testid="cat-name-Backpack"]');
      const weight = await rectOf(page, '[data-testid="cat-weight-Backpack"]');

      expect(root.width, 'the full shell width must remain unchanged').toBe(viewport.width);
      expect(appBar.width, 'the AppBar must remain full width').toBe(viewport.width);
      expect(appBar.height, 'the AppBar height must remain unchanged').toBe(52);
      expectRightInset(rightmostIcon, viewport.width, APPBAR_INSET, 'rightmost AppBar icon');
      expectRightInset(categoryCount, viewport.width, GENERAL_INSET, 'Summary category count');
      expectRightInset(selectedStatus, viewport.width, GENERAL_INSET, 'Summary Selected status');
      expectRightInset(weight, viewport.width, WEIGHT_INSET, 'category weight');

      expect(summary.height, 'R0088 Summary height must remain restored').toBeGreaterThanOrEqual(88);
      expect(summary.height, 'R0088 Summary height must remain restored').toBeLessThan(89);
      expect(row.left, 'category rows must remain full-width from the left edge').toBe(0);
      expect(row.width, 'category rows must remain full-width').toBe(viewport.width);
      expect(wedge.left, 'left wedges must remain anchored').toBe(0);
      expect(wedge.width, 'left wedge width must remain unchanged').toBe(72);
      expect(row.height, 'category row height must remain unchanged').toBeGreaterThanOrEqual(64);
      expect(row.height, 'category row height must remain unchanged').toBeLessThanOrEqual(65);
      expect(title.right, 'category title must not overlap the deeper weight column').toBeLessThanOrEqual(weight.left - 8);

      const weightStyle = await page.getByTestId('cat-weight-Backpack').evaluate(element => getComputedStyle(element).whiteSpace);
      expect(weightStyle, 'weight values must stay on one line').toBe('nowrap');

      const widths = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(widths.client).toBe(viewport.width);
      expect(widths.document).toBeLessThanOrEqual(viewport.width);
      expect(widths.body).toBeLessThanOrEqual(viewport.width);
      expect(errors.pageErrors).toEqual([]);
    });
  }
});