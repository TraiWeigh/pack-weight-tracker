/**
 * R0093 — true Bottom Box Groups lock.
 *
 * The real iPhone Safari video is authoritative. Chromium proves the structural
 * invariants only: document content scrolls while the footer has no scroll-driven
 * positioning mutation and stays at its fixed resting position.
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
  layoutViewportHeight: number;
  stableTop: number;
  scrollY: number;
  rootPaddingBottom: string;
  mainScrollOverflowY: string;
};

async function footerSnapshot(page: import('@playwright/test').Page): Promise<FooterSnapshot> {
  return page.evaluate(() => {
    const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
    const root = document.querySelector('.tw-v3-root') as HTMLElement;
    const mainScroll = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
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
      layoutViewportHeight: Number(nav.getAttribute('data-footer-layout-height') ?? '0'),
      stableTop: Number(nav.getAttribute('data-footer-stable-top') ?? '0'),
      scrollY: window.scrollY,
      rootPaddingBottom: getComputedStyle(root).paddingBottom,
      mainScrollOverflowY: getComputedStyle(mainScroll).overflowY,
    };
  });
}

async function rectRight(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).evaluate(element => element.getBoundingClientRect().right);
}

async function rectBottom(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).evaluate(element => element.getBoundingClientRect().bottom);
}

async function scrollDocumentTo(page: import('@playwright/test').Page, fraction: number) {
  await page.evaluate((targetFraction) => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: max * targetFraction, behavior: 'auto' });
  }, fraction);
  await page.waitForTimeout(90);
}

test.describe('R0093 — true fixed Bottom Box Groups lock', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`keeps the protected fixed-footer geometry at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await gotoDemo(page);

      const nav = await footerSnapshot(page);
      const appBar = await page.locator('[data-testid="app-bar"]').boundingBox();
      const summary = await page.locator('[data-testid="list-summary-bar"]').boundingBox();
      const weightRight = await rectRight(page, '[data-testid="cat-weight-Backpack"]');
      const categoryCountRight = await rectRight(page, '[data-testid="summary-category-count"]');
      const selectedRight = await rectRight(page, '[data-testid="summary-selected-status"]');

      expect(nav.lockMode).toBe('layout-top-static');
      expect(nav.position).toBe('fixed');
      expect(nav.topStyle).toBe(`${viewport.height - 58}px`);
      expect(nav.authoredBottom).toBe('auto');
      expect(nav.transform).toBe('none');
      expect(nav.height).toBe(58);
      expect(nav.top).toBeCloseTo(viewport.height - 58, 0);
      expect(nav.bottom).toBeCloseTo(viewport.height, 0);
      expect(nav.layoutViewportHeight).toBe(viewport.height);
      expect(nav.stableTop).toBe(viewport.height - 58);
      expect(appBar?.height).toBe(52);
      expect(summary?.height).toBeGreaterThanOrEqual(88);
      expect(summary?.height).toBeLessThan(89);
      expect(weightRight).toBeCloseTo(viewport.width - 44, 0);
      expect(categoryCountRight).toBeCloseTo(weightRight, 0);
      expect(selectedRight).toBeCloseTo(weightRight, 0);

      const widths = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(widths.document).toBeLessThanOrEqual(viewport.width);
      expect(widths.body).toBeLessThanOrEqual(viewport.width);
      expectClean(errors);
    });
  }

  test('does not mutate or move the footer through a full document-scroll lifecycle', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);

    for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      await addCategory(page, `R0093 Scroll ${suffix}`);
    }
    // Keep the evidence frames focused on footer/content geometry rather than the
    // transient confirmation toast emitted by the final normal Add interaction.
    await page.waitForTimeout(2500);

    await page.evaluate(() => {
      const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
      const testWindow = window as typeof window & {
        __r0093FooterMutations?: MutationRecord[];
        __r0093FooterObserver?: MutationObserver;
      };
      testWindow.__r0093FooterMutations = [];
      testWindow.__r0093FooterObserver = new MutationObserver(records => {
        testWindow.__r0093FooterMutations?.push(...records);
      });
      testWindow.__r0093FooterObserver.observe(nav, {
        attributes: true,
        attributeFilter: ['style', 'class', 'data-footer-positioning'],
      });
    });

    const initial = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0093-before-scroll-402x714.png', fullPage: false });

    await scrollDocumentTo(page, 0.35);
    const mid = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0093-mid-scroll-402x714.png', fullPage: false });

    await scrollDocumentTo(page, 0.85);
    const deep = await footerSnapshot(page);
    await page.screenshot({ path: 'screenshots/r0093-deep-scroll-402x714.png', fullPage: false });

    await scrollDocumentTo(page, 1);
    const final = await footerSnapshot(page);
    const finalRowBottom = await rectBottom(page, '[data-cat="R0093 Scroll H"]');
    await page.screenshot({ path: 'screenshots/r0093-after-scroll-402x714.png', fullPage: false });

    await scrollDocumentTo(page, 0.2);
    const returned = await footerSnapshot(page);
    const mutationCount = await page.evaluate(() => {
      const testWindow = window as typeof window & {
        __r0093FooterMutations?: MutationRecord[];
        __r0093FooterObserver?: MutationObserver;
      };
      testWindow.__r0093FooterObserver?.disconnect();
      return testWindow.__r0093FooterMutations?.length ?? 0;
    });

    const snapshots = [initial, mid, deep, final, returned];
    expect(mid.scrollY).toBeGreaterThanOrEqual(100);
    expect(deep.scrollY).toBeGreaterThan(mid.scrollY);
    expect(final.scrollY).toBeGreaterThan(deep.scrollY);
    expect(returned.scrollY).toBeLessThan(final.scrollY);
    for (const snapshot of snapshots) {
      expect(snapshot.position).toBe('fixed');
      expect(snapshot.topStyle).toBe(`${initial.top}px`);
      expect(snapshot.authoredBottom).toBe('auto');
      expect(snapshot.transform).toBe('none');
      expect(snapshot.lockMode).toBe('layout-top-static');
      expect(snapshot.layoutViewportHeight).toBe(initial.layoutViewportHeight);
      expect(snapshot.stableTop).toBe(initial.stableTop);
      expect(Number.parseFloat(snapshot.rootPaddingBottom)).toBeGreaterThanOrEqual(snapshot.height);
      expect(snapshot.mainScrollOverflowY).toBe('visible');
      expect(Math.abs(snapshot.top - initial.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(snapshot.bottom - initial.bottom)).toBeLessThanOrEqual(1);
    }
    expect(mutationCount, 'scrolling must not mutate footer style or lock mode').toBe(0);
    expect(finalRowBottom, 'the final category must clear the stable footer').toBeLessThanOrEqual(final.top + 1);
    expectClean(errors);
  });

  test('keeps visible Bottom Box Groups navigation and Add interaction functional', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);

    await page.locator('[data-group-active="true"] [data-testid="bottom-next-chevron"]').click();
    await expect(page.getByRole('button', { name: 'Undo last change' })).toBeVisible();
    await page.locator('[data-group-active="true"] [data-testid="bottom-back-chevron"]').click();
    await expect(page.getByRole('button', { name: 'Add — add items, categories, or import' })).toBeVisible();

    await page.getByRole('button', { name: 'Add — add items, categories, or import' }).click();
    await expect(page.getByRole('button', { name: 'Add Category — open card' })).toBeVisible();
    expectClean(errors);
  });
});