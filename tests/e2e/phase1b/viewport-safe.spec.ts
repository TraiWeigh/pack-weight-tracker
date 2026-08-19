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

// ── Tests ─────────────────────────────────────────────────────────────────────

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

  test('document flow scrolls through window instead of the main-scroll div', async ({ page, errors }) => {
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
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      mainOverflowY: getComputedStyle(document.querySelector('[data-testid="main-scroll"]')!).overflowY,
    }));
    expect(initial.documentHeight, 'document must be taller than the viewport').toBeGreaterThan(initial.viewportHeight);
    expect(initial.mainOverflowY, 'main-scroll must not be the primary scroller').not.toBe('auto');

    await page.evaluate(() => window.scrollBy(0, 180));
    await page.waitForTimeout(50);
    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      mainScrollTop: document.querySelector('[data-testid="main-scroll"]')?.scrollTop ?? -1,
    }));
    expect(after.scrollY, 'window scrollY must change during document scrolling').toBeGreaterThan(0);
    expect(after.mainScrollTop, 'main-scroll must remain stationary').toBe(0);
    expect(errors.pageErrors).toEqual([]);
  });

});
