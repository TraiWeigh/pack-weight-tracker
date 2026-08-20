/**
 * R0094 — physical-screen Bottom Box Groups lock.
 *
 * The user-supplied post-R0093 iPhone recording is authoritative. Chromium can prove
 * the intended structure: a fixed footer uses documentElement.clientHeight as its
 * stable top baseline, ignores visual-viewport scroll notifications, and updates only
 * when the actual layout viewport changes.
 */
import { test, expect, addCategory, expectClean, gotoDemo } from '../helpers/trailweigh';

type FooterSnapshot = {
  top: number;
  bottom: number;
  height: number;
  position: string;
  topStyle: string;
  bottomStyle: string;
  authoredBottom: string;
  transform: string;
  lockMode: string | null;
  layoutHeight: number;
  stableTop: number;
  clientHeight: number;
  innerHeight: number;
  visualHeight: number;
  scrollY: number;
  mainScrollTop: number;
  rootPaddingBottom: number;
};

async function footerSnapshot(page: import('@playwright/test').Page): Promise<FooterSnapshot> {
  return page.evaluate(() => {
    const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
    const root = document.querySelector('.tw-v3-root') as HTMLElement;
    const rect = nav.getBoundingClientRect();
    const style = getComputedStyle(nav);
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      position: style.position,
      topStyle: style.top,
      bottomStyle: style.bottom,
      authoredBottom: nav.style.bottom,
      transform: style.transform,
      lockMode: nav.getAttribute('data-footer-positioning'),
      layoutHeight: Number(nav.getAttribute('data-footer-layout-height') ?? '0'),
      stableTop: Number(nav.getAttribute('data-footer-stable-top') ?? '0'),
      clientHeight: document.documentElement.clientHeight,
      innerHeight: window.innerHeight,
      visualHeight: window.visualViewport?.height ?? window.innerHeight,
      scrollY: window.scrollY,
      mainScrollTop: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
      rootPaddingBottom: Number.parseFloat(getComputedStyle(root).paddingBottom),
    };
  });
}

async function scrollChecklistTo(page: import('@playwright/test').Page, fraction: number) {
  await page.evaluate((targetFraction) => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    const max = Math.max(0, main.scrollHeight - main.clientHeight);
    main.scrollTop = max * targetFraction;
  }, fraction);
  await page.waitForTimeout(100);
}

function expectLayoutTopFooter(snapshot: FooterSnapshot, expectedLayoutHeight: number) {
  expect(snapshot.lockMode).toBe('shell-top-static');
  expect(snapshot.position).toBe('absolute');
  expect(snapshot.topStyle).toBe(`${expectedLayoutHeight - 58}px`);
  expect(snapshot.authoredBottom).toBe('auto');
  expect(snapshot.transform).toBe('none');
  expect(snapshot.height).toBe(58);
  expect(snapshot.layoutHeight).toBe(expectedLayoutHeight);
  expect(snapshot.clientHeight).toBe(expectedLayoutHeight);
  expect(snapshot.stableTop).toBe(expectedLayoutHeight - snapshot.height);
  expect(snapshot.top).toBeCloseTo(snapshot.stableTop, 0);
  expect(snapshot.bottom).toBeCloseTo(expectedLayoutHeight, 0);
  expect(snapshot.rootPaddingBottom).toBeGreaterThanOrEqual(snapshot.height);
}

