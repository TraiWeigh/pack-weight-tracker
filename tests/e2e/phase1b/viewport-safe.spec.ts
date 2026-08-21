/**
 * Viewport safety — R0090/R0091
 *
 * Verifies at the Chromium layer:
 *   1. No horizontal scroll/overflow at 320 px (narrowest supported phone width)
 *      in both category view and location view.
 *   2. Bottom nav is visible and within the viewport at iPhone 14 size (390×844).
 *   3. Safe-area CSS classes from the embedded <style> block are present in the
 *      document's CSSOM (confirms the embedded style rendered correctly).
 *   4. No horizontal overflow after opening a category and expanding an item
 *      (exposes the Location row, Photo row, and weight cells).
 *
 * NOTE: env(safe-area-inset-bottom) always resolves to 0 in Chromium; the
 * padding calc() expressions therefore have no visual effect in these tests.
 * Real-iPhone verification is required to confirm that the home indicator no
 * longer overlaps content in overlays and sheets on Face ID devices.
 *
 * Safari chrome retraction status:
 *   The checklist shell is a real document-flow scroller. This suite verifies
 *   that the document has scrollable height and that a native-style window scroll
 *   changes document scrollY rather than relying on an inner main-scroll element.
 */
import { test, expect, gotoDemo, addCategory } from '../helpers/trailweigh';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns {body, html} scroll widths to detect horizontal overflow. */
async function getScrollWidths(page: import('@playwright/test').Page) {
  return page.evaluate(() => ({
    body: document.body.scrollWidth,
    html: document.documentElement.scrollWidth,
  }));
}

/**
 * Scans the document's CSSOM for a CSS rule whose text contains `token`.
 * Works for inline <style> tags (same origin) but skips cross-origin sheets.
 */
async function stylesheetContains(page: import('@playwright/test').Page, token: string) {
  return page.evaluate((t) => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules ?? []);
        if (rules.some(r => r.cssText.includes(t))) return true;
      } catch {
        // cross-origin sheet — skip silently
      }
    }
    return false;
  }, token);
}

/** Open the isolated mobile demo with the temporary Safari diagnostic enabled. */
async function gotoDiagnosticDemo(page: import('@playwright/test').Page) {
  const response = await page.goto('/mobile-functional-v3?twViewportDebug=1');
  expect(response, 'diagnostic navigation response').not.toBeNull();
  expect(response!.ok(), `diagnostic document request failed: HTTP ${response?.status()}`).toBe(true);
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await expect(page.getByTestId('viewport-diagnostic')).toBeVisible();
  await page.getByTestId('viewport-diagnostic-toggle').click();
  await expect(page.getByTestId('viewport-diagnostic-values')).toContainText('"innerWidth"');
}

