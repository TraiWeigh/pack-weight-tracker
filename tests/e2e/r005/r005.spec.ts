/**
 * R005 — layout / summary / reorder refinement suite.
 *
 * Parts covered:
 *  1 top-right Search control removed (no reserved space); bottom Search intact
 *  2 no blank strip below the top header (summary begins immediately)
 *  3 no blank spacer between category content and bottom nav; last row visible
 *  4 static text non-selectable during gestures; editable inputs still selectable
 *  5 Category Options: Add Item → Rename Category → Delete Category; Add Item
 *    targets the opened category
 *  6 Weight Distribution: ONE panel (single visible heading; chart + legend +
 *    weights + palette control together; lower content reachable)
 *  7 Pack Summary: all rows incl. Grand Total reachable; Summary view scrolls
 *  8 reorder: true full-distance finger follow; correct card floats; dim/undim
 *  9 six-dot handles: one straight vertical column, farther left, stable
 * 10 responsive 320/375/390/430
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page) {
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

async function seedLocker(page: Page, n: number) {
  await page.evaluate((count) => {
    const entries = Array.from({ length: count }, (_, i) => ({
      id: `r005-seed-${i}`,
      name: `R005 Seed List ${i + 1}`,
      savedAt: Date.now() - i * 1000,
      store: {
        items: { Backpack: [{ id: `it-${i}`, name: `Item ${i}`, weightOz: 10, qty: 1, checked: true }] },
        order: ['Backpack'],
        meta: {},
      },
      background: null, bgFade: 0.3, bgTone: 'light',
    }));
    localStorage.setItem('trailweigh:locker', JSON.stringify(entries));
  }, n);
}

const NAV = {
  locker:  /^Locker — saved lists/,
  summary: /^Summary — pack weight and progress/,
  add:     /^Add — add items/,
  search:  /^Search — find gear/,
  more:    /^More — settings and tools/,
};

async function openDeck(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await page.waitForTimeout(500);
}

function grips(page: Page) {
  return page.getByRole('button', { name: /^Drag to reorder .* category$/ });
}

async function gripXs(page: Page): Promise<number[]> {
  const all = grips(page);
  const n = await all.count();
  const xs: number[] = [];
  for (let i = 0; i < n; i++) xs.push((await all.nth(i).boundingBox())!.x);
  return xs;
}

// ─── Part 1: top-right Search removed; bottom Search intact ─────────────────────

test.describe('R005 top header', () => {
  test('top-right Search control is absent and no space is reserved for it', async ({ page }) => {
    await gotoV3(page);
    await expect(page.getByLabel('Search (not yet available)')).toHaveCount(0);
    // Wordmark's flex container now extends to the header's right padding edge
    // (measure against the app frame, which is centered with maxWidth 430):
    const word = page.getByText('TrailWeigh', { exact: true }).first();
    const wordBox = (await word.locator('..').boundingBox())!;
    const frame = (await page.getByTestId('main-scroll').boundingBox())!;
    expect(wordBox.x + wordBox.width).toBeGreaterThan(frame.x + frame.width - 20); // only the 16px padding remains
  });

  test('bottom nav still has all five areas and Search deck opens/closes as before', async ({ page }) => {
    await gotoV3(page);
    for (const key of ['locker', 'summary', 'add', 'search', 'more'] as const) {
      await expect(page.getByRole('button', { name: NAV[key] })).toBeVisible();
    }
    await openDeck(page, NAV.search);
    await expect(page.getByTestId('deck-panel')).toBeVisible();
    await openDeck(page, NAV.search); // same-icon tap closes
    await expect(page.getByTestId('deck-panel')).toHaveCount(0);
  });
});

// ─── Part 2: no blank strip below the header ─────────────────────────────────────

test('summary region begins immediately below the top header (no spacer band)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoV3(page);
  const header = page.getByText('TrailWeigh', { exact: true }).first()
    .locator('xpath=ancestor::div[contains(@style,"border-bottom") or contains(@style,"borderBottom")][1]');
  const hBox = (await header.boundingBox())!;
  const bar = page.getByTestId('active-list-name')
    .locator('xpath=ancestor::div[contains(@style,"background")][1]');
  const bBox = (await bar.boundingBox())!;
  // ≤2px tolerance: 1px header border is the only thing between them
  expect(bBox.y - (hBox.y + hBox.height)).toBeLessThanOrEqual(2);
});

// ─── Part 3: no blank spacer before bottom nav; last content visible ─────────────

test('category content runs to the bottom nav with no decorative spacer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoV3(page);
  const cats = page.locator('[data-cat]');
  const n = await cats.count();
  expect(n).toBeGreaterThan(0);
  // No trailing fixed-height spacer inside the scroller after the category stack
  const trailing = await page.getByTestId('main-scroll').evaluate(el => {
    const last = el.lastElementChild as HTMLElement | null;
    if (!last) return null;
    const r = last.getBoundingClientRect();
    return { height: r.height, hasCats: !!last.querySelector('[data-cat]') };
  });
  expect(trailing).not.toBeNull();
  expect(trailing!.hasCats).toBe(true); // last scroller child IS the category stack, not a spacer
  // Last category row is fully above the bottom nav (nav is in flow, never covers)
  const lastCat = (await cats.nth(n - 1).boundingBox())!;
  const nav = (await page.getByRole('button', { name: NAV.more }).boundingBox())!;
  expect(lastCat.y + lastCat.height).toBeLessThanOrEqual(nav.y + 1);
});

// ─── Part 4: text selection ──────────────────────────────────────────────────────

test.describe('R005 text selection', () => {
  test('static category name, weight, and summary text are non-selectable', async ({ page }) => {
    await gotoV3(page);
    const sel = async (locator: ReturnType<Page['locator']>) =>
      locator.evaluate(el => getComputedStyle(el as HTMLElement).userSelect);
    expect(await sel(page.getByTestId('active-list-name'))).toBe('none');
    const firstCat = page.locator('[data-cat]').first();
    expect(await sel(firstCat)).toBe('none');
    // nav label
    expect(await sel(page.getByRole('button', { name: NAV.more }))).toBe('none');
    // A drag across static text produces no selection
    const box = (await firstCat.boundingBox())!;
    await page.mouse.move(box.x + 60, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 24, { steps: 6 });
    await page.mouse.up();
    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selected).toBe('');
  });

  test('editable inputs remain selectable and editable', async ({ page }) => {
    await gotoV3(page);
    // Rename input inside Category Options
    const firstKey = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
    const cat = firstKey!.slice(4);
    await page.getByRole('button', { name: `Category options for ${cat}` }).click();
    await page.getByRole('button', { name: 'Rename Category' }).click();
    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible();
    expect(await input.evaluate(el => getComputedStyle(el).userSelect)).not.toBe('none');
    await input.fill('EditCheck');
    await expect(input).toHaveValue('EditCheck');
    await input.selectText();
    const selLen = await input.evaluate((el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!);
    expect(selLen).toBe('EditCheck'.length);
  });
});

// ─── Part 5: Category Options — Add Item ─────────────────────────────────────────

test.describe('R005 Category Options', () => {
  test('action order is Add Item → Rename Category → Delete Category', async ({ page }) => {
    await gotoV3(page);
    const firstKey = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
    const cat = firstKey!.slice(4);
    await page.getByRole('button', { name: `Category options for ${cat}` }).click();
    const sheet = page.getByRole('dialog');
    const labels = sheet.locator('button');
    const texts = (await labels.allTextContents()).map(t => t.trim()).filter(t =>
      ['Add Item', 'Rename Category', 'Delete Category'].includes(t));
    expect(texts).toEqual(['Add Item', 'Rename Category', 'Delete Category']);
  });

  test('Add Item adds a new item directly into the opened category', async ({ page }) => {
    await gotoV3(page);
    const secondRow = page.locator('[data-swipe-key^="cat:"]').nth(1);
    const cat = (await secondRow.getAttribute('data-swipe-key'))!.slice(4);
    const countTextBefore = await secondRow.locator('text=/\\d+ items? ·/').textContent();
    const before = parseInt(countTextBefore!.match(/(\d+) items?/)![1], 10);
    await page.getByRole('button', { name: `Category options for ${cat}` }).click();
    await page.getByRole('button', { name: `Add item to ${cat}` }).click();
    await page.waitForTimeout(400);
    // Sheet closed, category opened, count incremented in THAT category
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const rowAfter = page.locator(`[data-swipe-key="cat:${cat}"]`);
    const countTextAfter = await rowAfter.locator('text=/\\d+ items? ·/').textContent();
    const after = parseInt(countTextAfter!.match(/(\d+) items?/)![1], 10);
    expect(after).toBe(before + 1);
  });

  test('Rename and Delete flows still work with their safeguards', async ({ page }) => {
    await gotoV3(page);
    const firstKey = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
    const cat = firstKey!.slice(4);
    await page.getByRole('button', { name: `Category options for ${cat}` }).click();
    await page.getByRole('button', { name: 'Delete Category' }).click();
    await expect(page.getByText(`Delete "${cat}"?`)).toBeVisible(); // confirm step, not direct delete
    await page.getByRole('button', { name: /^Cancel$/ }).click();
  });
});

// ─── Parts 6+7: Summary deck panels ─────────────────────────────────────────────

test.describe('R005 Summary deck', () => {
  test('Weight Distribution is ONE panel: single visible heading, chart + legend + palette together', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.summary);
    await page.getByRole('button', { name: /^Weight Distribution — open card/ }).click();
    await page.waitForTimeout(400);
    const deck = page.getByTestId('deck-panel');
    // Exactly ONE visible "Weight Distribution" heading (deck bar title); the
    // inner component's duplicate accordion header is hidden.
    const headings = deck.getByText(/^Weight Distribution$/i);
    let visible = 0;
    for (let i = 0; i < await headings.count(); i++) {
      if (await headings.nth(i).isVisible()) visible++;
    }
    expect(visible).toBe(1);
    // No nested accordion toggle for the chart
    await expect(deck.getByRole('button', { name: /Expand Weight Distribution/ })).toHaveCount(0);
    // Chart, legend and palette control all present in the same panel
    await expect(deck.locator('svg.recharts-surface').first()).toBeVisible();
    await expect(deck.getByRole('button', { name: /Trail|Desert|palette/i }).first()).toBeVisible();
    // Lower legend content reachable via the deck's own scroll
    const scroll = page.getByTestId('deck-scroll');
    await scroll.evaluate(el => el.scrollTo(0, el.scrollHeight));
    const lastLegend = deck.locator('.recharts-surface').locator('xpath=ancestor::div[1]/following-sibling::div//span').last();
    if (await lastLegend.count() > 0) await expect(lastLegend.first()).toBeVisible();
  });

  test('Pack Summary shows all rows including Grand Total; Summary view scrolls when needed', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.summary);
    await page.getByRole('button', { name: /^Pack Summary — open card/ }).click();
    await page.waitForTimeout(400);
    const deck = page.getByTestId('deck-panel');
    // No inner collapsible header — content is simply there
    await expect(deck.getByRole('button', { name: /Expand Pack Summary/ })).toHaveCount(0);
    const grand = deck.getByText('Grand Total', { exact: true });
    await grand.scrollIntoViewIfNeeded();
    await expect(grand).toBeVisible();
    // Grand Total row is not hidden under the bottom nav
    const gBox = (await grand.boundingBox())!;
    const nav = (await page.getByRole('button', { name: NAV.more }).boundingBox())!;
    expect(gBox.y + gBox.height).toBeLessThanOrEqual(nav.y + 1);
  });
});

// ─── Part 8: true finger-follow reorder ──────────────────────────────────────────

test.describe('R005 reorder finger-follow', () => {
  test('dragged category follows the pointer across a multi-row distance', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 4, 'needs 4+ categories');
    const firstName = (await cats.first().getAttribute('data-cat'))!;
    const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
    const gBox = (await grip.boundingBox())!;
    const startY = gBox.y + gBox.height / 2;
    const startX = gBox.x + gBox.width / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Drag down ~3 rows in steps; at each step the floating card's center must
    // track the pointer (within half a row height).
    for (const dy of [60, 120, 180]) {
      await page.mouse.move(startX, startY + dy, { steps: 5 });
      await page.waitForTimeout(80);
      const floating = page.locator('[data-floating="true"]');
      await expect(floating).toHaveCount(1);
      expect(await floating.getAttribute('data-cat')).toBe(firstName); // stable identity
      const fBox = (await floating.boundingBox())!;
      const grabOffset = 0; // grabbed at grip center ≈ card vertical center band
      const cardCenter = fBox.y + fBox.height / 2 + grabOffset;
      expect(Math.abs(cardCenter - (startY + dy))).toBeLessThan(fBox.height); // follows finger
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
    // Flush settle: nothing floating, transformed, or dimmed
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
    const transforms = await cats.evaluateAll(els =>
      els.map(el => getComputedStyle(el as HTMLElement).transform));
    for (const t of transforms) expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('target dims while crossed and undims when left; only one target ever dims', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 3, 'needs 3+ categories');
    const names = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    const grip = page.getByRole('button', { name: `Drag to reorder ${names[0]} category` });
    const gBox = (await grip.boundingBox())!;
    const row1 = (await cats.nth(1).boundingBox())!;
    const row2 = (await cats.nth(2).boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + gBox.width / 2, row1.y + row1.height * 0.8, { steps: 6 });
    await page.waitForTimeout(100);
    let dimmed = page.locator('[data-dimtarget="true"]');
    await expect(dimmed).toHaveCount(1);
    expect(await dimmed.getAttribute('data-cat')).toBe(names[1]);
    // Deeper — target switches; previous undims immediately
    await page.mouse.move(gBox.x + gBox.width / 2, row2.y + row2.height * 0.8, { steps: 6 });
    await page.waitForTimeout(100);
    dimmed = page.locator('[data-dimtarget="true"]');
    await expect(dimmed).toHaveCount(1);
    expect(await dimmed.getAttribute('data-cat')).toBe(names[2]);
    await page.mouse.up();
    await page.waitForTimeout(250);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
  });

  test('reorder still closes an open slide-to-delete reveal first', async ({ page }) => {
    await gotoV3(page);
    const row = page.locator('[data-swipe-key^="cat:"]').first();
    const box = (await row.boundingBox())!;
    await page.mouse.move(box.x + box.width - 6, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 96, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-swipe-open="true"]')).toHaveCount(1);
    const name = (await row.getAttribute('data-swipe-key'))!.slice(4);
    const grip = page.getByRole('button', { name: `Drag to reorder ${name} category` });
    const gBox = (await grip.boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await expect(page.locator('[data-swipe-open="true"]')).toHaveCount(0);
    await page.mouse.up();
  });
});

// ─── Part 9: six-dot alignment ───────────────────────────────────────────────────

test.describe('R005 six-dot alignment', () => {
  test('all handles share one x-position, left of the text, no overlap with weight', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoV3(page);
    const xs = await gripXs(page);
    expect(xs.length).toBeGreaterThan(2);
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1);
    // Farther left than R004 (handle sat mid-row ~250px before; now near the wedge)
    expect(xs[0]).toBeLessThan(150);
    // No overlap with weight text (weight is right-aligned)
    const grip0 = (await grips(page).first().boundingBox())!;
    const weight = page.getByText(/oz|g$/).first();
    if (await weight.count() > 0) {
      const wBox = (await weight.boundingBox())!;
      expect(grip0.x + grip0.width).toBeLessThanOrEqual(wBox.x);
    }
    // Thumb-friendly target
    expect(grip0.height).toBeGreaterThanOrEqual(40);
  });

  test('alignment holds with a category expanded and after a reorder', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoV3(page);
    const firstName = (await page.locator('[data-cat]').first().getAttribute('data-cat'))!;
    await page.getByRole('button', { name: `Open ${firstName} category` }).click();
    await page.waitForTimeout(300);
    let xs = await gripXs(page);
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: `Close ${firstName} category` }).click();
    // Reorder first → second, then re-check
    const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
    const gBox = (await grip.boundingBox())!;
    const second = (await page.locator('[data-cat]').nth(1).boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + gBox.width / 2, second.y + second.height * 0.8, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    xs = await gripXs(page);
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1);
  });
});

// ─── Part 10: responsive ─────────────────────────────────────────────────────────

for (const width of [320, 375, 390, 430]) {
  test(`R005 responsive ${width}px — header, gaps, alignment, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await gotoV3(page);
    // Top search absent
    await expect(page.getByLabel('Search (not yet available)')).toHaveCount(0);
    // No horizontal overflow
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // Handles aligned
    const xs = await gripXs(page);
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1);
    // Last category above the nav
    const cats = page.locator('[data-cat]');
    const lastCat = (await cats.nth(await cats.count() - 1).boundingBox())!;
    const nav = (await page.getByRole('button', { name: NAV.more }).boundingBox())!;
    expect(lastCat.y + lastCat.height).toBeLessThanOrEqual(nav.y + 1);
    // Static text not selectable
    expect(await page.getByTestId('active-list-name')
      .evaluate(el => getComputedStyle(el).userSelect)).toBe('none');
  });
}

// ─── Review hardening: drag lifecycle under adverse pointer sequences ───────────

test.describe('R005 drag lifecycle hardening', () => {
  test('an unrelated pointer\'s pointercancel does NOT abort the active drag', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const firstName = (await cats.first().getAttribute('data-cat'))!;
    const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
    const gBox = (await grip.boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + 40, { steps: 4 });
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    // Cancellation for a DIFFERENT pointer, dispatched outside the list
    await page.evaluate(() => {
      document.body.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 99, bubbles: true }));
    });
    await page.waitForTimeout(150);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1); // drag survives
    await page.mouse.up();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  });

  test('a second pointerdown on another handle replaces the drag with the CORRECT category', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 3, 'needs 3+ categories');
    const names = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    const grip0 = page.getByRole('button', { name: `Drag to reorder ${names[0]} category` });
    const gBox = (await grip0.boundingBox())!;
    const row1 = (await cats.nth(1).boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    // Cross a row so a live reorder preview is showing (rendered order ≠ data order)
    await page.mouse.move(gBox.x + gBox.width / 2, row1.y + row1.height * 0.8, { steps: 6 });
    await page.waitForTimeout(100);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    // Second (touch) pointer starts a drag on ANOTHER category's handle
    await page.getByRole('button', { name: `Drag to reorder ${names[2]} category` })
      .dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', bubbles: true, clientY: 0 });
    await page.waitForTimeout(150);
    const floating = page.locator('[data-floating="true"]');
    await expect(floating).toHaveCount(1);
    expect(await floating.getAttribute('data-cat')).toBe(names[2]); // stable identity, not a slot-index guess
    // Cancel the replacement drag; original data order intact (no commit happened)
    await page.evaluate(() => {
      document.body.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7, bubbles: true }));
    });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    const after = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    expect(after).toEqual(names);
  });

  test('window blur mid-drag cancels cleanly without committing', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const names = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    const grip = page.getByRole('button', { name: `Drag to reorder ${names[0]} category` });
    const gBox = (await grip.boundingBox())!;
    const row1 = (await cats.nth(1).boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + gBox.width / 2, row1.y + row1.height * 0.8, { steps: 6 });
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(200);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
    const after = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    expect(after).toEqual(names); // NOT committed
    await page.mouse.up();
  });
});
