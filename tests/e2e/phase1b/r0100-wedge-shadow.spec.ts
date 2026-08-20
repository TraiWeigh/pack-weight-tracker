/**
 * R0100 — subtle colored wedge shadow regression coverage.
 *
 * Verifies the shadow belongs to the clipped wedge button only and that the
 * R0098/R0097 geometry remains unchanged at the required mobile viewports.
 */
import { test, expect } from '../helpers/trailweigh';

const VIEWPORTS = [
  { width: 402, height: 714 },
  { width: 402, height: 754 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

for (const viewport of VIEWPORTS) {
  test(`R0100 keeps wedge-only shadow and shell geometry at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
    await page.setViewportSize(viewport);
    await page.goto('/mobile-functional-v3');
    await page.waitForSelector('[data-testid="main-scroll"]');

    const metrics = await page.evaluate(() => {
      const rect = (selector: string) => {
        const el = document.querySelector(selector) as HTMLElement;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right, width: r.width };
      };
      const wedges = Array.from(document.querySelectorAll<HTMLElement>(
        '[data-cat] [data-testid^="cat-header-"] > button',
      ));
      const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'));
      const firstWedge = wedges[0];
      const secondWedge = wedges[1];
      const firstRow = rows[0];
      const weight = document.querySelector<HTMLElement>('[data-cat] [data-testid^="cat-header-"] > div > div:last-child');
      const firstWedgeRect = firstWedge.getBoundingClientRect();
      const secondWedgeRect = secondWedge.getBoundingClientRect();
      return {
        wedgeCount: wedges.length,
        wedgeFilter: getComputedStyle(firstWedge).filter,
        wedgeBoxShadow: getComputedStyle(firstWedge).boxShadow,
        rowBoxShadow: getComputedStyle(firstRow).boxShadow,
        wedge: {
          first: { ...rect('[data-cat] [data-testid^="cat-header-"] > button') },
          secondTop: secondWedgeRect.top,
          firstBottom: firstWedgeRect.bottom,
        },
        rowHeight: firstRow.getBoundingClientRect().height,
        weightRight: weight?.getBoundingClientRect().right ?? null,
        shell: {
          app: rect('[data-testid="app-bar"]'),
          summary: rect('[data-testid="list-summary-bar"]'),
          filter: rect('[data-testid="filter-bar"]'),
          main: rect('[data-testid="main-scroll"]'),
          nav: rect('[data-testid="bottom-nav"]'),
        },
        rootWidth: document.querySelector<HTMLElement>('.tw-v3-root')!.getBoundingClientRect().width,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(metrics.wedgeCount).toBeGreaterThan(1);
    expect(metrics.wedgeFilter).toContain('drop-shadow');
    expect(metrics.wedgeFilter).toContain('rgba(0, 0, 0, 0.1)');
    expect(metrics.wedgeBoxShadow).toBe('none');
    expect(metrics.rowBoxShadow).toContain('0px 3px 10px');
    expect(metrics.wedge.first.width).toBe(72);
    expect(metrics.wedge.first.height).toBe(64);
    expect(metrics.wedge.first.left).toBe(0);
    expect(metrics.wedge.first.right).toBe(72);
    expect(metrics.wedge.secondTop - metrics.wedge.firstBottom).toBe(1);
    expect(metrics.rowHeight).toBe(65);
    expect(metrics.weightRight).toBe(viewport.width - 44);
    expect(metrics.rootWidth).toBe(viewport.width);
    expect(metrics.documentWidth).toBe(viewport.width);
    expect(metrics.shell.app.height).toBe(52);
    expect(metrics.shell.summary.height).toBeCloseTo(88.25, 1);
    expect(metrics.shell.filter.height).toBe(50);
    expect(metrics.shell.nav.height).toBe(58);
    expect(metrics.shell.app.top).toBe(0);
    expect(metrics.shell.nav.bottom).toBe(viewport.height);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.serverErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);

    if (viewport.width === 402 && viewport.height === 714) {
      await page.screenshot({
        path: 'reports/r0100/screenshots/01-wedge-shadow-402x714.png',
        fullPage: false,
      });
    }
  });
}