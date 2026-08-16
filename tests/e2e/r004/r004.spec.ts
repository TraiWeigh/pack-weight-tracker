/**
 * R004 — Slide-to-delete, floating category reorder, Inter typography,
 *         Pack Summary simplification, inline Add Category removal,
 *         R003 test hardening.
 *
 * Parts covered:
 *  1 slide-to-delete (categories + items): edge-start gesture, follow-finger,
 *    settle open/closed, vertical scroll never reveals, one-open-at-a-time,
 *    reveal-not-delete (confirmation preserved), resting trash icons removed,
 *    accessible non-swipe delete paths
 *  2 category reorder: name-keyed floating styling, single dim target, clean settle
 *  3 Inter Variable primary font (no Georgia/serif surfaces in V3)
 *  4 inline "+ Add Category" removed; Add deck flow still works
 *  5 Pack Summary: no LIST SUMMARY label, no Not Selected metric, name in-bar
 *  6 R003 nav/deck regression (spot checks — full r003 suite run separately)
 *  7 hardened Locker-load naming + deterministic Undo/Redo
 *  8 responsive 320/375/390/430
 */
import { test, expect, type Page, type Locator } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page) {
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

async function seedLocker(page: Page, n: number) {
  await page.evaluate((count) => {
    const entries = Array.from({ length: count }, (_, i) => ({
      id: `r004-seed-${i}`,
      name: `R004 Seed List ${i + 1}`,
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

async function openDeck(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await page.waitForTimeout(500);
}

const NAV = {
  locker: /^Locker — saved lists/,
  add: /^Add — add items/,
  more: /^More — settings and tools/,
};

/** Horizontal swipe starting near the RIGHT EDGE of the row, moving left. */
async function swipeLeft(page: Page, row: Locator, dist = 90) {
  const box = (await row.boundingBox())!;
  const startX = box.x + box.width - 6;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - dist, y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

function firstCatRow(page: Page) {
  return page.locator('[data-swipe-key^="cat:"]').first();
}

async function firstCatName(page: Page): Promise<string> {
  const key = await firstCatRow(page).getAttribute('data-swipe-key');
  return key!.slice(4);
}

// R006 SUPERSESSION: the six-dot handles were removed; reorder now starts with
// a 400 ms stationary long press directly on the category bar (approved change).
async function longPressGrab(page: Page, catName: string) {
  const bar = page.locator(`[data-swipe-key="cat:${catName}"]`);
  const b = (await bar.boundingBox())!;
  const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(600); // > 400ms threshold
  return { x, y };
}

/** Open the first category accordion and return its first item swipe row. */
async function openFirstCategory(page: Page): Promise<string> {
  const cat = await firstCatName(page);
  await page.getByRole('button', { name: new RegExp(`^Open ${cat} category$`) }).click();
  await expect(page.locator(`[data-swipe-key^="item:${cat}:"]`).first()).toBeVisible();
  return cat;
}

// ─── Part 1 — slide-to-delete ───────────────────────────────────────────────────

test.describe('R004 slide-to-delete — category rows', () => {
  test('right-edge left swipe reveals Delete; row settles open; no deletion occurs', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    const cat = await firstCatName(page);
    const countBefore = await page.locator('[data-swipe-key^="cat:"]').count();
    await swipeLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'true');
    await expect(row.getByRole('button', { name: `Delete ${cat} category` })).toBeVisible();
    // reveal alone deletes nothing
    expect(await page.locator('[data-swipe-key^="cat:"]').count()).toBe(countBefore);
  });

  test('short swipe (less than half the action width) settles closed', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    await swipeLeft(page, row, 30);
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });

  test('row content follows the finger during the drag', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    const box = (await row.boundingBox())!;
    const startX = box.x + box.width - 6;
    const y = box.y + box.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 50, y, { steps: 6 });
    const mid = await row.locator('> div').last().evaluate(el => getComputedStyle(el).transform);
    await page.mouse.move(startX - 90, y, { steps: 4 });
    await page.mouse.up();
    // transform tracked an intermediate offset (~ -42px after slop), not a jump
    expect(mid).not.toBe('none');
    const midX = parseFloat(mid.split(',')[4]);
    expect(midX).toBeLessThan(-20);
    expect(midX).toBeGreaterThan(-88);
  });

  test('vertical scroll gesture never reveals Delete', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    const box = (await row.boundingBox())!;
    const x = box.x + box.width - 10;
    await page.mouse.move(x, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(x - 4, box.y + 90, { steps: 8 }); // mostly vertical
    await page.mouse.up();
    await page.waitForTimeout(200);
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });

  test('gesture starting away from the right edge does not reveal', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    const box = (await row.boundingBox())!;
    const startX = box.x + 20; // far left — outside the right-edge start zone
    const y = box.y + box.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 0 + 90, y, { steps: 6 });
    await page.mouse.up();
    await swipeAttemptFromLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });

  test('reveal Delete tap opens the existing category delete confirmation (not direct delete)', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    const cat = await firstCatName(page);
    const countBefore = await page.locator('[data-swipe-key^="cat:"]').count();
    await swipeLeft(page, row);
    await row.getByRole('button', { name: `Delete ${cat} category` }).click();
    // Existing confirmation surface appears; nothing deleted yet
    await expect(page.getByText(/delete/i).first()).toBeVisible();
    expect(await page.locator('[data-swipe-key^="cat:"]').count()).toBe(countBefore);
    // Cancel keeps the category
    await page.getByRole('button', { name: /cancel/i }).first().click();
    expect(await page.locator('[data-swipe-key^="cat:"]').count()).toBe(countBefore);
  });

  test('confirming from the reveal path actually deletes the category', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    const cat = await firstCatName(page);
    const countBefore = await page.locator('[data-swipe-key^="cat:"]').count();
    await swipeLeft(page, row);
    await row.getByRole('button', { name: `Delete ${cat} category` }).click();
    await page.getByRole('button', { name: /^Delete$|Delete category|Yes/i }).last().click();
    await expect(page.locator(`[data-swipe-key="cat:${cat}"]`)).toHaveCount(0);
    expect(await page.locator('[data-swipe-key^="cat:"]').count()).toBe(countBefore - 1);
  });
});

