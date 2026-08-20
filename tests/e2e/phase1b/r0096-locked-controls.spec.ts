/**
 * R0096 — locked Filter / active-category / Add Item shell slots.
 *
 * Chromium verifies shell ownership and geometry. Physical iPhone Safari remains
 * the final authority for browser-chrome behaviour.
 */
import { test, expect, gotoDemo, expectClean, addCategory } from '../helpers/trailweigh';

type Rect = { top: number; bottom: number; height: number };

async function rectOf(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  return page.locator(selector).evaluate((el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });
}

async function scrollMain(page: import('@playwright/test').Page, fraction: number) {
  await page.evaluate((targetFraction) => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    main.scrollTop = Math.max(0, (main.scrollHeight - main.clientHeight) * targetFraction);
    main.dispatchEvent(new Event('scroll', { bubbles: true }));
  }, fraction);
  await page.waitForTimeout(100);
}

async function chooseFilter(page: import('@playwright/test').Page, option: 'category' | 'location' | 'photo') {
  await page.getByTestId('filter-control').click();
  await page.getByTestId(`filter-option-${option}`).click();
}

async function makeBackpackLong(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open Backpack category' }).click();
  const addItem = page.getByTestId('cat-add-item-btn');
  for (let i = 0; i < 14; i++) await addItem.click();
  await expect(page.getByTestId('active-category-bar')).toBeVisible({ timeout: 6000 });
}

