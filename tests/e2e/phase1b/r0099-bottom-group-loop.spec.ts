/**
 * R0099 — Bottom Box Groups continuous looping regression coverage.
 *
 * The current bar has four groups. This suite verifies button, keyboard, and
 * horizontal swipe paths without changing the bar's geometry or shell owner.
 */
import { test, expect } from '../helpers/trailweigh';

const VIEWPORTS = [
  { width: 402, height: 714 },
  { width: 402, height: 754 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

const GROUP_COUNT = 4;

function activeGroup(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="bottom-nav"] [data-group-active="true"]');
}

async function groupIndex(page: import('@playwright/test').Page) {
  return Number(await activeGroup(page).getAttribute('data-group-idx'));
}

async function next(page: import('@playwright/test').Page) {
  await activeGroup(page).getByTestId('bottom-next-chevron').click();
  await page.waitForTimeout(430);
}

async function back(page: import('@playwright/test').Page) {
  await activeGroup(page).getByTestId('bottom-back-chevron').click();
  await page.waitForTimeout(430);
}

async function shell(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const el = document.querySelector(selector) as HTMLElement;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    };
    return {
      app: rect('[data-testid="app-bar"]'),
      summary: rect('[data-testid="list-summary-bar"]'),
      filter: rect('[data-testid="filter-bar"]'),
      main: rect('[data-testid="main-scroll"]'),
      nav: rect('[data-testid="bottom-nav"]'),
      rootWidth: (document.querySelector('.tw-v3-root') as HTMLElement).getBoundingClientRect().width,
      documentWidth: document.documentElement.scrollWidth,
      wedgeGap: (() => {
        const wedges = Array.from(document.querySelectorAll<HTMLElement>('[data-cat] [data-testid^="cat-header-"] > button'));
        return wedges.length > 1
          ? wedges[1].getBoundingClientRect().top - wedges[0].getBoundingClientRect().bottom
          : null;
      })(),
      homeGap: (() => {
        const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="home-content-scroll"] button[aria-label^="Start Here"], [data-testid="home-content-scroll"] button[aria-label^="Tutorials"]'));
        return buttons.length > 1
          ? buttons[1].getBoundingClientRect().top - buttons[0].getBoundingClientRect().bottom
          : null;
      })(),
    };
  });
}

async function swipe(page: import('@playwright/test').Page, direction: 'forward' | 'reverse') {
  const box = await page.getByTestId('bottom-nav').boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;
  const startX = direction === 'forward' ? box!.x + box!.width * 0.75 : box!.x + box!.width * 0.25;
  const endX = direction === 'forward' ? startX - 100 : startX + 100;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(430);
}

for (const viewport of VIEWPORTS) {
  test(`R0099 loops Bottom Box Groups at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
    await page.setViewportSize(viewport);
    await page.goto('/mobile-functional-v3');
    await page.waitForSelector('[data-testid="bottom-nav"]');
    await page.waitForSelector('[data-testid="main-scroll"]');

    const initialShell = await shell(page);
    expect(await groupIndex(page)).toBe(0);

    const forwardSequence: number[] = [0];
    for (let i = 0; i < GROUP_COUNT; i++) {
      await next(page);
      forwardSequence.push(await groupIndex(page));
    }
    expect(forwardSequence).toEqual([0, 1, 2, 3, 0]);
    if (viewport.width === 402 && viewport.height === 714) {
      await page.screenshot({ path: 'reports/r0099/screenshots/01-forward-wrap-first-group-402x714.png', fullPage: false });
    }

    const reverseSequence: number[] = [0];
    // Group 1 has no visible Back box by design; its existing reverse interaction
    // is the horizontal swipe. Once wrapped to Group 4, the existing Back box
    // continues the reverse path without changing the five-box layout.
    await swipe(page, 'reverse');
    reverseSequence.push(await groupIndex(page));
    for (let i = 1; i < GROUP_COUNT; i++) {
      await back(page);
      reverseSequence.push(await groupIndex(page));
    }
    expect(reverseSequence).toEqual([0, 3, 2, 1, 0]);
    if (viewport.width === 402 && viewport.height === 714) {
      await page.screenshot({ path: 'reports/r0099/screenshots/02-reverse-wrap-last-group-402x714.png', fullPage: false });
    }

    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < GROUP_COUNT; i++) await next(page);
      expect(await groupIndex(page)).toBe(0);
    }
    for (let cycle = 0; cycle < 3; cycle++) {
      await swipe(page, 'reverse');
      for (let i = 1; i < GROUP_COUNT; i++) await back(page);
      expect(await groupIndex(page)).toBe(0);
    }

    await next(page);
    await activeGroup(page).getByTestId('bottom-back-chevron').press('Enter');
    await page.waitForTimeout(430);
    expect(await groupIndex(page)).toBe(0);

    await swipe(page, 'forward');
    expect(await groupIndex(page)).toBe(1);
    await swipe(page, 'reverse');
    expect(await groupIndex(page)).toBe(0);
    await swipe(page, 'reverse');
    expect(await groupIndex(page)).toBe(3);
    if (viewport.width === 402 && viewport.height === 714) {
      await page.screenshot({ path: 'reports/r0099/screenshots/03-swipe-reverse-wrap-402x714.png', fullPage: false });
    }

    const finalShell = await shell(page);
    for (const key of ['app', 'summary', 'filter', 'main', 'nav'] as const) {
      expect(finalShell[key].top, `${key} top stays fixed`).toBeCloseTo(initialShell[key].top, 0);
      expect(finalShell[key].bottom, `${key} bottom stays fixed`).toBeCloseTo(initialShell[key].bottom, 0);
      expect(finalShell[key].height, `${key} height stays fixed`).toBeCloseTo(initialShell[key].height, 1);
    }
    expect(finalShell.rootWidth).toBe(viewport.width);
    expect(finalShell.documentWidth).toBe(viewport.width);
    expect(finalShell.wedgeGap).toBe(1);
    expect(finalShell.homeGap).toBeNull();
    expect(errors.pageErrors).toEqual([]);
    expect(errors.serverErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });
}

test('R0099 loops from Home without changing the checklist shell', async ({ page, errors }) => {
  await page.setViewportSize({ width: 402, height: 714 });
  await page.goto('/mobile-functional-v3');
  await page.waitForSelector('[data-testid="main-scroll"]');
  await page.getByTestId('hamburger-btn').click();
  await page.getByTestId('drawer-nav-home').click();
  await expect(page.getByTestId('home-screen')).toBeVisible();

  expect(await groupIndex(page)).toBe(0);
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  expect(await groupIndex(page)).toBe(0);
  await back(page);
  expect(await groupIndex(page)).toBe(3);
  expect(errors.pageErrors).toEqual([]);
  expect(errors.serverErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
});