async function coreGeometry(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    return {
      documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      appBar: box('[data-testid="app-bar"]'),
      summary: box('[data-testid="list-summary-bar"]'),
      nav: box('[data-testid="bottom-nav"]'),
    };
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('temporary real-device viewport diagnostic', () => {
  test('is absent by default and has no normal-mode footprint', async ({ page, errors }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoDemo(page);

    await expect(page.getByTestId('viewport-diagnostic')).toHaveCount(0);
    const geometry = await coreGeometry(page);
    expect(geometry.documentWidth).toBeLessThanOrEqual(390);
    expect(geometry.bodyWidth).toBeLessThanOrEqual(390);
    expect(geometry.appBar).not.toBeNull();
    expect(geometry.summary).not.toBeNull();
    expect(geometry.nav).not.toBeNull();
    expect(errors.pageErrors).toEqual([]);
  });

  test('reports live geometry without adding document flow or overflow', async ({ page, errors }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoDemo(page);
    const baseline = await coreGeometry(page);

    await gotoDiagnosticDemo(page);
    const diagnostic = page.getByTestId('viewport-diagnostic');
    await expect(diagnostic).toBeVisible();
    await expect(page.getByTestId('viewport-diagnostic-values')).toContainText('"visualViewport"');

    const snapshot = await page.getByTestId('viewport-diagnostic-values').evaluate(element =>
      JSON.parse(element.textContent || '{}'),
    );
    expect(snapshot.screen.innerWidth).toBe(390);
    expect(snapshot.visualViewport.available, 'Chromium exposes visualViewport').toBe(true);
    expect(snapshot.trailweigh.elements.rootMobileShell).not.toBeNull();
    expect(snapshot.trailweigh.elements.appBar).not.toBeNull();
    expect(snapshot.trailweigh.elements.listSummary).not.toBeNull();
    expect(snapshot.trailweigh.elements.bottomBoxGroups).not.toBeNull();
    expect(snapshot.trailweigh.categorySamples.firstVisible).not.toBeNull();
    expect(snapshot.trailweigh.elements.firstVisibleWedge).not.toBeNull();

    const diagnosticStyle = await diagnostic.evaluate(element => getComputedStyle(element).position);
    expect(diagnosticStyle, 'diagnostic must be out of document flow').toBe('fixed');

    const debugGeometry = await coreGeometry(page);
    expect(debugGeometry.documentWidth, 'diagnostic must not introduce horizontal document overflow').toBeLessThanOrEqual(390);
    expect(debugGeometry.bodyWidth, 'diagnostic must not introduce horizontal body overflow').toBeLessThanOrEqual(390);
    expect(
      Math.abs(debugGeometry.documentHeight - baseline.documentHeight),
      'diagnostic must not add document-flow height',
    ).toBeLessThanOrEqual(2);
    for (const layer of ['appBar', 'summary', 'nav'] as const) {
      expect(debugGeometry[layer]).not.toBeNull();
      expect(baseline[layer]).not.toBeNull();
      expect(
        Math.abs(debugGeometry[layer]!.top - baseline[layer]!.top),
        `${layer} top must remain unchanged with diagnostic enabled`,
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(debugGeometry[layer]!.bottom - baseline[layer]!.bottom),
        `${layer} bottom must remain unchanged with diagnostic enabled`,
      ).toBeLessThanOrEqual(2);
    }

    // Verify the Home-owned scroller remains usable while the overlay is enabled.
    // The expanded diagnostic intentionally owns its toolbar hit area. Collapse it
    // before navigating through the temporary drawer, then re-expand on Home.
    await page.getByTestId('viewport-diagnostic-collapse').click();
    await page.getByTestId('hamburger-btn').click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    const homeScrollTop = await page.getByTestId('home-content-scroll').evaluate((element: HTMLElement) => {
      element.scrollTop = 120;
      return element.scrollTop;
    });
    expect(homeScrollTop, 'Home content must remain scrollable').toBeGreaterThan(0);

    await page.getByTestId('viewport-diagnostic-toggle').click();
    await page.getByTestId('viewport-diagnostic-refresh').click();
    const homeSnapshot = await page.getByTestId('viewport-diagnostic-values').evaluate(element =>
      JSON.parse(element.textContent || '{}'),
    );
    expect(homeSnapshot.trailweigh.pageState).toBe('Home');
    expect(homeSnapshot.trailweigh.elements.homeContentScroller).not.toBeNull();
    expect(errors.pageErrors).toEqual([]);
  });

  test('keeps diagnostic controls persistent above a scrollable snapshot at constrained iPhone height', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDiagnosticDemo(page);

    const toolbar = page.getByTestId('viewport-diagnostic-toolbar');
    const details = page.getByTestId('viewport-diagnostic-details');
    const scrollRegion = page.getByTestId('viewport-diagnostic-scroll');
    const keyMetrics = page.getByTestId('viewport-diagnostic-key-metrics');
    const collapse = page.getByTestId('viewport-diagnostic-collapse');
    const refresh = page.getByTestId('viewport-diagnostic-refresh');
    const copy = page.getByTestId('viewport-diagnostic-copy');

    await expect(toolbar).toBeVisible();
    await expect(collapse).toBeVisible();
    await expect(refresh).toBeVisible();
    await expect(copy).toBeVisible();
    await expect(keyMetrics).toContainText('KEY METRICS');
    await expect(keyMetrics).toContainText('Bottom Box Groups');
    await expect(keyMetrics).toContainText('first visible wedge');

    const beforeScroll = await page.evaluate(() => {
      const getRect = (testId: string) => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      };
      const scroll = document.querySelector<HTMLElement>('[data-testid="viewport-diagnostic-scroll"]');
      const details = document.querySelector<HTMLElement>('[data-testid="viewport-diagnostic-details"]');
      return {
        viewportHeight: window.visualViewport?.height ?? window.innerHeight,
        panelBottom: document.querySelector('[data-testid="viewport-diagnostic"]')?.getBoundingClientRect().bottom ?? 0,
        detailsHeight: details?.getBoundingClientRect().height ?? 0,
        scrollClientHeight: scroll?.clientHeight ?? 0,
        scrollHeight: scroll?.scrollHeight ?? 0,
        toolbar: getRect('viewport-diagnostic-toolbar'),
        collapse: getRect('viewport-diagnostic-collapse'),
        refresh: getRect('viewport-diagnostic-refresh'),
        copy: getRect('viewport-diagnostic-copy'),
      };
    });
    expect(beforeScroll.panelBottom, 'diagnostic panel must fit within the visual viewport').toBeLessThanOrEqual(beforeScroll.viewportHeight + 1);
    expect(beforeScroll.detailsHeight).toBeGreaterThan(0);
    expect(beforeScroll.scrollHeight, 'full snapshot must scroll inside its own region').toBeGreaterThan(beforeScroll.scrollClientHeight);
    for (const control of [beforeScroll.toolbar, beforeScroll.collapse, beforeScroll.refresh, beforeScroll.copy]) {
      expect(control).not.toBeNull();
      expect(control!.bottom, 'persistent controls must be visible without scrolling snapshot text').toBeLessThanOrEqual(beforeScroll.viewportHeight + 1);
    }

    await scrollRegion.evaluate((element: HTMLElement) => { element.scrollTop = element.scrollHeight; });
    const afterScroll = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="viewport-diagnostic-toolbar"]');
      const rect = element?.getBoundingClientRect();
      return rect ? { top: rect.top, bottom: rect.bottom } : null;
    });
    expect(afterScroll).not.toBeNull();
    expect(Math.abs(afterScroll!.top - beforeScroll.toolbar!.top), 'toolbar must not scroll with JSON body').toBeLessThanOrEqual(1);

    const widths = await getScrollWidths(page);
    expect(widths.body).toBeLessThanOrEqual(402);
    expect(widths.html).toBeLessThanOrEqual(402);
    expect(errors.pageErrors).toEqual([]);
  });

  test('keeps the clipboard-denied fallback inside the diagnostic scroll region', async ({ page, errors }) => {
    await page.setViewportSize({ width: 402, height: 714 });
    await gotoDiagnosticDemo(page);

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('Clipboard deliberately denied for diagnostic fallback test');
          },
        },
      });
    });
    await page.getByTestId('viewport-diagnostic-copy').click();
    const fallback = page.getByTestId('viewport-diagnostic-fallback');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveValue(/"innerWidth"/);

    const fallbackPlacement = await fallback.evaluate(element => {
      const scroll = document.querySelector('[data-testid="viewport-diagnostic-scroll"]');
      return {
        insideScrollRegion: Boolean(scroll?.contains(element)),
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      };
    });
    expect(fallbackPlacement.insideScrollRegion).toBe(true);
    expect(fallbackPlacement.documentWidth).toBeLessThanOrEqual(402);
    expect(fallbackPlacement.bodyWidth).toBeLessThanOrEqual(402);
    expect(errors.pageErrors).toEqual([]);
  });

  test('does not interfere with the bounded long-category item scroller', async ({ page, errors }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoDiagnosticDemo(page);

    await page.getByRole('button', { name: 'Open Kitchen category' }).click();
    // R0102: Add Item now opens a creation accordion — tap Add Item then Name for each row.
    const addBtn = page.getByTestId('cat-add-item-btn');
    const nameBtn = page.getByTestId('add-item-by-name');
    for (let index = 0; index < 14; index += 1) {
      await addBtn.click();
      await nameBtn.waitFor({ state: 'visible', timeout: 2000 });
      await nameBtn.click();
      await nameBtn.waitFor({ state: 'hidden', timeout: 2000 });
    }
    await expect(page.locator('[data-testid="open-cat-items"][data-long-mode="true"]')).toBeVisible({ timeout: 8000 });
    const innerScroll = await page.getByTestId('open-cat-items').evaluate((element: HTMLElement) => {
      element.scrollTop = 0;
      const before = element.scrollTop;
      element.scrollTop = 120;
      return { before, after: element.scrollTop, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight };
    });
    expect(innerScroll.scrollHeight, 'long category must overflow its bounded viewport').toBeGreaterThan(innerScroll.clientHeight);
    expect(innerScroll.after, 'bounded item viewport must remain scrollable').toBeGreaterThan(innerScroll.before);

    await page.getByTestId('viewport-diagnostic-refresh').click();
    const snapshot = await page.getByTestId('viewport-diagnostic-values').evaluate(element =>
      JSON.parse(element.textContent || '{}'),
    );
    expect(snapshot.trailweigh.elements.openLongCategoryViewport).not.toBeNull();
    expect(errors.pageErrors).toEqual([]);
  });
});

