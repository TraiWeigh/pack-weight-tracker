/**
 * R0089 — checklist right-side content inset.
 *
 * Chromium validates layout geometry only. It does not reproduce iPhone Safari
 * browser chrome; user-device validation remains the final authority.
 */
import { test, expect, gotoDemo } from '../helpers/trailweigh';

const RIGHT_INSET = 24;

type Rect = { left: number; right: number; top: number; bottom: number; width: number; height: number };

async function rectOf(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  return page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
  });
}

function expectInset(rect: Rect, width: number, label: string) {
  expect(rect.right, `${label} must use the shared right content gutter`).toBeLessThanOrEqual(width - RIGHT_INSET + 1);
}

async function openBackpackItem(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open Backpack category' }).click();
  const item = page.getByRole('button', { name: /Osprey Atmos 65 — expand details/i });
  await expect(item).toBeVisible();
  await item.click();
  await expect(page.getByTestId('expanded-weight-input')).toBeVisible();
}

async function createLocationForFirstItem(page: import('@playwright/test').Page) {
  await openBackpackItem(page);
  await page.getByTestId('item-location-select').selectOption('__create__');
  await expect(page.getByTestId('create-location-dialog')).toBeVisible();
  await page.getByTestId('create-location-input').fill('R0089 Test Location');
  await page.getByTestId('create-location-save').click();
  await expect(page.getByTestId('create-location-dialog')).toBeHidden();
}

test.describe('R0089 — shared checklist right-side inset', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
  ]) {
    test(`keeps resting right-side checklist content inset at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await gotoDemo(page);

      const root = await rectOf(page, '.tw-v3-root');
      const row = await rectOf(page, '[data-cat="Backpack"]');
      const wedge = await rectOf(page, '[data-testid="cat-header-Backpack"] > button');
      const summary = await rectOf(page, '[data-testid="list-summary-bar"]');
      const summaryMetrics = await rectOf(page, '[data-testid="summary-right-metrics"]');
      const summaryChevron = await rectOf(page, '[data-testid="summary-expand-collapse"]');
      const weight = await rectOf(page, '[data-testid="cat-weight-Backpack"]');
      const title = await rectOf(page, '[data-testid="cat-name-Backpack"]');
      const nav = await rectOf(page, '[data-testid="bottom-nav"]');

      expect(root.width, 'the app shell must keep the viewport width').toBe(viewport.width);
      expect(row.left, 'full-width category row stays at the left edge').toBe(0);
      expect(row.width, 'full-width category row stays unchanged').toBe(viewport.width);
      expect(wedge.left, 'left wedge remains in its original position').toBe(0);
      expect(wedge.width, 'left wedge width remains unchanged').toBe(72);
      expect(row.height, 'R0087 category row density remains unchanged').toBeGreaterThanOrEqual(64);
      expect(row.height, 'R0087 category row density remains unchanged').toBeLessThanOrEqual(65);
      expect(summary.top, 'restored Summary remains fixed below the AppBar').toBe(52);
      expect(summary.height, 'R0088 restored Summary height remains unchanged').toBeGreaterThanOrEqual(88);
      expect(summary.height, 'R0088 restored Summary height remains unchanged').toBeLessThan(89);
      expect(nav.height, 'Bottom Box Groups height remains unchanged').toBe(58);
      expect(nav.bottom, 'Bottom Box Groups remain fixed to the viewport bottom').toBeLessThanOrEqual(viewport.height + 1);

      expectInset(summaryMetrics, viewport.width, 'Summary category/selected metrics');
      expectInset(summaryChevron, viewport.width, 'Summary accordion chevron');
      expectInset(weight, viewport.width, 'Category weight');
      expect(title.right, 'category title must not overlap the inset weight').toBeLessThanOrEqual(weight.left - 8);

      await openBackpackItem(page);
      const itemQuantity = await rectOf(page, '[data-testid="item-quantity-b1"]');
      const weightInput = await rectOf(page, '[data-testid="expanded-weight-input"]');
      const qtySelect = await rectOf(page, '[data-testid="expanded-qty-select"]');
      const moveSelect = await rectOf(page, '[data-testid="expanded-move-select"]');
      const locationSelect = await rectOf(page, '[data-testid="item-location-select"]');
      expectInset(itemQuantity, viewport.width, 'Collapsed item quantity');
      expectInset(weightInput, viewport.width, 'Expanded item weight input');
      expectInset(qtySelect, viewport.width, 'Expanded item quantity control');
      expectInset(moveSelect, viewport.width, 'Expanded item move control');
      expectInset(locationSelect, viewport.width, 'Expanded item location control');

      const widths = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(widths.clientWidth).toBe(viewport.width);
      expect(widths.documentWidth).toBeLessThanOrEqual(viewport.width);
      expect(widths.bodyWidth).toBeLessThanOrEqual(viewport.width);
      expect(errors.pageErrors).toEqual([]);
    });
  }

  test('uses the same right inset for a Location header', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await createLocationForFirstItem(page);

    const close = page.getByRole('button', { name: /^Close .+ category$/ }).first();
    if (await close.isVisible().catch(() => false)) await close.click();
    await page.getByTestId('filter-control').click();
    await page.getByTestId('filter-option-location').click();
    const locationName = page.locator('[data-testid^="loc-name-"]').first();
    await expect(locationName).toBeVisible();
    expectInset(await rectOf(page, '[data-testid^="loc-name-"]'), 402, 'Location header name');
    expect(errors.pageErrors).toEqual([]);
  });
});