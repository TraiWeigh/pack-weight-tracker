/**
 * R0097 — AppBar visibility when Safari exposes a top safe area.
 *
 * Chromium has a zero safe-area inset. The final case injects a representative
 * 20px inset into the shell custom property so the safe-area geometry is tested
 * without pretending Chromium can prove physical iPhone Safari compositing.
 */
import { test, expect, gotoDemo, expectClean, addCategory } from '../helpers/trailweigh';

type Rect = { top: number; bottom: number; height: number };

async function rect(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  return page.locator(selector).evaluate((el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, height: box.height };
  });
}

async function assertStack(page: import('@playwright/test').Page, viewport: { width: number; height: number }) {
  const shell = await rect(page, '.tw-v3-root');
  const app = await rect(page, '[data-testid="app-bar"]');
  const summary = await rect(page, '[data-testid="list-summary-bar"]');
  const filter = await rect(page, '[data-testid="filter-bar"]');
  const main = await rect(page, '[data-testid="main-scroll"]');
  const footer = await rect(page, '[data-testid="bottom-nav"]');

  expect(shell.top).toBeGreaterThanOrEqual(0);
  expect(shell.bottom).toBeCloseTo(viewport.height, 0);
  expect(app.top).toBeGreaterThanOrEqual(shell.top);
  expect(app.bottom).toBeLessThanOrEqual(shell.bottom);
  expect(app.height).toBe(52);
  expect(summary.top).toBeCloseTo(app.bottom, 0);
  expect(filter.top).toBeCloseTo(summary.bottom, 0);
  expect(main.top).toBeCloseTo(filter.bottom, 0);
  expect(main.bottom).toBeCloseTo(footer.top, 0);
  expect(footer.bottom).toBeCloseTo(viewport.height, 0);
  expect(main.height).toBeGreaterThan(160);
}

test.describe('R0097 — safe-area-aware AppBar shell', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`keeps the AppBar visible and preserves the full stack at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await gotoDemo(page);
      await assertStack(page, viewport);
      const overflow = await page.evaluate(() => ({
        rootWidth: (document.querySelector('.tw-v3-root') as HTMLElement).getBoundingClientRect().width,
        documentWidth: document.documentElement.scrollWidth,
      }));
      expect(overflow.rootWidth).toBe(viewport.width);
      expect(overflow.documentWidth).toBe(viewport.width);
      expectClean(errors);
    });
  }

  test('uses the top safe-area inset to expose AppBar without moving the locked footer', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    const beforeFooter = await rect(page, '[data-testid="bottom-nav"]');
    await page.addStyleTag({ content: '.tw-v3-root{--tw-safe-top:20px !important}' });
    await page.waitForTimeout(80);
    await assertStack(page, { width: 402, height: 714 });
    const shell = await rect(page, '.tw-v3-root');
    const app = await rect(page, '[data-testid="app-bar"]');
    const summary = await rect(page, '[data-testid="list-summary-bar"]');
    const afterFooter = await rect(page, '[data-testid="bottom-nav"]');
    expect(shell.top).toBe(20);
    expect(app.top).toBe(20);
    expect(summary.top).toBe(72);
    expect(afterFooter.top).toBeCloseTo(beforeFooter.top, 0);
    expectClean(errors);
  });

  test('keeps the AppBar/Summary/Filter/Footer fixed while category content scrolls', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    for (const name of ['A', 'B', 'C', 'D', 'E', 'F']) await addCategory(page, `R0097 scroll ${name}`);
    const before = {
      app: await rect(page, '[data-testid="app-bar"]'),
      summary: await rect(page, '[data-testid="list-summary-bar"]'),
      filter: await rect(page, '[data-testid="filter-bar"]'),
      footer: await rect(page, '[data-testid="bottom-nav"]'),
      row: await rect(page, '[data-cat="R0097 scroll A"]'),
    };
    await page.evaluate(() => {
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
      main.scrollTop = main.scrollHeight - main.clientHeight;
      main.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    const after = {
      app: await rect(page, '[data-testid="app-bar"]'),
      summary: await rect(page, '[data-testid="list-summary-bar"]'),
      filter: await rect(page, '[data-testid="filter-bar"]'),
      footer: await rect(page, '[data-testid="bottom-nav"]'),
      row: await rect(page, '[data-cat="R0097 scroll A"]'),
      scroll: await page.evaluate(() => ({
        main: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
        window: window.scrollY,
        document: document.documentElement.scrollTop,
        body: document.body.scrollTop,
      })),
    };
    expect(after.app.top).toBeCloseTo(before.app.top, 0);
    expect(after.summary.top).toBeCloseTo(before.summary.top, 0);
    expect(after.filter.top).toBeCloseTo(before.filter.top, 0);
    expect(after.footer.top).toBeCloseTo(before.footer.top, 0);
    expect(Math.abs(after.row.top - before.row.top)).toBeGreaterThan(20);
    expect(after.scroll.main).toBeGreaterThan(0);
    expect(after.scroll.window).toBe(0);
    expect(after.scroll.document).toBe(0);
    expect(after.scroll.body).toBe(0);
    expectClean(errors);
  });

  test('preserves safe-area-aware Home and hamburger placement', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await page.addStyleTag({ content: '.tw-v3-root{--tw-safe-top:20px !important}' });
    await page.getByTestId('hamburger-btn').click();
    const shell = await rect(page, '.tw-v3-root');
    const drawer = await rect(page, '[data-testid="nav-drawer"]');
    expect(drawer.top).toBeCloseTo(shell.top, 0);
    expect(drawer.bottom).toBeCloseTo(shell.bottom, 0);
    await page.getByTestId('nav-drawer-backdrop').click({ position: { x: 350, y: 350 } });
    await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'false');
    await page.waitForTimeout(220);
    const closedDrawer = await page.getByTestId('nav-drawer').evaluate((el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    expect(closedDrawer.right).toBeLessThanOrEqual(1);

    await page.getByTestId('hamburger-btn').click();
    await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'true');
    await page.getByTestId('drawer-nav-home').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    const home = await rect(page, '[data-testid="home-screen"]');
    const app = await rect(page, '[data-testid="app-bar"]');
    expect(app.top).toBe(20);
    expect(home.top).toBeCloseTo(app.bottom, 0);
    const scroll = await page.getByTestId('home-content-scroll').evaluate((el: HTMLElement) => {
      el.scrollTop = 160;
      return { top: el.getBoundingClientRect().top, scrollTop: el.scrollTop, window: window.scrollY };
    });
    expect(scroll.scrollTop).toBeGreaterThan(0);
    expect(scroll.window).toBe(0);
    expectClean(errors);
  });
});