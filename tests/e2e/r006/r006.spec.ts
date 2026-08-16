/**
 * R006 — long-press reorder, handle removal, gesture arbitration, motion,
 *         overscroll lock, Trail dropdown positioning, More→List Actions edits.
 *
 * Parts covered:
 *  1 six-dot handles removed; text reclaims the reserved columns
 *  2 long-press (400ms) on the category bar enters reorder; tap keeps accordion;
 *    jitter tolerated; movement before threshold hands off to scroll/swipe
 *  3 displaced bars glide (transform transitions); flush settle; commit correct
 *  4 arbitration: swipe-to-delete intact; inert while reorder owns the gesture
 *  5 app shell pinned: no page rubber-band; only internal regions scroll
 *  6 Trail palette dropdown fully inside the viewport at all widths
 *  7 List Actions: Expand All / Collapse All / Summary removed; keepers intact
 *  8 View / Print row present and routed to the existing print flow
 *  9 responsive 320/375/390/430
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page) {
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

const NAV = {
  summary: /^Summary — pack weight and progress/,
  more:    /^More — settings and tools/,
};

async function openDeck(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await page.waitForTimeout(500);
}

function grips(page: Page) {
  return page.getByRole('button', { name: /^Drag to reorder .* category$/ });
}

async function catNames(page: Page): Promise<string[]> {
  return (await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!)));
}

/** 400ms stationary long press on a category bar; leaves the mouse DOWN. */
async function longPressGrab(page: Page, catName: string) {
  const bar = page.locator(`[data-swipe-key="cat:${catName}"]`);
  const b = (await bar.boundingBox())!;
  const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  return { x, y };
}

// ─── Part 1: handle removal ──────────────────────────────────────────────────────

test.describe('R006 handle removal', () => {
  test('no six-dot reorder handles exist anywhere in the category list', async ({ page }) => {
    await gotoV3(page);
    await expect(grips(page)).toHaveCount(0);
    // no aria-grabbed remnants either
    await expect(page.locator('[aria-grabbed]')).toHaveCount(0);
  });

  test('category text reclaims the reserved handle columns (name starts near the wedge)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoV3(page);
    const names = await catNames(page);
    const nameBtn = page.getByRole('button', { name: `Category options for ${names[0]}` });
    const nBox = (await nameBtn.boundingBox())!;
    const card = (await page.locator('[data-cat]').first().boundingBox())!;
    // R005 layout put the name after wedge(~64) + 8 + 36 + 10 ≈ 118px.
    // With the columns reclaimed it must start well left of that.
    expect(nBox.x - card.x).toBeLessThan(100);
  });
});

// ─── Part 2: long-press activation & arbitration ─────────────────────────────────

test.describe('R006 long-press reorder', () => {
  test('quick tap on the wedge still toggles the accordion (no reorder)', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    await page.getByRole('button', { name: `Open ${names[0]} category` }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: `Close ${names[0]} category` })).toBeVisible();
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await page.getByRole('button', { name: `Close ${names[0]} category` }).click();
  });

  test('stationary 400ms hold enters reorder mode: card floats with elevation', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    await longPressGrab(page, names[0]!);
    const floating = page.locator('[data-floating="true"]');
    await expect(floating).toHaveCount(1);
    expect(await floating.getAttribute('data-cat')).toBe(names[0]);
    const shadow = await floating.evaluate(el => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  });

  test('small finger jitter during the hold does NOT cancel activation', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const bar = page.locator(`[data-swipe-key="cat:${names[0]}"]`);
    const b = (await bar.boundingBox())!;
    const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    // jitter within the 10px slop while waiting out the threshold
    await page.mouse.move(x + 4, y + 3);
    await page.mouse.move(x - 3, y - 4);
    await page.waitForTimeout(600);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    await page.mouse.up();
  });

  test('meaningful vertical movement BEFORE the threshold cancels the hold (scroll wins)', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const bar = page.locator(`[data-swipe-key="cat:${names[0]}"]`);
    const b = (await bar.boundingBox())!;
    const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 40, { steps: 4 }); // > slop, before 400ms
    await page.waitForTimeout(600);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await page.mouse.up();
    // and the accordion did not toggle from that gesture
    await expect(page.getByRole('button', { name: `Close ${names[0]} category` })).toHaveCount(0);
  });

  test('releasing a long press without moving does not toggle the accordion or open options', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    await longPressGrab(page, names[0]!);
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: `Close ${names[0]} category` })).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // order unchanged
    expect(await catNames(page)).toEqual(names);
  });

  test('long press produces no text selection', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    await longPressGrab(page, names[0]!);
    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selected).toBe('');
    await page.mouse.up();
  });
});