test.describe('R0096 — locked mobile control layers', () => {
  for (const viewport of [
    { width: 402, height: 714 },
    { width: 402, height: 754 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    test(`keeps the normal Filter slot and chrome locked at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
      await page.setViewportSize(viewport);
      await gotoDemo(page);
      for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F']) {
        await addCategory(page, `R0096 Scroll ${viewport.width} ${suffix}`);
      }
      await page.waitForTimeout(200);

      const before = {
        appBar: await rectOf(page, '[data-testid="app-bar"]'),
        summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
        filter: await rectOf(page, '[data-testid="filter-bar"]'),
        nav: await rectOf(page, '[data-testid="bottom-nav"]'),
        row: await rectOf(page, `[data-cat="R0096 Scroll ${viewport.width} A"]`),
      };
      await scrollMain(page, 0.75);
      const after = {
        appBar: await rectOf(page, '[data-testid="app-bar"]'),
        summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
        filter: await rectOf(page, '[data-testid="filter-bar"]'),
        nav: await rectOf(page, '[data-testid="bottom-nav"]'),
        row: await rectOf(page, `[data-cat="R0096 Scroll ${viewport.width} A"]`),
        scroll: await page.evaluate(() => ({
          main: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
          window: window.scrollY,
          document: document.documentElement.scrollTop,
          body: document.body.scrollTop,
        })),
      };

      expect(before.filter.top).toBeCloseTo(before.summary.bottom, 0);
      expect(after.appBar.top).toBeCloseTo(before.appBar.top, 0);
      expect(after.summary.top).toBeCloseTo(before.summary.top, 0);
      expect(after.filter.top).toBeCloseTo(before.filter.top, 0);
      expect(after.nav.top).toBeCloseTo(before.nav.top, 0);
      expect(Math.abs(after.row.top - before.row.top)).toBeGreaterThan(20);
      expect(after.scroll.main).toBeGreaterThan(0);
      expect(after.scroll.window).toBe(0);
      expect(after.scroll.document).toBe(0);
      expect(after.scroll.body).toBe(0);
      expectClean(errors);
    });
  }

  test('Filter opens the three choices and reflects each active choice', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await page.getByTestId('filter-control').click();
    await expect(page.getByTestId('filter-menu')).toBeVisible();
    await expect(page.getByTestId('filter-option-category')).toBeVisible();
    await expect(page.getByTestId('filter-option-location')).toBeVisible();
    await expect(page.getByTestId('filter-option-photo')).toBeVisible();

    await page.getByTestId('filter-option-location').click();
    await expect(page.getByTestId('filter-control')).toContainText('Filter: Location');
    await chooseFilter(page, 'photo');
    await expect(page.getByTestId('filter-control')).toContainText('Filter: Photo');
    await chooseFilter(page, 'category');
    await expect(page.getByTestId('filter-control')).toContainText('Filter: Category');
    await expect(page.getByTestId('filter-menu')).not.toBeVisible();
    expectClean(errors);
  });

  test('Photo view reuses the item-owned editor and renders only Delete/Edit below a saved photo', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await chooseFilter(page, 'photo');
    await page.getByRole('button', { name: 'Open Backpack category' }).click();
    await page.getByRole('button', { name: /— expand details$/ }).first().click();
    await page.getByTestId('item-photo-add-btn').click();
    await page.locator('input[aria-label="Upload a photo from device library"]').setInputFiles(
      'artifacts/pack-checklist/public/icon-512.png'
    );
    await expect(page.getByTestId('photo-mode-item')).toBeVisible({ timeout: 8000 });
    const photoItem = page.getByTestId('photo-mode-item').first();
    await expect(photoItem.locator('img')).toBeVisible();
    await expect(photoItem.getByTestId('photo-mode-delete-btn')).toBeVisible();
    await expect(photoItem.getByTestId('photo-mode-edit-btn')).toBeVisible();
    await expect(photoItem.getByTestId('photo-take-btn')).not.toBeVisible();
    expectClean(errors);
  });

  test('active bounded category replaces Filter and locks Add Item above Bottom Box Groups', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await makeBackpackLong(page);

    await expect(page.getByTestId('filter-bar')).not.toBeVisible();
    const before = {
      summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
      active: await rectOf(page, '[data-testid="active-category-bar"]'),
      items: await rectOf(page, '[data-testid="open-cat-items"]'),
      add: await rectOf(page, '[data-testid="cat-add-item-bar"]'),
      nav: await rectOf(page, '[data-testid="bottom-nav"]'),
    };
    expect(before.active.top).toBeCloseTo(before.summary.bottom, 0);
    expect(Math.abs(before.add.bottom - before.nav.top)).toBeLessThanOrEqual(1);

    await page.evaluate(() => {
      const items = document.querySelector('[data-testid="open-cat-items"]') as HTMLElement;
      items.scrollTop = Math.max(0, items.scrollHeight - items.clientHeight);
      items.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    const after = {
      active: await rectOf(page, '[data-testid="active-category-bar"]'),
      add: await rectOf(page, '[data-testid="cat-add-item-bar"]'),
      nav: await rectOf(page, '[data-testid="bottom-nav"]'),
      itemScrollTop: await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => el.scrollTop),
    };
    expect(after.active.top).toBeCloseTo(before.active.top, 0);
    expect(after.add.top).toBeCloseTo(before.add.top, 0);
    expect(Math.abs(after.add.bottom - after.nav.top)).toBeLessThanOrEqual(1);
    expect(after.itemScrollTop).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Close Backpack category' }).click();
    await expect(page.getByTestId('filter-bar')).toBeVisible();
    expectClean(errors);
  });

  test('hamburger frame remains fixed while its separate interior remains scrollable', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await page.getByTestId('hamburger-btn').click();
    await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'true');

    const before = await rectOf(page, '[data-testid="nav-drawer"]');
    await page.evaluate(() => {
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
      main.scrollTop = 240;
      main.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    const after = await rectOf(page, '[data-testid="nav-drawer"]');
    const scrollStyles = await page.getByTestId('nav-drawer-scroll').evaluate((el: HTMLElement) => ({
      panelOverflow: getComputedStyle(el.parentElement!).overflowY,
      interiorOverflow: getComputedStyle(el).overflowY,
    }));
    expect(after.top).toBeCloseTo(before.top, 0);
    expect(after.bottom).toBeCloseTo(before.bottom, 0);
    expect(scrollStyles.panelOverflow).toBe('hidden');
    expect(scrollStyles.interiorOverflow).toBe('auto');
    await page.getByTestId('nav-drawer-backdrop').click({ position: { x: 350, y: 350 } });
    await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'false');
    expectClean(errors);
  });

  test('Home keeps its own scroll region without releasing document scroll', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDemo(page);
    await page.getByTestId('hamburger-btn').click();
    await page.getByTestId('drawer-nav-home').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.evaluate(() => {
      const home = document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement;
      home.scrollTop = Math.max(0, home.scrollHeight - home.clientHeight);
      home.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    const state = await page.evaluate(() => ({
      homeScroll: (document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement).scrollTop,
      window: window.scrollY,
      document: document.documentElement.scrollTop,
    }));
    expect(state.homeScroll).toBeGreaterThanOrEqual(0);
    expect(state.window).toBe(0);
    expect(state.document).toBe(0);
    expectClean(errors);
  });
});