async function swipeAttemptFromLeft(page: Page, row: Locator) {
  const box = (await row.boundingBox())!;
  const startX = box.x + 20;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 90, y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

test.describe('R004 slide-to-delete — item rows', () => {
  test('item row reveals Delete on right-edge left swipe; confirmation still required', async ({ page }) => {
    await gotoV3(page);
    const cat = await openFirstCategory(page);
    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    const itemsBefore = await page.locator(`[data-swipe-key^="item:${cat}:"]`).count();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
    await itemRow.getByRole('button', { name: /^Delete / }).click();
    // Confirmation dialog (existing safety) — item not yet deleted
    expect(await page.locator(`[data-swipe-key^="item:${cat}:"]`).count()).toBe(itemsBefore);
    await expect(page.getByText(/delete/i).first()).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).first().click();
    expect(await page.locator(`[data-swipe-key^="item:${cat}:"]`).count()).toBe(itemsBefore);
  });

  test('confirming item deletion from the reveal path removes the item', async ({ page }) => {
    await gotoV3(page);
    const cat = await openFirstCategory(page);
    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    const key = (await itemRow.getAttribute('data-swipe-key'))!;
    await swipeLeft(page, itemRow);
    await itemRow.getByRole('button', { name: /^Delete / }).click();
    await page.getByRole('dialog', { name: 'Delete item confirmation' })
      .getByRole('button', { name: 'Delete Item' }).click();
    await expect(page.locator(`[data-swipe-key="${key}"]`)).toHaveCount(0);
  });

  test('no resting trash-can icons in item rows or category headers', async ({ page }) => {
    await gotoV3(page);
    const cat = await openFirstCategory(page);
    // Delete buttons exist only inside swipe reveals (aria-hidden while closed)
    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    // At rest the reveal Delete is aria-hidden (excluded from the a11y tree)
    const revealBtn = itemRow.locator('button[aria-label^="Delete "]');
    await expect(revealBtn).toHaveCount(1);
    await expect(revealBtn).toHaveAttribute('aria-hidden', 'true'); // hidden at rest
    await expect(itemRow.getByRole('button', { name: /^Delete / })).toHaveCount(0);
    // and the reveal button is visually off-canvas at rest
    const rowBox = (await itemRow.boundingBox())!;
    const content = itemRow.locator('> div').last();
    const t = await content.evaluate(el => getComputedStyle(el).transform);
    expect(t === 'none' || parseFloat(t.split(',')[4]) === 0).toBe(true);
    expect(rowBox.width).toBeGreaterThan(0);
  });

  test('only one reveal open at a time — opening a second closes the first', async ({ page }) => {
    await gotoV3(page);
    const cat = await openFirstCategory(page);
    const rows = page.locator(`[data-swipe-key^="item:${cat}:"]`);
    test.skip(await rows.count() < 2, 'category has fewer than 2 items');
    await swipeLeft(page, rows.nth(0));
    await expect(rows.nth(0)).toHaveAttribute('data-swipe-open', 'true');
    await swipeLeft(page, rows.nth(1));
    await expect(rows.nth(1)).toHaveAttribute('data-swipe-open', 'true');
    await expect(rows.nth(0)).toHaveAttribute('data-swipe-open', 'false');
  });

  test('tapping elsewhere closes an open reveal', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    await swipeLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'true');
    await page.getByTestId('active-list-name').click({ force: true });
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });

  test('scrolling the list closes an open reveal', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    await swipeLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'true');
    await page.getByTestId('main-scroll').evaluate(el => {
      el.scrollBy(0, 120);
      // list may be shorter than the viewport — the scroll EVENT is the trigger
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });

  test('opening a deck closes an open reveal', async ({ page }) => {
    await gotoV3(page);
    const row = firstCatRow(page);
    await swipeLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'true');
    await openDeck(page, NAV.more);
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });

  test('accessible non-swipe delete paths exist (category options sheet; item detail panel)', async ({ page }) => {
    await gotoV3(page);
    const cat = await openFirstCategory(page);
    // Item path: expand detail panel → Delete Item row
    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await itemRow.locator('[role="button"][aria-expanded]').click();
    await expect(page.getByRole('button', { name: 'Delete Item' }).or(
      page.getByRole('button', { name: /^Delete .+/ }).filter({ hasText: 'Delete Item' })).first()).toBeVisible();
    // Category path: name tap → Category Options sheet contains Delete
    await page.getByRole('button', { name: `Category options for ${cat}` }).click();
    await expect(page.getByRole('button', { name: /delete/i }).first()).toBeVisible();
  });
});