// ─── Hold-lifecycle hardening (review round) ─────────────────────────────────────

test.describe('R006 hold lifecycle hardening', () => {
  test('pointerup delivered OUTSIDE the bar before the threshold defuses the hold (no ghost drag)', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const bar = page.locator(`[data-swipe-key="cat:${names[0]}"]`);
    const b = (await bar.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.35, b.y + b.height / 2);
    await page.mouse.down();
    // move within slop, then release over a DIFFERENT element before 400ms
    await page.mouse.move(b.x + b.width * 0.35 + 4, b.y + b.height / 2 + 4);
    await page.mouse.up();
    await page.waitForTimeout(700); // past the threshold — timer must NOT fire
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  });

  test('pointercancel during the hold defuses it; the NEXT tap still works normally', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const bar = page.locator(`[data-swipe-key="cat:${names[0]}"]`);
    const b = (await bar.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.35, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(150); // mid-hold, before threshold
    await bar.dispatchEvent('pointercancel', { pointerId: 1, bubbles: true });
    await page.waitForTimeout(600);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await page.mouse.up();
    // first legitimate click after the cancellation is NOT swallowed
    await page.getByRole('button', { name: `Open ${names[0]} category` }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: `Close ${names[0]} category` })).toBeVisible();
  });

  test('a terminal event from an UNRELATED pointer does not defuse the armed hold', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const bar = page.locator(`[data-swipe-key="cat:${names[0]}"]`);
    const b = (await bar.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.35, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(120);
    // pointerup for a DIFFERENT pointer id, dispatched at the document
    await page.evaluate(() => {
      document.body.dispatchEvent(new PointerEvent('pointerup', { pointerId: 42, bubbles: true }));
    });
    await page.waitForTimeout(500); // threshold passes with OUR pointer still down
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  });

  test('after a mid-drag blur cancellation, the next category tap is not swallowed', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const { x, y } = await longPressGrab(page, names[0]!);
    await page.mouse.move(x, y + 40, { steps: 4 });
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(400); // swallow flag self-clears (300ms)
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await page.mouse.up();
    await page.getByRole('button', { name: `Open ${names[0]} category` }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: `Close ${names[0]} category` })).toBeVisible();
  });
});

// ─── Part 3: motion & commit ─────────────────────────────────────────────────────

