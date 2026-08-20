/**
 * R0096 evidence capture — writes the screenshots and exact Chromium geometry
 * used by the report archive. This is intentionally separate from the behavioral
 * suite so the evidence filenames are deterministic.
 */
import { test, expect, gotoDemo, addCategory } from '../helpers/trailweigh';

const OUT = 'reports/r0096/screenshots';

function snapshotScript() {
  const rect = (selector: string) => {
    const node = document.querySelector(selector) as HTMLElement | null;
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  };
  const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  const openItems = document.querySelector('[data-testid="open-cat-items"]') as HTMLElement | null;
  return {
    appBar: rect('[data-testid="app-bar"]'),
    summary: rect('[data-testid="list-summary-bar"]'),
    filter: rect('[data-testid="filter-bar"]'),
    activeCategory: rect('[data-testid="active-category-bar"]'),
    addItem: rect('[data-testid="cat-add-item-bar"]'),
    footer: rect('[data-testid="bottom-nav"]'),
    drawer: rect('[data-testid="nav-drawer"]'),
    main: {
      top: main.getBoundingClientRect().top,
      bottom: main.getBoundingClientRect().bottom,
      scrollTop: main.scrollTop,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
    },
    openItems: openItems ? {
      scrollTop: openItems.scrollTop,
      scrollHeight: openItems.scrollHeight,
      clientHeight: openItems.clientHeight,
    } : null,
    document: {
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      rootWidth: (document.querySelector('.tw-v3-root') as HTMLElement).getBoundingClientRect().width,
      documentScrollWidth: document.documentElement.scrollWidth,
    },
    categoryRowHeight: (document.querySelector('[data-swipe-key^="cat:"]') as HTMLElement).getBoundingClientRect().height,
    weightRight: (document.querySelector('[data-testid^="cat-weight-"]') as HTMLElement).getBoundingClientRect().right,
  };
}

test('captures R0096 browser evidence at 402×714', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 714 });
  await gotoDemo(page);
  for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F']) await addCategory(page, `R0096 Evidence ${suffix}`);
  await page.waitForTimeout(150);

  const normalStart = await page.evaluate(snapshotScript);
  await page.screenshot({ path: `${OUT}/01-normal-filter-402x714.png`, fullPage: false });
  await page.evaluate(() => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    main.scrollTop = Math.max(0, (main.scrollHeight - main.clientHeight) * 0.7);
    main.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const normalMid = await page.evaluate(snapshotScript);
  await page.screenshot({ path: `${OUT}/02-normal-mid-scroll-402x714.png`, fullPage: false });

  await page.getByRole('button', { name: 'Open Backpack category' }).click();
  for (let i = 0; i < 14; i++) await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('active-category-bar')).toBeVisible({ timeout: 6000 });
  const activeStart = await page.evaluate(snapshotScript);
  await page.screenshot({ path: `${OUT}/03-active-category-402x714.png`, fullPage: false });
  await page.evaluate(() => {
    const items = document.querySelector('[data-testid="open-cat-items"]') as HTMLElement;
    items.scrollTop = Math.max(0, items.scrollHeight - items.clientHeight);
    items.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const activeMid = await page.evaluate(snapshotScript);
  await page.screenshot({ path: `${OUT}/04-active-item-scroll-402x714.png`, fullPage: false });

  await page.getByTestId('hamburger-btn').click();
  await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'true');
  const drawerBefore = await page.evaluate(snapshotScript);
  await page.screenshot({ path: `${OUT}/05-drawer-open-402x714.png`, fullPage: false });
  await page.evaluate(() => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    main.scrollTop = Math.max(0, main.scrollTop - 140);
    main.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const drawerAfter = await page.evaluate(snapshotScript);
  await page.screenshot({ path: `${OUT}/06-drawer-after-underlying-scroll-402x714.png`, fullPage: false });

  await page.getByTestId('drawer-nav-home').click();
  await expect(page.getByTestId('home-screen')).toBeVisible();
  await page.screenshot({ path: `${OUT}/07-home-regression-402x714.png`, fullPage: false });
  const home = await page.evaluate(() => {
    const content = document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement;
    content.scrollTop = Math.min(200, Math.max(0, content.scrollHeight - content.clientHeight));
    return {
      homeScrollTop: content.scrollTop,
      homeScrollHeight: content.scrollHeight,
      homeClientHeight: content.clientHeight,
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
    };
  });

  console.log(`R0096_METRICS ${JSON.stringify({ normalStart, normalMid, activeStart, activeMid, drawerBefore, drawerAfter, home })}`);
});