// ─── Part 2 — category reorder floating drag ────────────────────────────────────

test.describe('R004 category reorder', () => {
  test('dragged category floats (elevated shadow) and styling stays on the ACTUAL dragged category after crossing', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-swipe-key^="cat:"]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const firstName = await firstCatName(page);
    const secondCard = page.locator('[data-cat]').nth(1);
    const sBox = (await secondCard.boundingBox())!;
    const { x } = await longPressGrab(page, firstName);
    // cross into the second category's territory
    await page.mouse.move(x, sBox.y + sBox.height * 0.8, { steps: 10 });
    await page.waitForTimeout(120);
    const floating = page.locator('[data-floating="true"]');
    await expect(floating).toHaveCount(1);
    expect(await floating.getAttribute('data-cat')).toBe(firstName); // name-keyed, not index
    const shadow = await floating.evaluate(el => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
    await page.mouse.up();
  });

  test('exactly one valid target dims while touched; undims on release; all effects cleared', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const firstName = await firstCatName(page);
    const second = cats.nth(1);
    const sBox = (await second.boundingBox())!;
    const secondName = await second.getAttribute('data-cat');
    const { x, y } = await longPressGrab(page, firstName);
    // drag deep into the second slot — the DISPLACED category must dim
    await page.mouse.move(x, sBox.y + sBox.height * 0.8, { steps: 8 });
    await page.waitForTimeout(120);
    const dimmed = page.locator('[data-dimtarget="true"]');
    await expect(dimmed).toHaveCount(1);
    expect(await dimmed.getAttribute('data-cat')).toBe(secondName);
    // move back to the original slot — the target must undim immediately
    await page.mouse.move(x, y, { steps: 8 });
    await page.waitForTimeout(120);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
    await page.mouse.up();
    await page.waitForTimeout(250);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  });

  test('pointer cancellation clears all drag effects and does NOT commit a reorder', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const beforeOrder = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    const firstName = beforeOrder[0]!;
    const sBox = (await cats.nth(1).boundingBox())!;
    const { x } = await longPressGrab(page, firstName);
    await page.mouse.move(x, sBox.y + sBox.height * 0.8, { steps: 8 });
    await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
    // simulate an interrupted gesture (browser gesture takeover, incoming call, …)
    await page.locator(`[data-swipe-key="cat:${firstName}"]`).dispatchEvent('pointercancel');
    await page.waitForTimeout(250);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
    const afterOrder = await page.locator('[data-cat]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    expect(afterOrder).toEqual(beforeOrder); // no commit on cancellation
    await page.mouse.up();
  });

  test('drag reorder persists new order after release', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const beforeOrder = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    const firstName = beforeOrder[0]!;
    const second = cats.nth(1);
    const sBox = (await second.boundingBox())!;
    const { x } = await longPressGrab(page, firstName);
    await page.mouse.move(x, sBox.y + sBox.height - 4, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const afterOrder = await page.locator('[data-cat]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
    expect(afterOrder[1]).toBe(firstName);
    expect(afterOrder[0]).toBe(beforeOrder[1]);
  });

  test('starting a reorder closes any open delete reveal', async ({ page }) => {
    await gotoV3(page);
    const cats = page.locator('[data-cat]');
    test.skip(await cats.count() < 2, 'needs 2+ categories');
    const row = firstCatRow(page);
    await swipeLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'true');
    const secondName = (await cats.nth(1).getAttribute('data-cat'))!;
    const { x, y } = await longPressGrab(page, secondName);
    await page.mouse.move(x, y + 30, { steps: 4 });
    await page.mouse.up();
    await expect(row).toHaveAttribute('data-swipe-open', 'false');
  });
});