test.describe('R006 reorder motion', () => {
  test('displaced bar carries a transform transition (glides, not jumps) while DOM order stays fixed', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    test.skip(names.length < 3, 'needs 3+ categories');
    const row1 = (await page.locator('[data-cat]').nth(1).boundingBox())!;
    const { x } = await longPressGrab(page, names[0]!);
    await page.mouse.move(x, row1.y + row1.height * 0.8, { steps: 6 });
    await page.waitForTimeout(250);
    // DOM order unchanged during drag (no re-splice)
    expect(await catNames(page)).toEqual(names);
    // the displaced bar is translated with a transition on transform
    const displaced = page.locator('[data-cat]').nth(1);
    const style = await displaced.evaluate(el => {
      const cs = getComputedStyle(el as HTMLElement);
      return { transform: cs.transform, transition: cs.transitionProperty };
    });
    expect(style.transform).not.toBe('none');
    expect(style.transition).toContain('transform');
    await page.mouse.up();
    await page.waitForTimeout(400);
    // flush settle: no transforms, no dim, no floating; order committed
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
    const transforms = await page.locator('[data-cat]').evaluateAll(els =>
      els.map(el => getComputedStyle(el as HTMLElement).transform));
    for (const t of transforms) expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
    const after = await catNames(page);
    expect(after[0]).toBe(names[1]);
    expect(after[1]).toBe(names[0]);
  });

  test('multi-row drag commits the full displacement', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    test.skip(names.length < 4, 'needs 4+ categories');
    const row2 = (await page.locator('[data-cat]').nth(2).boundingBox())!;
    const { x } = await longPressGrab(page, names[0]!);
    await page.mouse.move(x, row2.y + row2.height * 0.8, { steps: 10 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await catNames(page);
    expect(after[2]).toBe(names[0]);
    expect(after[0]).toBe(names[1]);
  });
});

// ─── Part 4: arbitration with slide-to-delete ────────────────────────────────────

test.describe('R006 gesture arbitration', () => {
  test('right-edge left swipe still reveals Delete without any hold delay', async ({ page }) => {
    await gotoV3(page);
    const row = page.locator('[data-swipe-key^="cat:"]').first();
    const box = (await row.boundingBox())!;
    await page.mouse.move(box.x + box.width - 6, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 96, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-swipe-open="true"]')).toHaveCount(1);
    // no reorder was triggered
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    // close it
    await page.mouse.click(box.x + 20, box.y + box.height / 2);
  });

  test('while reorder owns the gesture, horizontal wobble never reveals Delete', async ({ page }) => {
    await gotoV3(page);
    const names = await catNames(page);
    const { x, y } = await longPressGrab(page, names[0]!);
    // wobble horizontally mid-drag
    await page.mouse.move(x - 60, y + 30, { steps: 6 });
    await page.mouse.move(x + 20, y + 60, { steps: 6 });
    await page.waitForTimeout(150);
    await expect(page.locator('[data-swipe-open="true"]')).toHaveCount(0);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    await page.mouse.up();
  });
});

// ─── Part 5: overscroll / app shell pinning ──────────────────────────────────────

