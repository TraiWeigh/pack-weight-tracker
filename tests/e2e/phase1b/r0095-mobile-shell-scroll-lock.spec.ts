/**
 * R0095 — stable mobile chrome / internal checklist scroll ownership.
 *
 * Chromium verifies the shell structure and interaction regressions. The supplied
 * iPhone Safari recording remains the final physical-screen acceptance authority.
 */
import { test, expect, addCategory, expectClean, gotoDemo } from '../helpers/trailweigh';

type ShellSnapshot = {
  root: { top: number; bottom: number; height: number; position: string; overflowY: string };
  appBar: { top: number; bottom: number; height: number; position: string };
  summary: { top: number; bottom: number; height: number; position: string };
  nav: { top: number; bottom: number; height: number; position: string; topStyle: string; mode: string | null };
  main: { top: number; bottom: number; height: number; scrollTop: number; scrollHeight: number; overflowY: string };
  representativeRowTop: number;
  windowScrollY: number;
  documentScrollTop: number;
  bodyScrollTop: number;
};

async function snapshot(page: import('@playwright/test').Page, categoryName = 'Backpack'): Promise<ShellSnapshot> {
  return page.evaluate((representativeCategoryName) => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector) as HTMLElement;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { top: box.top, bottom: box.bottom, height: box.height, position: style.position };
    };
    const root = document.querySelector('.tw-v3-root') as HTMLElement;
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
    const rootBox = root.getBoundingClientRect();
    const rootStyle = getComputedStyle(root);
    const mainBox = main.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    const navStyle = getComputedStyle(nav);
    const row = document.querySelector(`[data-cat="${CSS.escape(representativeCategoryName)}"]`) as HTMLElement;
    return {
      root: { top: rootBox.top, bottom: rootBox.bottom, height: rootBox.height, position: rootStyle.position, overflowY: rootStyle.overflowY },
      appBar: rect('[data-testid="app-bar"]'),
      summary: rect('[data-testid="list-summary-bar"]'),
      nav: {
        top: navBox.top, bottom: navBox.bottom, height: navBox.height,
        position: navStyle.position, topStyle: nav.style.top,
        mode: nav.getAttribute('data-footer-positioning'),
      },
      main: {
        top: mainBox.top, bottom: mainBox.bottom, height: mainBox.height,
        scrollTop: main.scrollTop, scrollHeight: main.scrollHeight, overflowY: getComputedStyle(main).overflowY,
      },
      representativeRowTop: row.getBoundingClientRect().top,
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
    };
  }, categoryName);
}

async function scrollChecklist(page: import('@playwright/test').Page, fraction: number) {
  await page.evaluate((targetFraction) => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    main.scrollTop = Math.max(0, (main.scrollHeight - main.clientHeight) * targetFraction);
    main.dispatchEvent(new Event('scroll', { bubbles: true }));
  }, fraction);
  await page.waitForTimeout(100);
}

function expectStableShell(frame: ShellSnapshot, viewportHeight: number) {
  expect(frame.root.position).toBe('fixed');
  expect(frame.root.overflowY).toBe('hidden');
  expect(frame.root.top).toBeCloseTo(0, 0);
  expect(frame.root.height).toBeCloseTo(viewportHeight, 0);
  expect(frame.appBar.position).toBe('absolute');
  expect(frame.appBar.top).toBeCloseTo(0, 0);
  expect(frame.appBar.height).toBe(52);
  expect(frame.summary.position).toBe('absolute');
  expect(frame.summary.top).toBeCloseTo(52, 0);
  expect(frame.nav.position).toBe('absolute');
  expect(frame.nav.mode).toBe('shell-top-static');
  expect(frame.nav.topStyle).toBe(`${viewportHeight - 58}px`);
  expect(frame.nav.height).toBe(58);
  expect(frame.nav.bottom).toBeCloseTo(viewportHeight, 0);
  expect(frame.main.overflowY).toBe('auto');
  expect(frame.main.top).toBeCloseTo(frame.summary.bottom, 0);
  expect(frame.main.bottom).toBeCloseTo(frame.nav.top, 0);
  expect(frame.windowScrollY).toBe(0);
  expect(frame.documentScrollTop).toBe(0);
  expect(frame.bodyScrollTop).toBe(0);
}

test.describe('R0095 — internal checklist scroller and locked mobile chrome', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`provides a stable shell at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await gotoDemo(page);
      expectStableShell(await snapshot(page), viewport.height);
      expectClean(errors);
    });
  }

  test('moves only checklist rows through start, mid, deep, reverse, and bottom states', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      await addCategory(page, `R0095 Shell ${suffix}`);
    }
    await page.waitForTimeout(3500);

    const start = await snapshot(page, 'R0095 Shell A');
    await page.screenshot({ path: 'screenshots/r0095-start-402x714.png', fullPage: false });

    await scrollChecklist(page, 0.35);
    const mid = await snapshot(page, 'R0095 Shell A');
    await page.screenshot({ path: 'screenshots/r0095-mid-scroll-402x714.png', fullPage: false });

    await scrollChecklist(page, 0.85);
    const deep = await snapshot(page, 'R0095 Shell A');
    await page.screenshot({ path: 'screenshots/r0095-deep-scroll-402x714.png', fullPage: false });

    await scrollChecklist(page, 1);
    const bottom = await snapshot(page, 'R0095 Shell H');
    await page.screenshot({ path: 'screenshots/r0095-bottom-of-list-402x714.png', fullPage: false });

    await scrollChecklist(page, 0.2);
    const reverse = await snapshot(page, 'R0095 Shell A');
    await page.screenshot({ path: 'screenshots/r0095-reverse-scroll-402x714.png', fullPage: false });

    const states = [start, mid, deep, bottom, reverse];
    for (const state of states) {
      expectStableShell(state, 714);
      expect(Math.abs(state.appBar.top - start.appBar.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(state.summary.top - start.summary.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(state.nav.top - start.nav.top)).toBeLessThanOrEqual(1);
    }
    expect(mid.main.scrollTop).toBeGreaterThan(0);
    expect(deep.main.scrollTop).toBeGreaterThan(mid.main.scrollTop);
    expect(bottom.main.scrollTop).toBeGreaterThan(deep.main.scrollTop);
    expect(reverse.main.scrollTop).toBeLessThan(bottom.main.scrollTop);
    expect(Math.abs(mid.representativeRowTop - start.representativeRowTop)).toBeGreaterThan(20);
    expect(bottom.representativeRowTop).toBeLessThanOrEqual(bottom.nav.top + 1);
    expectClean(errors);
  });

  test('keeps Bottom Box Groups navigation and Add usable in the shell', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await page.locator('[data-group-active="true"] [data-testid="bottom-next-chevron"]').click();
    await expect(page.getByRole('button', { name: 'Undo last change' })).toBeVisible();
    await page.locator('[data-group-active="true"] [data-testid="bottom-back-chevron"]').click();
    await page.getByRole('button', { name: 'Add — add items, categories, or import' }).click();
    await expect(page.getByRole('button', { name: 'Add Category — open card' })).toBeVisible();
    expectClean(errors);
  });
});