test.describe('R0094 — physical-screen Bottom Box Groups lock', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`uses a responsive layout-top baseline at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await gotoDemo(page);
      expectLayoutTopFooter(await footerSnapshot(page), viewport.height);
      expectClean(errors);
    });
  }

  test('holds one Y coordinate through checklist scroll and visual-viewport scroll notifications', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      await addCategory(page, `R0094 Physical ${suffix}`);
    }
    // Keep the evidence focused on footer/content geometry rather than the final
    // normal Add confirmation toast.
    await page.waitForTimeout(3500);

    await page.evaluate(() => {
      const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
      const testWindow = window as typeof window & {
        __r0094FooterMutations?: MutationRecord[];
        __r0094FooterObserver?: MutationObserver;
      };
      testWindow.__r0094FooterMutations = [];
      testWindow.__r0094FooterObserver = new MutationObserver(records => {
        testWindow.__r0094FooterMutations?.push(...records);
      });
      testWindow.__r0094FooterObserver.observe(nav, {
        attributes: true,
        attributeFilter: [
          'style',
          'class',
          'data-footer-positioning',
          'data-footer-layout-height',
          'data-footer-stable-top',
        ],
      });
    });

    const start = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0094-start-402x714.png', fullPage: false });

    await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('scroll')));
    await page.waitForTimeout(100);
    const afterVisualViewportScroll = await footerSnapshot(page);

    await scrollChecklistTo(page, 0.35);
    const mid = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0094-mid-scroll-402x714.png', fullPage: false });

    await scrollChecklistTo(page, 0.85);
    const deep = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0094-deep-scroll-402x714.png', fullPage: false });

    await scrollChecklistTo(page, 1);
    const bottom = await footerSnapshot(page);
    const finalRowBottom = await page.locator('[data-cat="R0094 Physical H"]')
      .evaluate(element => element.getBoundingClientRect().bottom);
    await page.screenshot({ path: 'screenshots/r0094-bottom-of-list-402x714.png', fullPage: false });

    await scrollChecklistTo(page, 0.2);
    const reverse = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0094-reverse-scroll-402x714.png', fullPage: false });

    const mutationCount = await page.evaluate(() => {
      const testWindow = window as typeof window & {
        __r0094FooterMutations?: MutationRecord[];
        __r0094FooterObserver?: MutationObserver;
      };
      testWindow.__r0094FooterObserver?.disconnect();
      return testWindow.__r0094FooterMutations?.length ?? 0;
    });

    const snapshots = [start, afterVisualViewportScroll, mid, deep, bottom, reverse];
    expect(mid.mainScrollTop).toBeGreaterThanOrEqual(100);
    expect(deep.mainScrollTop).toBeGreaterThan(mid.mainScrollTop);
    expect(bottom.mainScrollTop).toBeGreaterThan(deep.mainScrollTop);
    expect(reverse.mainScrollTop).toBeLessThan(bottom.mainScrollTop);
    for (const snapshot of snapshots) {
      expectLayoutTopFooter(snapshot, 714);
      expect(Math.abs(snapshot.top - start.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(snapshot.bottom - start.bottom)).toBeLessThanOrEqual(1);
      expect(snapshot.scrollY).toBe(0);
    }
    expect(mutationCount, 'scrolling and visualViewport scroll notifications must not mutate footer geometry').toBe(0);
    expect(finalRowBottom, 'the final category must clear the stationary footer').toBeLessThanOrEqual(bottom.top + 1);
    expectClean(errors);
  });

  test('updates only for a genuine layout viewport resize, then returns to its original physical line', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    const before = await footerSnapshot(page);
    expectLayoutTopFooter(before, 714);

    await page.setViewportSize({ width: 402, height: 754 });
    await page.waitForFunction(() =>
      document.querySelector('[data-testid="bottom-nav"]')?.getAttribute('data-footer-layout-height') === '754',
    );
    const resized = await footerSnapshot(page);
    expectLayoutTopFooter(resized, 754);
    expect(resized.top - before.top, 'a genuine 40px layout resize moves the responsive resting line by 40px').toBeCloseTo(40, 0);

    await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('scroll')));
    await page.waitForTimeout(100);
    const afterVisualViewportScroll = await footerSnapshot(page);
    expect(afterVisualViewportScroll.top).toBeCloseTo(resized.top, 0);
    expect(afterVisualViewportScroll.stableTop).toBe(resized.stableTop);

    await page.setViewportSize({ width: 402, height: 714 });
    await page.waitForFunction(() =>
      document.querySelector('[data-testid="bottom-nav"]')?.getAttribute('data-footer-layout-height') === '714',
    );
    const returned = await footerSnapshot(page);
    expectLayoutTopFooter(returned, 714);
    expect(returned.top).toBeCloseTo(before.top, 0);
    expectClean(errors);
  });

  test('keeps Bottom Box Groups navigation and Add functional after the anchoring change', async ({ page, errors }) => {
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