test.describe('R006 app shell pinning', () => {
  test('html/body block overscroll and page-level scrolling', async ({ page }) => {
    await gotoV3(page);
    const css = await page.evaluate(() => ({
      htmlOb: getComputedStyle(document.documentElement).overscrollBehaviorY,
      bodyOb: getComputedStyle(document.body).overscrollBehaviorY,
      bodyOverflow: getComputedStyle(document.body).overflow,
      scrollerOb: getComputedStyle(document.querySelector('[data-testid="main-scroll"]')!).overscrollBehaviorY,
    }));
    expect(css.htmlOb).toBe('none');
    expect(css.bodyOb).toBe('none');
    expect(css.bodyOverflow).toBe('hidden');
    expect(css.scrollerOb).toBe('contain');
  });

  test('header and bottom nav stay anchored while the internal region scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await gotoV3(page);
    const header = page.getByText('TrailWeigh', { exact: true }).first();
    const nav = page.getByRole('button', { name: NAV.more });
    const h0 = (await header.boundingBox())!;
    const n0 = (await nav.boundingBox())!;
    await page.getByTestId('main-scroll').evaluate(el => el.scrollTo(0, 300));
    await page.waitForTimeout(150);
    const h1 = (await header.boundingBox())!;
    const n1 = (await nav.boundingBox())!;
    expect(Math.abs(h1.y - h0.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(n1.y - n0.y)).toBeLessThanOrEqual(1);
    // window itself did not scroll
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

// ─── Part 6: Trail palette dropdown ─────────────────────────────────────────────

for (const width of [320, 375, 390, 430]) {
  test(`R006 palette dropdown fully in viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await gotoV3(page);
    await openDeck(page, NAV.summary);
    await page.getByRole('button', { name: /^Weight Distribution — open card/ }).click();
    await page.waitForTimeout(400);
    const deck = page.getByTestId('deck-panel');
    const pill = deck.getByRole('button', { name: /palette|Trail|Desert|Forest|Alpine/i }).first();
    await pill.scrollIntoViewIfNeeded();
    await pill.click();
    await page.waitForTimeout(250);
    // the open menu lists palette options; find its container
    const option = page.getByRole('button', { name: /^(Trail|Desert|Forest|Alpine|Meadow|Slate|Autumn)$/i }).first();
    await expect(option).toBeVisible();
    const menuBox = (await option.locator('xpath=ancestor::div[1]').boundingBox())!;
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width + 1);
    // no clipping: the option itself is fully visible and clickable
    const oBox = (await option.boundingBox())!;
    expect(oBox.x).toBeGreaterThanOrEqual(0);
    expect(oBox.x + oBox.width).toBeLessThanOrEqual(width + 1);
  });
}

// ─── Parts 7+8: More → List Actions ─────────────────────────────────────────────

test.describe('R006 List Actions', () => {
  async function openListActions(page: Page) {
    await openDeck(page, NAV.more);
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await page.waitForTimeout(400);
    return page.getByTestId('deck-panel');
  }

  test('Expand All, Collapse All, and Summary rows are gone; keepers remain in order', async ({ page }) => {
    await gotoV3(page);
    const deck = await openListActions(page);
    for (const gone of ['Expand All', 'Collapse All']) {
      await expect(deck.getByText(gone, { exact: true })).toHaveCount(0);
    }
    await expect(deck.getByRole('button', { name: /^Summary$/ })).toHaveCount(0);
    const labels = (await deck.locator('button').allTextContents()).map(t => t.trim());
    const keep = labels.filter(t => ['Save', 'Undo', 'Redo', 'Reset', 'Checklist', 'View / Print'].some(k => t.startsWith(k)));
    expect(keep.length).toBe(6);
    // View / Print comes after Checklist
    const iCheck = keep.findIndex(t => t.startsWith('Checklist'));
    const iPrint = keep.findIndex(t => t.startsWith('View / Print'));
    expect(iPrint).toBe(iCheck + 1);
  });

  test('View / Print routes to the existing print flow (PDF + print) safely', async ({ page }) => {
    await page.addInitScript(() => { (window as any).print = () => { (window as any).__printed = true; }; });
    await gotoV3(page);
    const deck = await openListActions(page);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
      deck.getByRole('button', { name: /^View \/ Print/ }).click(),
    ]);
    await page.waitForTimeout(600);
    const printed = await page.evaluate(() => (window as any).__printed === true);
    expect(printed || !!download).toBe(true);
    // deck closed after the action (runAndClose)
    await expect(page.getByTestId('deck-panel')).toHaveCount(0);
  });

  test('Checklist row still opens the checklist overlay', async ({ page }) => {
    await gotoV3(page);
    const deck = await openListActions(page);
    await deck.getByRole('button', { name: /^Checklist/ }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('button', { name: 'Close checklist' })).toBeVisible();
  });
});

// ─── Part 9: responsive ─────────────────────────────────────────────────────────

for (const width of [320, 375, 390, 430]) {
  test(`R006 responsive ${width}px — no handles, no overflow, reorder works`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await gotoV3(page);
    await expect(grips(page)).toHaveCount(0);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // long-press reorder functions at this width
    const names = await catNames(page);
    const row1 = (await page.locator('[data-cat]').nth(1).boundingBox())!;
    const { x } = await longPressGrab(page, names[0]!);
    await page.mouse.move(x, row1.y + row1.height * 0.8, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await catNames(page);
    expect(after[0]).toBe(names[1]);
  });
}