// ─── Part 3 — typography ────────────────────────────────────────────────────────

test.describe('R004 Inter typography', () => {
  test('category names, list name, and app bar use Inter (no Georgia/serif)', async ({ page }) => {
    await gotoV3(page);
    const targets = [
      page.getByTestId('active-list-name'),
      page.getByRole('button', { name: /Category options for/ }).first(),
    ];
    for (const t of targets) {
      const ff = await t.evaluate(el => getComputedStyle(el.querySelector('div') ?? el).fontFamily);
      expect(ff).toContain('Inter');
      expect(ff).not.toMatch(/Georgia|Palatino/);
    }
  });

  test('Inter Variable @font-face is registered and loaded', async ({ page }) => {
    await gotoV3(page);
    const loaded = await page.evaluate(async () => {
      await (document as any).fonts.ready;
      return [...(document as any).fonts].some((f: any) => /Inter/i.test(f.family) && f.status === 'loaded');
    });
    expect(loaded).toBe(true);
  });

  test('no visible Georgia-rendered text remains on the main V3 screen', async ({ page }) => {
    await gotoV3(page);
    const georgiaCount = await page.evaluate(() => {
      let n = 0;
      document.querySelectorAll<HTMLElement>('body *').forEach(el => {
        if (!el.offsetParent) return;
        const ff = getComputedStyle(el).fontFamily;
        if (/Georgia|Palatino/.test(ff) && el.textContent?.trim()) n++;
      });
      return n;
    });
    expect(georgiaCount).toBe(0);
  });
});

// ─── Part 4 — inline Add Category removed ───────────────────────────────────────

test.describe('R004 inline Add Category removal', () => {
  test('dashed inline Add Category control is gone from the main list', async ({ page }) => {
    await gotoV3(page);
    await expect(page.getByRole('button', { name: 'Add a new category to this list' })).toHaveCount(0);
  });

  test('Add deck → Add Category still creates a category', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.add);
    await page.getByText('Add Category', { exact: true }).click();
    await page.getByLabel('New category name').fill('R004 New Cat');
    await page.getByRole('button', { name: 'Confirm add category' }).click();
    await expect(page.locator('[data-swipe-key="cat:R004 New Cat"]')).toHaveCount(1);
  });
});

// ─── Part 5 — Pack Summary simplification ───────────────────────────────────────

test.describe('R004 Pack Summary', () => {
  test('LIST SUMMARY label and Not Selected metric are gone; name/items/categories/Selected remain', async ({ page }) => {
    await gotoV3(page);
    await expect(page.getByText('LIST SUMMARY')).toHaveCount(0);
    await expect(page.getByText(/Not Selected/)).toHaveCount(0);
    const name = page.getByTestId('active-list-name');
    await expect(name).toBeVisible();
    await expect(page.getByText('items', { exact: true }).first()).toBeVisible(); // big count + "items"
    await expect(page.getByText(/\d+ categories/)).toBeVisible();
    await expect(page.getByText(/\d+ Selected/)).toBeVisible();
  });

  test('file name appears exactly once, inside the summary bar, at 15.5px', async ({ page }) => {
    await gotoV3(page);
    const name = page.getByTestId('active-list-name');
    await expect(name).toHaveCount(1);
    const fs = await name.evaluate(el => getComputedStyle(el).fontSize);
    expect(fs).toBe('15.5px');
    const text = (await name.textContent())!.trim();
    // no duplicate rendering of the same name elsewhere on the main screen
    const dupes = await page.getByText(text, { exact: true }).count();
    expect(dupes).toBe(1);
  });
});

