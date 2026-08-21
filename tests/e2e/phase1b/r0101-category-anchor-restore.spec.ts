/**
 * R0101 — any category anchors beneath the locked Filter and restores the
 * outer category scroller's pre-open position on close.
 */
import { test, expect, gotoDemo, expectClean } from '../helpers/trailweigh';

type Viewport = { width: number; height: number };

for (const viewport of [
  { width: 402, height: 714 },
  { width: 402, height: 754 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
] satisfies Viewport[]) {
  test(`R0101 anchors a short final category and restores scroll at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
    await page.setViewportSize(viewport);
    await gotoDemo(page);
    await expect(page.getByTestId('filter-bar')).toBeVisible();

    const before = await page.evaluate(() => {
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
      const kitchen = document.querySelector('[data-cat="Kitchen"]') as HTMLElement;
      return {
        scrollTop: main.scrollTop,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
        kitchenTop: kitchen.getBoundingClientRect().top,
      };
    });

    await page.getByRole('button', { name: 'Open Kitchen category' }).click();
    await expect(page.getByTestId('active-category-bar')).toBeVisible();
    await expect(page.getByTestId('filter-bar')).toBeVisible();

    const anchored = await page.waitForFunction(() => {
      const filter = document.querySelector('[data-testid="filter-bar"]')?.getBoundingClientRect();
      const active = document.querySelector('[data-testid="active-category-bar"]')?.getBoundingClientRect();
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement | null;
      return !!filter && !!active && !!main &&
        Math.abs(active.top - filter.bottom) <= 1 &&
        main.scrollTop > 0;
    }, undefined, { timeout: 3000 });
    expect(await anchored).toBeTruthy();

    const openState = await page.evaluate(() => {
      const filter = document.querySelector('[data-testid="filter-bar"]')!.getBoundingClientRect();
      const active = document.querySelector('[data-testid="active-category-bar"]')!.getBoundingClientRect();
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
      const style = getComputedStyle(main);
      return {
        filterTop: filter.top,
        filterBottom: filter.bottom,
        activeTop: active.top,
        scrollTop: main.scrollTop,
        overflowY: style.overflowY,
        trailingSpace: document.querySelector('[data-testid="category-trailing-scroll-space"]')?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(openState.activeTop).toBeCloseTo(openState.filterBottom, 0);
    expect(openState.scrollTop).toBeGreaterThan(0);
    expect(openState.overflowY).toBe('auto');
    expect(openState.trailingSpace).toBe(560);

    // The short category remains anchored while the dedicated outer category
    // scroller moves through the middle region.
    await page.evaluate(() => {
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
      main.scrollTop += 60;
      main.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(80);
    const duringScroll = await page.getByTestId('active-category-bar').evaluate(el => ({
      top: el.getBoundingClientRect().top,
      filterBottom: document.querySelector('[data-testid="filter-bar"]')!.getBoundingClientRect().bottom,
    }));
    expect(duringScroll.top).toBeCloseTo(duringScroll.filterBottom, 0);

    await page.getByRole('button', { name: 'Close Kitchen category' }).click();
    await expect(page.getByTestId('filter-bar')).toBeVisible();
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => ({
      scrollTop: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
      windowScroll: window.scrollY,
      documentScroll: document.documentElement.scrollTop,
      bodyScroll: document.body.scrollTop,
    }));
    expect(after.scrollTop).toBeCloseTo(before.scrollTop, 0);
    expect(after.windowScroll).toBe(0);
    expect(after.documentScroll).toBe(0);
    expect(after.bodyScroll).toBe(0);
    expectClean(errors);
  });
}