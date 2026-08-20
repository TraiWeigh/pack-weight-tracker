/**
 * R0092 — Safari-safe Bottom Box Groups lock and right-side master alignment.
 *
 * Chromium validates the invariant geometry and normal document-scroll behavior.
 * Kevin's actual iPhone Safari test remains authoritative for browser-chrome
 * animation and final visual acceptance.
 */
import { test, expect, addCategory } from '../helpers/trailweigh';

type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

async function rectOf(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  return page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  });
}

test.describe('R0092 — lock Bottom Box Groups and align to weight master line', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`preserves the master line and protected geometry at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await page.goto('/mobile-functional-v3');
      await page.waitForSelector('.tw-v3-root');

      const root = await rectOf(page, '.tw-v3-root');
      const appBar = await rectOf(page, '[data-testid="app-bar"]');
      const hamburger = await rectOf(page, '[data-testid="hamburger-btn"]');
      const headerGroup = await rectOf(page, '[data-testid="appbar-nonhamburger-group"]');
      const terminalBox = await rectOf(page, '[data-testid="appbar-icon-5"]');
      const summary = await rectOf(page, '[data-testid="list-summary-bar"]');
      const categoryCount = await rectOf(page, '[data-testid="summary-category-count"]');
      const selectedStatus = await rectOf(page, '[data-testid="summary-selected-status"]');
      const weight = await rectOf(page, '[data-testid="cat-weight-Backpack"]');
      const row = await rectOf(page, '[data-cat="Backpack"]');
      const wedge = await rectOf(page, '[data-testid="cat-header-Backpack"] > button');
      const nav = await rectOf(page, '[data-testid="bottom-nav"]');

      expect(root.width, 'the app shell must stay full width').toBe(viewport.width);
      expect(appBar.height, 'AppBar height must remain protected').toBe(52);
      expect(hamburger.left, 'hamburger left edge must remain protected').toBe(8);
      expect(hamburger.right, 'hamburger hit target must remain protected').toBe(52);

      // The terminal box icon is the feasible header anchor for the far-right
      // master line: the left TrailWeigh mark cannot share that x-coordinate
      // without overlapping the protected hamburger target.
      expect(headerGroup.left, 'non-hamburger AppBar group must begin after hamburger').toBe(hamburger.right);
      expect(headerGroup.right, 'complete non-hamburger AppBar group must end on master line')
        .toBeCloseTo(weight.right, 0);
      expect(terminalBox.right, 'terminal AppBar box icon must end on master line')
        .toBeCloseTo(weight.right, 0);
      expect(categoryCount.right, '"categories" must end on master line')
        .toBeCloseTo(weight.right, 0);
      expect(selectedStatus.right, '"Selected" must end on master line')
        .toBeCloseTo(weight.right, 0);

      expect(summary.height, 'R0088 Summary height must remain protected').toBeGreaterThanOrEqual(88);
      expect(summary.height, 'R0088 Summary height must remain protected').toBeLessThan(89);
      expect(weight.right, 'approved R0090 weight position must remain preserved')
        .toBeCloseTo(viewport.width - 44, 0);
      expect(row.height, 'category row height must remain protected').toBeGreaterThanOrEqual(64);
      expect(row.height, 'category row height must remain protected').toBeLessThanOrEqual(65);
      expect(wedge.left, 'wedge must remain left-anchored').toBe(0);
      expect(wedge.width, 'wedge width must remain protected').toBe(72);
      expect(nav.width, 'Bottom Box Groups must stay full width').toBe(viewport.width);
      expect(nav.height, 'Bottom Box Groups height must remain protected').toBe(58);

      const viewportData = await page.evaluate(() => {
        const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
        const navStyle = getComputedStyle(nav);
        return ({
        footerPositioning: nav.getAttribute('data-footer-positioning'),
        footerPosition: navStyle.position,
        footerBottom: navStyle.bottom,
        footerTransform: navStyle.transform,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        });
      });
      expect(viewportData.footerPositioning, 'R0093 footer must use stable fixed positioning').toBe('fixed-static');
      expect(viewportData.footerPosition, 'footer must remain CSS fixed').toBe('fixed');
      expect(viewportData.footerBottom, 'footer must have a static bottom offset').toBe('0px');
      expect(viewportData.footerTransform, 'footer must not use a transform for positioning').toBe('none');
      expect(viewportData.documentWidth, 'document must not horizontally overflow').toBeLessThanOrEqual(viewport.width);
      expect(viewportData.bodyWidth, 'body must not horizontally overflow').toBeLessThanOrEqual(viewport.width);
      expect(errors.pageErrors).toEqual([]);

      if (viewport.width === 402 && viewport.height === 714) {
        await page.screenshot({ path: 'screenshots/r0092-master-line-402x714.png', fullPage: false });
      }
    });
  }

  test('keeps the Bottom Box Groups viewport-stable while document content scrolls and clears the final row', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await page.goto('/mobile-functional-v3');
    await page.waitForSelector('.tw-v3-root');

    // Add enough normal categories to require document scrolling without touching
    // the protected long-category item viewport.
    for (const suffix of ['A', 'B', 'C', 'D']) {
      await addCategory(page, `R0092 Scroll ${suffix}`);
    }

    const before = await rectOf(page, '[data-testid="bottom-nav"]');
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await page.screenshot({ path: 'screenshots/r0092-before-scroll-402x714.png', fullPage: false });
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(100);

    const after = await rectOf(page, '[data-testid="bottom-nav"]');
    const finalRow = await rectOf(page, '[data-cat="R0092 Scroll D"]');
    await page.screenshot({ path: 'screenshots/r0092-after-scroll-402x714.png', fullPage: false });
    const scroll = await page.evaluate(() => ({
      y: window.scrollY,
      max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      rootPaddingBottom: getComputedStyle(document.querySelector('.tw-v3-root')!).paddingBottom,
    }));

    expect(scroll.y, 'normal document scroll must remain available').toBeGreaterThan(beforeScroll + 50);
    expect(scroll.max, 'scenario must have a meaningful document scroll range').toBeGreaterThan(50);
    expect(Math.abs(after.top - before.top), 'Bottom Box Groups top must remain stable during document scroll').toBeLessThanOrEqual(1);
    expect(Math.abs(after.bottom - before.bottom), 'Bottom Box Groups bottom must remain stable during document scroll').toBeLessThanOrEqual(1);
    expect(finalRow.bottom, 'the final category row must clear the locked Bottom Box Groups').toBeLessThanOrEqual(after.top + 1);
    expect(Number.parseFloat(scroll.rootPaddingBottom), 'root content reservation must include the fixed bar').toBeGreaterThanOrEqual(after.height);
    expect(errors.pageErrors).toEqual([]);
  });
});