test.describe('R0090/R0091 — viewport width safety', () => {

  test('category view: no horizontal overflow at 320 px', async ({ browser, errors }) => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.pageErrors.push(e.message));
    await gotoDemo(page);

    const { body, html } = await getScrollWidths(page);
    expect(body, 'body must not overflow 320 px in category view').toBeLessThanOrEqual(320);
    expect(html,  'html  must not overflow 320 px in category view').toBeLessThanOrEqual(320);
    expect(errors.pageErrors).toEqual([]);
    await ctx.close();
  });

  test('category open + item expanded: no horizontal overflow at 320 px', async ({ browser, errors }) => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.pageErrors.push(e.message));
    await gotoDemo(page);

    // Open first category
    const firstCatBtn = page.getByRole('button', { name: /^Open .+ category$/ }).first();
    await firstCatBtn.click();
    await page.waitForTimeout(350);

    // Expand first item row (if one exists) to expose Location/Photo rows
    const firstItemRow = page.locator('[data-testid="main-scroll"] [data-swipe-key]').first();
    const rowVisible = await firstItemRow.isVisible().catch(() => false);
    if (rowVisible) {
      await firstItemRow.click();
      await page.waitForTimeout(350);
    }

    const { body, html } = await getScrollWidths(page);
    expect(body, 'body must not overflow 320 px after category/item expansion').toBeLessThanOrEqual(320);
    expect(html,  'html  must not overflow 320 px after category/item expansion').toBeLessThanOrEqual(320);
    expect(errors.pageErrors).toEqual([]);
    await ctx.close();
  });

  test('location view toggle: no horizontal overflow at 320 px', async ({ browser, errors }) => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.pageErrors.push(e.message));
    await gotoDemo(page);

    // The location/category toggle appears as an aria-pressed button.
    // It may be absent when the list has no locations — that is fine; we still
    // check that switching to location view (if available) doesn't overflow.
    const locBtn = page.locator('button[aria-pressed]').filter({ hasText: /location/i });
    const locVisible = await locBtn.first().isVisible().catch(() => false);
    if (locVisible) {
      await locBtn.first().click();
      await page.waitForTimeout(350);
    }

    const { body, html } = await getScrollWidths(page);
    expect(body, 'body must not overflow 320 px in location view').toBeLessThanOrEqual(320);
    expect(html,  'html  must not overflow 320 px in location view').toBeLessThanOrEqual(320);
    expect(errors.pageErrors).toEqual([]);
    await ctx.close();
  });

});

