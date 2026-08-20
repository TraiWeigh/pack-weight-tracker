/**
 * R0091 — header, Summary, and Bottom Box Groups refinement.
 *
 * Chromium verifies geometry and interaction safety only. The attached iPhone
 * screenshot remains the authoritative visual reference for final acceptance.
 */
import { test, expect } from '../helpers/trailweigh';

const WEIGHT_INSET = 44; // preserved from R0090
const APPBAR_INSET = 16; // preserved from R0090
const NEXT_CONTENT_INSET = 16; // R0091 internal visual shift target

type Rect = { left: number; right: number; width: number; height: number };

async function rectOf(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  return page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
  });
}

test.describe('R0091 — header, Summary, and Bottom Box Groups refinement', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`keeps the refined right-side geometry safe at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await page.goto('/mobile-functional-v3');
      await page.waitForSelector('.tw-v3-root');

      const root = await rectOf(page, '.tw-v3-root');
      const appBar = await rectOf(page, '[data-testid="app-bar"]');
      const hamburger = await rectOf(page, '[data-testid="hamburger-btn"]');
      const logoGroup = await rectOf(page, '[data-testid="appbar-logo-group"]');
      const rightmostIcon = await rectOf(page, '[data-testid="appbar-icon-5"]');
      const summary = await rectOf(page, '[data-testid="list-summary-bar"]');
      const categoryCount = await rectOf(page, '[data-testid="summary-category-count"]');
      const selectedStatus = await rectOf(page, '[data-testid="summary-selected-status"]');
      const nextContent = await rectOf(page, '[data-group-active="true"] [data-testid="bottom-next-chevron-content"]');
      const nav = await rectOf(page, '[data-testid="bottom-nav"]');
      const weight = await rectOf(page, '[data-testid="cat-weight-Backpack"]');
      const row = await rectOf(page, '[data-cat="Backpack"]');
      const wedge = await rectOf(page, '[data-testid="cat-header-Backpack"] > button');

      expect(root.width, 'full shell width must remain unchanged').toBe(viewport.width);
      expect(appBar.width, 'AppBar must remain full width').toBe(viewport.width);
      expect(appBar.height, 'AppBar height must remain unchanged').toBe(52);
      expect(hamburger.left, 'hamburger must retain the AppBar left inset').toBe(8);
      expect(hamburger.right, 'hamburger hit target must remain unchanged').toBe(52);
      expect(logoGroup.left, 'logo/title group must start directly after the hamburger target').toBe(52);
      expect(logoGroup.left - hamburger.right, 'hamburger-to-logo gap must be reduced').toBe(0);
      expect(rightmostIcon.right, 'rightmost AppBar icon must keep its R0090 safe gutter').toBeLessThanOrEqual(viewport.width - APPBAR_INSET + 1);

      expect(summary.height, 'R0088 Summary height must remain restored').toBeGreaterThanOrEqual(88);
      expect(summary.height, 'R0088 Summary height must remain restored').toBeLessThan(89);
      expect(categoryCount.right, 'Summary category count must be fully visible').toBeLessThanOrEqual(viewport.width - 34 + 1);
      expect(selectedStatus.right, 'Summary Selected status must be fully visible').toBeLessThanOrEqual(viewport.width - 34 + 1);
      expect(Math.abs(categoryCount.right - selectedStatus.right), 'Summary metric lines must share a right edge').toBeLessThanOrEqual(1);

      expect(weight.right, 'R0090 category weight inset must remain preserved').toBeLessThanOrEqual(viewport.width - WEIGHT_INSET + 1);
      expect(weight.right, 'R0090 weight position must remain meaningfully inset').toBeGreaterThan(viewport.width - WEIGHT_INSET - 2);
      expect(weight.width, 'category weight must remain rendered').toBeGreaterThan(0);
      expect(row.width, 'category row must remain full-width').toBe(viewport.width);
      expect(row.height, 'category row height must remain unchanged').toBeGreaterThanOrEqual(64);
      expect(row.height, 'category row height must remain unchanged').toBeLessThanOrEqual(65);
      expect(wedge.left, 'left wedge must remain anchored').toBe(0);
      expect(wedge.width, 'left wedge width must remain unchanged').toBe(72);

      expect(nav.width, 'Bottom Box Groups must remain full-width').toBe(viewport.width);
      expect(nextContent.right, 'Next chevron content must have new right clearance').toBeLessThanOrEqual(viewport.width - NEXT_CONTENT_INSET + 1);
      expect(nextContent.right, 'Next chevron content must remain inside the Bottom Box Groups').toBeLessThan(nav.right);

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

  test('preserves Bottom Box Groups Next navigation after the visual shift', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await page.goto('/mobile-functional-v3');
    await page.waitForSelector('.tw-v3-root');

    const activeGroup = () => page.locator('[data-testid="bottom-nav"] [data-group-active="true"]');
    await expect(activeGroup()).toHaveAttribute('data-group-idx', '0');
    await activeGroup().getByTestId('bottom-next-chevron').click();
    await expect(activeGroup()).toHaveAttribute('data-group-idx', '1');
    await activeGroup().getByTestId('bottom-next-chevron').click();
    await expect(activeGroup()).toHaveAttribute('data-group-idx', '2');
    expect(errors.pageErrors).toEqual([]);
  });
});