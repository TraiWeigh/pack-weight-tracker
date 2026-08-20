/**
 * R0087 — mobile screen-efficiency regression coverage.
 *
 * Chromium verifies CSS geometry and interaction safety. It does not reproduce
 * iPhone Safari browser chrome; Kevin's device remains the final authority.
 */
import { test, expect, gotoDemo, addCategory } from '../helpers/trailweigh';

type DensityMetrics = {
  viewportWidth: number;
  appBar: { top: number; bottom: number; height: number } | null;
  summary: { top: number; bottom: number; height: number } | null;
  nav: { top: number; bottom: number; height: number } | null;
  contentHeight: number;
  completeRows: number;
  partialRows: number;
  rowHeights: number[];
  documentWidth: number;
  bodyWidth: number;
};

async function densityMetrics(page: import('@playwright/test').Page): Promise<DensityMetrics> {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { top: value.top, bottom: value.bottom, height: value.height };
    };
    const summary = rect('[data-testid="list-summary-bar"]');
    const nav = rect('[data-testid="bottom-nav"]');
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'))
      .map(element => element.getBoundingClientRect());
    // The fixed Summary's fractional pixel edge can overlap the category border
    // by 0.25px. Treat a one-pixel edge tolerance as visually complete.
    const edgeTolerance = 1;
    const inContent = (row: DOMRect) => summary && nav && row.bottom > summary.bottom && row.top < nav.top;
    const complete = (row: DOMRect) => summary && nav
      && row.top >= summary.bottom - edgeTolerance
      && row.bottom <= nav.top + edgeTolerance;
    return {
      viewportWidth: window.innerWidth,
      appBar: rect('[data-testid="app-bar"]'),
      summary,
      nav,
      contentHeight: summary && nav ? nav.top - summary.bottom : 0,
      completeRows: rows.filter(complete).length,
      partialRows: rows.filter(row => inContent(row) && !complete(row)).length,
      rowHeights: rows.map(row => row.height),
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    };
  });
}

test.describe('R0087 — mobile screen efficiency', () => {
  for (const height of [714, 754]) {
    test(`fits eight complete category rows at 402×${height} without changing fixed layers`, async ({ page, errors }) => {
      await page.setViewportSize({ width: 402, height });
      await gotoDemo(page);

      // The demo starts with six categories. Add two through normal UI behavior
      // to measure the content capacity of a realistically longer checklist.
      await addCategory(page, `Density ${height} A`);
      await addCategory(page, `Density ${height} B`);

      const metrics = await densityMetrics(page);
      expect(metrics.viewportWidth).toBe(402);
      expect(metrics.appBar).not.toBeNull();
      expect(metrics.summary).not.toBeNull();
      expect(metrics.nav).not.toBeNull();

      expect(metrics.appBar!.top, 'AppBar remains fixed at the viewport top').toBe(0);
      expect(metrics.appBar!.height, 'AppBar height must remain protected').toBe(52);
      expect(metrics.summary!.top, 'Summary remains directly below AppBar').toBe(52);
      expect(metrics.summary!.height, 'Summary compacts only its internal padding').toBeLessThanOrEqual(77);
      expect(metrics.nav!.bottom, 'Bottom Box Groups remain fixed to viewport bottom').toBeLessThanOrEqual(height + 1);
      expect(metrics.nav!.height, 'Bottom Box Groups height remains protected').toBe(58);

      expect(metrics.contentHeight, 'usable checklist area must increase to at least 527px at the shorter target height').toBeGreaterThanOrEqual(
        height === 714 ? 527 : 567,
      );
      expect(metrics.completeRows, 'eight categories must fit completely in the usable checklist area').toBe(8);
      expect(metrics.partialRows, 'the compact list should not leave a clipped eighth row').toBe(0);
      expect(metrics.rowHeights.every(value => value >= 64 && value <= 65), 'category rows remain comfortable 64px mobile targets').toBe(true);
      expect(metrics.documentWidth).toBeLessThanOrEqual(402);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(402);

      const firstWeight = page.getByText('72.50 oz', { exact: true });
      const weightBox = await firstWeight.boundingBox();
      expect(weightBox, 'first category weight must render').not.toBeNull();
      expect(weightBox!.x + weightBox!.width, 'right-edge category weight must remain inside the viewport').toBeLessThanOrEqual(402);

      const firstCategoryName = page.getByTestId('cat-name-Backpack');
      await expect(firstCategoryName).toContainText('Backpack');
      const categoryStyles = await firstCategoryName.evaluate(element => {
        const title = element.firstElementChild;
        const style = title ? getComputedStyle(title) : null;
        return {
          minHeight: getComputedStyle(element).minHeight,
          overflow: style?.overflow,
          textOverflow: style?.textOverflow,
        };
      });
      expect(categoryStyles.minHeight).toBe('44px');
      expect(categoryStyles.overflow).toBe('hidden');
      expect(categoryStyles.textOverflow).toBe('ellipsis');
      expect(errors.pageErrors).toEqual([]);
    });
  }

  test('keeps category interaction and the Home fixed hero usable after compaction', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);

    await page.getByRole('button', { name: 'Open Backpack category' }).click();
    await expect(page.getByRole('button', { name: 'Close Backpack category' })).toBeVisible();

    await page.getByTestId('hamburger-btn').click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    const hero = page.getByTestId('home-hero');
    await expect(hero).toBeVisible();
    const homeState = await hero.evaluate(element => ({
      position: getComputedStyle(element).position,
      top: element.getBoundingClientRect().top,
      height: element.getBoundingClientRect().height,
    }));
    expect(homeState.position).toBe('fixed');
    expect(homeState.top).toBe(52);
    expect(homeState.height).toBeGreaterThan(0);
    expect(errors.pageErrors).toEqual([]);
  });
});