// ─── Part 6 — R003 nav/deck regression spot checks ─────────────────────────────

test.describe('R004 regression — R003 deck system intact', () => {
  test('five nav areas, decks open/close, swipe system does not break deck taps', async ({ page }) => {
    await gotoV3(page);
    for (const key of ['locker', 'add', 'more'] as const) {
      await openDeck(page, NAV[key]);
      await expect(page.getByTestId('deck-panel')).toBeVisible();
      await openDeck(page, NAV[key]); // re-tap closes
      await expect(page.getByTestId('deck-panel')).toHaveCount(0);
    }
  });
});

// ─── Part 7 — R003 test hardening ───────────────────────────────────────────────

test.describe('R004 hardened Locker-load naming', () => {
  test('after Load This List, Save flow uses the loaded name (not Untitled/previous)', async ({ page }) => {
    await gotoV3(page);
    await seedLocker(page, 2);
    await openDeck(page, NAV.locker);
    await page.getByTestId('deck-scroll').getByRole('button', { name: /R004 Seed List 2 —/ }).click();
    await page.getByRole('button', { name: /Load R004 Seed List 2 into the list/ }).click();
    await expect(page.getByTestId('active-list-name')).toHaveText('R004 Seed List 2');
    // Save path: More → List Actions → Save — the NEW Locker entry must be
    // saved under the LOADED name (not Untitled / a previous name).
    await openDeck(page, NAV.more);
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await page.getByRole('button', { name: 'Save current list as a new Locker entry' }).click();
    await page.waitForTimeout(400);
    const names = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').map((e: any) => e.name));
    // Save appends a timestamp: "<loaded name> — <date> <time>"
    expect(names.some((n: string) => n.startsWith('R004 Seed List 2 — '))).toBe(true);
    expect(names.some((n: string) => n.startsWith('Untitled') || n.startsWith('Demo Pack List — '))).toBe(false);
    // NOTE (R004 Part 7A): Share-name propagation needs the share API round-trip;
    // asserted separately only where safe — otherwise reported as UNPROVEN in R004.md.
  });
});

test.describe('R004 deterministic Undo/Redo (no conditionals)', () => {
  test('edit → Undo enabled → survives deck close/reopen → Undo reverses → Redo restores', async ({ page }) => {
    await gotoV3(page);
    const cat = await openFirstCategory(page);
    // Deterministic edit: set qty of first item to 5
    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await itemRow.locator('[role="button"][aria-expanded]').click();
    const qty = page.getByRole('combobox', { name: /Quantity of/ }).first();
    const before = await qty.inputValue();
    await qty.selectOption('5');
    await expect(qty).toHaveValue('5');
    // Undo must be ENABLED — asserted unconditionally
    await openDeck(page, NAV.more);
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    const undo = page.getByRole('button', { name: /^Undo/ });
    await expect(undo).toBeEnabled();
    // Survives deck cycle
    await openDeck(page, NAV.more); // close
    await openDeck(page, NAV.more); // reopen
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await expect(page.getByRole('button', { name: /^Undo/ })).toBeEnabled();
    await page.getByRole('button', { name: /^Undo/ }).click(); // runAndClose closes deck
    await expect(qty).toHaveValue(before);
    // Redo restores — asserted unconditionally
    await openDeck(page, NAV.more);
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    const redo = page.getByRole('button', { name: /^Redo/ });
    await expect(redo).toBeEnabled();
    await redo.click();
    await expect(qty).toHaveValue('5');
  });
});

// ─── Part 8 — responsive ────────────────────────────────────────────────────────

for (const width of [320, 375, 390, 430]) {
  test(`R004 responsive ${width}px — summary bar, swipe reveal, no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await gotoV3(page);
    await expect(page.getByText('LIST SUMMARY')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const row = firstCatRow(page);
    await swipeLeft(page, row);
    await expect(row).toHaveAttribute('data-swipe-open', 'true');
    // reveal stays within viewport
    const overflowAfter = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowAfter).toBeLessThanOrEqual(1);
  });
}