test.describe('R0090/R0091 — bottom nav & safe-area CSS', () => {

  test('bottom nav is visible and within viewport at 390×844 (iPhone 14)', async ({ browser, errors }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.pageErrors.push(e.message));
    await gotoDemo(page);

    const nav = page.locator('[data-testid="bottom-nav"]');
    await expect(nav).toBeVisible();

    const box = await nav.boundingBox();
    expect(box, 'bottom-nav bounding box must exist').not.toBeNull();

    // Nav bottom edge must not exceed viewport height (not clipped below fold)
    expect(
      box!.y + box!.height,
      'bottom-nav bottom edge must be within viewport',
    ).toBeLessThanOrEqual(844 + 2); // +2px rounding tolerance

    // Nav must occupy the lower portion of the screen (not floating in the middle)
    expect(box!.y, 'bottom-nav must be in the lower half of the 844px viewport').toBeGreaterThan(420);

    // Nav must have non-trivial height (proves it is rendered, not collapsed)
    expect(box!.height, 'bottom-nav must be at least 44 px tall').toBeGreaterThanOrEqual(44);

    expect(errors.pageErrors).toEqual([]);
    await ctx.close();
  });

  test('safe-area CSS classes are present in rendered CSSOM', async ({ page, errors }) => {
    await gotoDemo(page);

    // R0090 sheet-panel classes rendered by V3 itself
    for (const token of ['tw-sa-36', 'tw-sa-40', 'tw-cat-sheet']) {
      const found = await stylesheetContains(page, token);
      expect(found, `CSS class .${token} must be defined in embedded <style>`).toBe(true);
    }

    // R0091 overlay scroll-area classes
    for (const token of ['tw-sa-8', 'tw-sa-12', 'tw-sa-32']) {
      const found = await stylesheetContains(page, token);
      expect(found, `CSS class .${token} must be defined in embedded <style>`).toBe(true);
    }

    // Master List owns its sheet style locally, so mount that screen before
    // checking the scoped .tw-ms-sheet rule.
    await page.getByTestId('hamburger-btn').click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Master List', exact: true }).click();
    await page.getByTestId('ml-add-btn').click();
    await page.waitForTimeout(150);
    expect(await stylesheetContains(page, 'tw-ms-sheet')).toBe(true);

    expect(errors.pageErrors).toEqual([]);
  });

  test('dvh fallback: .tw-v3-root height:100vh class rule is present in CSSOM', async ({ page, errors }) => {
    await gotoDemo(page);
    // R0090 added height:100vh to .tw-v3-root as a dvh fallback for iOS < 15.4.
    // This verifies the embedded CSS rule was parsed correctly.
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules ?? []);
          for (const r of rules) {
            if (r.cssText.includes('tw-v3-root') && r.cssText.includes('100vh')) return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, '.tw-v3-root must have a height:100vh rule in the embedded CSS').toBe(true);
    expect(errors.pageErrors).toEqual([]);
  });

  test('MasterList sheet .tw-ms-sheet max-height rule uses vh and/or dvh', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByTestId('hamburger-btn').click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Master List', exact: true }).click();
    await page.getByTestId('ml-add-btn').click();
    await page.waitForTimeout(150);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules ?? []);
          for (const r of rules) {
            if (r.cssText.includes('tw-ms-sheet') && r.cssText.includes('max-height')) return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, '.tw-ms-sheet must have a max-height rule').toBe(true);
    expect(errors.pageErrors).toEqual([]);
  });

  test('checklist flow scrolls through the main-scroll div instead of the document', async ({ page, errors }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoDemo(page);
    for (let i = 0; i < 5; i++) {
      await addCategory(page, `Scroll Test ${i}`);
    }
    await page.waitForTimeout(250);

    await page.getByRole('button', { name: /^Open .+ category$/ }).first().click();
    await page.waitForTimeout(350);

    const initial = await page.evaluate(() => ({
      scrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      mainOverflowY: getComputedStyle(document.querySelector('[data-testid="main-scroll"]')!).overflowY,
    }));
    expect(initial.documentScrollTop, 'document must start stationary').toBe(0);
    expect(initial.mainOverflowY, 'main-scroll must be the primary scroller').toBe('auto');

    await page.evaluate(() => {
      const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
      main.scrollTop += 180;
    });
    await page.waitForTimeout(50);
    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      mainScrollTop: document.querySelector('[data-testid="main-scroll"]')?.scrollTop ?? -1,
    }));
    expect(after.scrollY, 'window must remain stationary during checklist scrolling').toBe(0);
    expect(after.documentScrollTop, 'document must remain stationary during checklist scrolling').toBe(0);
    expect(after.mainScrollTop, 'main-scroll must own checklist scrolling').toBeGreaterThan(0);
    expect(errors.pageErrors).toEqual([]);
  });

});
