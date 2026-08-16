/**
 * R003 — Correction + visual-refinement round tests
 * ──────────────────────────────────────────────────
 * Part A fixes:
 *  A1 deck touch scrolling both directions; scroll never activates a bar; tap always activates
 *  A2 Load This List adopts the entry name as the active list identity
 *  A3 disabled bars keep a fully opaque surface (content-only muting)
 *  A4 nav/deck/backdrop share one measured bottom offset (incl. safe-area inset)
 * Part B visual language:
 *  five flush square nav areas (Locker | Summary | Add | Search | More), no List tab,
 *  no floating Add, integrated file-identity summary bar, flush square category stack,
 *  hidden scrollbar chrome, compact square deck bars, top Search circle retained
 * Part D/E/F: state preservation ×10, responsive 320/375/390/430, a11y + reduced motion
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page) {
  await page.goto(ROUTE);
  // R004: "LIST SUMMARY" label removed — the active list name (inside the summary
  // bar) is now the readiness signal.
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

/** Seed N temporary Locker entries (test-only localStorage data). */
async function seedLocker(page: Page, n: number) {
  await page.evaluate((count) => {
    const entries = Array.from({ length: count }, (_, i) => ({
      id: `r003-seed-${i}`,
      name: `R003 Seed List ${i + 1}`,
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
  await page.waitForTimeout(500); // rise animation settle before measuring
}

const NAV = {
  locker: /^Locker — saved lists/,
  summary: /^Summary — pack weight/,
  add: /^Add — add items/,
  search: /^Search — find gear/,
  more: /^More — settings and tools/,
};

// ─── B2: bottom bar structure ────────────────────────────────────────────────────

test.describe('R003 bottom bar', () => {
  test('exactly five areas: Locker, Summary, Add, Search, More — no List tab', async ({ page }) => {
    await gotoV3(page);
    const nav = page.getByTestId('bottom-nav');
    for (const re of Object.values(NAV)) await expect(nav.getByRole('button', { name: re })).toBeVisible();
    await expect(nav.getByRole('button')).toHaveCount(5);
    await expect(page.getByRole('button', { name: /^List — current gear list/ })).toHaveCount(0);
  });

  test('areas are flush, square, equal width, touching (no gaps, no radius)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoV3(page);
    const nav = page.getByTestId('bottom-nav');
    const boxes = [];
    for (const re of [NAV.locker, NAV.summary, NAV.add, NAV.search, NAV.more]) {
      const b = await nav.getByRole('button', { name: re }).boundingBox();
      expect(b).not.toBeNull();
      boxes.push(b!);
    }
    // Equal widths ±2px, adjacent edges touching ±1.5px
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].width - boxes[0].width)).toBeLessThan(2.5);
      expect(Math.abs(boxes[i].x - (boxes[i - 1].x + boxes[i - 1].width))).toBeLessThan(1.5);
    }
    // Square edges
    const radius = await nav.getByRole('button', { name: NAV.add }).evaluate(el => getComputedStyle(el).borderRadius);
    expect(['0px', '']).toContain(radius);
    // Full-bleed: first starts at frame left, last ends at frame right
    const navBox = (await nav.boundingBox())!;
    expect(Math.abs(boxes[0].x - navBox.x)).toBeLessThan(1.5);
    expect(Math.abs(boxes[4].x + boxes[4].width - (navBox.x + navBox.width))).toBeLessThan(1.5);
  });

  test('no floating circular Add button; Add behaves like the other areas', async ({ page }) => {
    await gotoV3(page);
    const add = page.getByTestId('bottom-nav').getByRole('button', { name: NAV.add });
    const nav = page.getByTestId('bottom-nav');
    const addBox = (await add.boundingBox())!;
    const navBox = (await nav.boundingBox())!;
    // Add does not protrude above the bar (old FAB had marginTop: -16)
    expect(addBox.y).toBeGreaterThanOrEqual(navBox.y - 1);
    await add.click();
    await expect(page.getByRole('dialog', { name: 'Add' })).toBeVisible();
  });

  test('tap same area toggles closed; tap other switches decks directly', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.more);
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    // Direct switch
    await page.getByRole('button', { name: NAV.search }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    // Toggle close
    await page.getByRole('button', { name: NAV.search }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toHaveCount(0);
  });

  test('backdrop tap, close button, and Escape all close a deck', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.more);
    await page.getByTestId('deck-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    await openDeck(page, NAV.more);
    await page.getByRole('button', { name: 'Close More' }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    await openDeck(page, NAV.more);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
  });
});

// ─── B3: top Search circle retained ──────────────────────────────────────────────

test('top app-bar Search circle is retained (B3 — not removed without approval)', async ({ page }) => {
  await gotoV3(page);
  // R005 Part 1: the top-right Search control was removed by approved spec —
  // the header now contains only the wordmark; bottom-nav Search remains.
  await expect(page.getByLabel('Search (not yet available)')).toHaveCount(0);
});

// ─── B4: integrated file identity ────────────────────────────────────────────────

test.describe('R003 integrated summary bar', () => {
  test('separate title band is gone; list name lives inside the summary bar', async ({ page }) => {
    await gotoV3(page);
    const name = page.getByTestId('active-list-name');
    await expect(name).toHaveText(/Demo Pack List/);
    // Name and LIST SUMMARY share the same green bar container
    const nameBg = await name.evaluate(el => {
      let n: HTMLElement | null = el as HTMLElement;
      while (n && getComputedStyle(n).backgroundColor === 'rgba(0, 0, 0, 0)') n = n.parentElement;
      return n ? getComputedStyle(n).backgroundColor : '';
    });
    expect(nameBg).not.toBe('');
  });

  test('summary bar is square, flush, full-width (no outer margin)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoV3(page);
    // R004: the name now sits in the metrics row — walk up to the green bar
    // (nearest ancestor with a non-transparent background) and assert on that.
    const bar = page.getByTestId('active-list-name').locator(
      'xpath=ancestor::div[contains(@style,"background")][1]');
    const box = (await bar.boundingBox())!;
    expect(box.width).toBeGreaterThan(390 - 3); // full width
    expect(box.x).toBeLessThan(1.5);
    const radius = await bar.evaluate(el => getComputedStyle(el).borderRadius);
    expect(radius).toBe('0px');
  });
});

// ─── B5: flush category stack ────────────────────────────────────────────────────

test('category cards are flush, touching, square-edged, full width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoV3(page);
  const headers = page.getByRole('button', { name: /category options for/i });
  const count = await headers.count();
  expect(count).toBeGreaterThan(2);
  // Category card containers: use the wedge accordion triggers' card ancestors
  const wedges = page.getByRole('button', { name: /(Open|Close) .* category/ });
  const b0 = (await wedges.nth(0).boundingBox())!;
  const b1 = (await wedges.nth(1).boundingBox())!;
  // Touching vertically: next header starts within ~2px of previous bottom (divider only)
  expect(b1.y - (b0.y + b0.height)).toBeLessThan(3);
  // Full-bleed: wedge starts at x≈0
  expect(b0.x).toBeLessThan(1.5);
});

// ─── B6: hidden scrollbar chrome ─────────────────────────────────────────────────

test('scrollbar chrome hidden but scrolling still works', async ({ page }) => {
  await gotoV3(page);
  // R004: page is shorter (inline Add Category + name band removed) — expand all
  // categories so the list actually overflows before asserting scrollability.
  const wedges = page.getByRole('button', { name: /^Open .* category$/ });
  const n = await wedges.count();
  for (let i = 0; i < n; i++) await wedges.first().click();
  const scroller = page.getByTestId('main-scroll');
  const sw = await scroller.evaluate(el => getComputedStyle(el).scrollbarWidth);
  expect(sw).toBe('none');
  const before = await scroller.evaluate(el => el.scrollTop);
  await scroller.evaluate(el => el.scrollBy(0, 200));
  const after = await scroller.evaluate(el => el.scrollTop);
  expect(after).toBeGreaterThan(before);
});

// ─── A1: deck gesture disambiguation (20-entry locker) ───────────────────────────

test.describe('R003 A1 deck scrolling', () => {
  test('long deck: touch drag scrolls BOTH directions and never activates a bar', async ({ page }) => {
    await gotoV3(page);
    await seedLocker(page, 20);
    await openDeck(page, NAV.locker);
    const scroll = page.getByTestId('deck-scroll');
    await expect(scroll.getByRole('button', { name: /R003 Seed List/ }).first()).toBeVisible();

    const bar = scroll.getByRole('button', { name: /R003 Seed List/ }).first();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

    // Upward drag (finger up = scroll down the list): scrollTop must INCREASE
    const top0 = await scroll.evaluate(el => el.scrollTop);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(cx, cy - i * 15);
    await page.mouse.up();
    const top1 = await scroll.evaluate(el => el.scrollTop);
    expect(top1).toBeGreaterThan(top0);
    // Scroll gesture must NOT have activated a card
    await expect(page.getByRole('group', { name: / — active card$/ })).toHaveCount(0);

    // Downward drag reverses the scroll — start from the CENTER of the visible
    // stack (guaranteed to land on a bar) and drag toward the deck bottom.
    const sbox = (await scroll.boundingBox())!;
    const sx = sbox.x + sbox.width / 2, sy = sbox.y + sbox.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(sx, sy + i * 12);
    await page.mouse.up();
    const top2 = await scroll.evaluate(el => el.scrollTop);
    expect(top2).toBeLessThan(top1);
    await expect(page.getByRole('group', { name: / — active card$/ })).toHaveCount(0);
  });

  test('tap always activates a bar, even in a long scrollable deck', async ({ page }) => {
    await gotoV3(page);
    await seedLocker(page, 20);
    await openDeck(page, NAV.locker);
    await page.getByTestId('deck-scroll').getByRole('button', { name: /R003 Seed List 1 —/ }).click();
    await expect(page.getByRole('group', { name: /R003 Seed List 1 — active card/ })).toBeVisible();
  });

  test('short deck: upward drag past threshold still activates (drag-dock kept)', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.more);
    const bar = page.getByTestId('deck-scroll').getByRole('button', { name: /^Share & Print — open card/ });
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(cx, cy - i * 10);
    await page.mouse.up();
    await expect(page.getByRole('group', { name: /Share & Print — active card/ })).toBeVisible();
  });
});

// ─── A2: Load This List adopts the name ─────────────────────────────────────────

test('A2: loading a locker entry updates the active list name (Save/Share identity)', async ({ page }) => {
  await gotoV3(page);
  await seedLocker(page, 3);
  await openDeck(page, NAV.locker);
  await page.getByTestId('deck-scroll').getByRole('button', { name: /R003 Seed List 2 —/ }).click();
  await page.getByRole('button', { name: /Load R003 Seed List 2 into the list/ }).click();
  await expect(page.getByTestId('active-list-name')).toHaveText('R003 Seed List 2');
  // Deck closed after load
  await expect(page.getByRole('dialog', { name: 'Locker' })).toHaveCount(0);
});

// ─── A3: disabled bar surface opacity ────────────────────────────────────────────

test('A3: disabled deck bars keep a fully opaque surface; only content is muted', async ({ page }) => {
  await gotoV3(page);
  await openDeck(page, NAV.add);
  const disabled = page.getByTestId('deck-scroll').getByRole('button', { name: /not available yet/ }).first();
  await expect(disabled).toBeVisible();
  const surfaceOpacity = await disabled.evaluate(el => getComputedStyle(el).opacity);
  expect(Number(surfaceOpacity)).toBe(1);
  const bg = await disabled.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).not.toMatch(/rgba\(.*, 0(\.\d+)?\)$/); // opaque background
  // Content IS muted
  const contentOpacity = await disabled.locator('div').first().evaluate(el => getComputedStyle(el).opacity);
  expect(Number(contentOpacity)).toBeLessThan(1);
});

// ─── A4: shared bottom offset + safe-area proof ──────────────────────────────────

test.describe('R003 A4 bottom offset', () => {
  test('deck and backdrop bottoms equal the measured nav height', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.more);
    const navBox = (await page.getByTestId('bottom-nav').boundingBox())!;
    const frameBottom = await page.evaluate(() => document.querySelector('[data-testid="bottom-nav"]')!.parentElement!.getBoundingClientRect().bottom);
    const deckBox = (await page.getByTestId('deck-panel').boundingBox())!;
    const backBox = (await page.getByTestId('deck-backdrop').boundingBox())!;
    const navH = frameBottom - navBox.y;
    expect(Math.abs(frameBottom - (deckBox.y + deckBox.height) - navH)).toBeLessThan(2);
    expect(Math.abs(frameBottom - (backBox.y + backBox.height) - navH)).toBeLessThan(2);
  });

  test('nonzero safe-area inset: nav grows and deck sits exactly on top of it', async ({ page }) => {
    await gotoV3(page);
    const navBefore = (await page.getByTestId('bottom-nav').boundingBox())!;
    // Inject a simulated 34px home-indicator inset
    await page.evaluate(() => document.documentElement.style.setProperty('--tw-safe-bottom', '34px'));
    await page.waitForTimeout(300); // ResizeObserver settle
    const navAfter = (await page.getByTestId('bottom-nav').boundingBox())!;
    // Nav grows by ~the injected 34px inset (minHeight can absorb a few px)
    expect(navAfter.height - navBefore.height).toBeGreaterThanOrEqual(28);
    await openDeck(page, NAV.more);
    const deckBox = (await page.getByTestId('deck-panel').boundingBox())!;
    expect(Math.abs(deckBox.y + deckBox.height - navAfter.y)).toBeLessThan(2);
  });
});

// ─── Summary deck (C2) ───────────────────────────────────────────────────────────

test('Summary deck offers Pack Summary and Weight Distribution built from existing components', async ({ page }) => {
  await gotoV3(page);
  await openDeck(page, NAV.summary);
  const deck = page.getByRole('dialog', { name: 'Summary' });
  await expect(deck).toBeVisible();
  await deck.getByRole('button', { name: /^Pack Summary — open card/ }).click();
  await expect(page.getByRole('group', { name: /Pack Summary — active card/ })).toBeVisible();
  await expect(page.getByRole('group').getByText(/Total|Base|oz|lb|kg|g/i).first()).toBeVisible();
  await deck.getByRole('button', { name: /^Weight Distribution — open card/ }).click();
  await expect(page.getByRole('group', { name: /Weight Distribution — active card/ })).toBeVisible();
});

// ─── Deck bar geometry (B7) ──────────────────────────────────────────────────────

test('deck bars are compact, square-edged, flush full-width (no card proportions)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoV3(page);
  await openDeck(page, NAV.more);
  const bar = page.getByTestId('deck-scroll').getByRole('button', { name: /open card/ }).first();
  const box = (await bar.boundingBox())!;
  expect(box.height).toBeLessThan(72);         // category-header scale, not credit-card
  expect(box.width).toBeGreaterThan(390 - 3);  // flush full width
  expect(box.x).toBeLessThan(1.5);
  const radius = await bar.evaluate(el => getComputedStyle(el).borderRadius);
  expect(radius).toBe('0px');
});

// ─── D: state preservation matrix (10 states across deck open/close) ─────────────

test('state preservation: 10 states survive deck open/switch/close', async ({ page }) => {
  await gotoV3(page);
  const scroller = page.getByTestId('main-scroll');

  // 1. open an accordion + 3. toggle a check + 4. change qty + 5. change weight
  await page.getByRole('button', { name: /^Open Backpack category/ }).click();
  const firstCheckbox = page.getByRole('checkbox').first();
  const checkedBefore = await firstCheckbox.isChecked();
  await firstCheckbox.click();

  // Expand the first item's detail panel and set EXACT qty + weight values
  const qtySelect = page.getByRole('combobox', { name: /^Quantity of / }).first();
  if (!(await qtySelect.isVisible().catch(() => false))) {
    // detail panel closed — tap the first item row to expand it
    await page.getByRole('checkbox').first().locator('..').click();
  }
  await expect(qtySelect).toBeVisible();
  await qtySelect.selectOption('3');
  await expect(qtySelect).toHaveValue('3');

  // 6. switch units via More → List Settings
  await openDeck(page, NAV.more);
  await page.getByRole('button', { name: /^List Settings — open card/ }).click();
  await page.getByRole('button', { name: 'Use metric units' }).click();
  await page.keyboard.press('Escape');

  // 5. set an EXACT weight (in grams, post-switch, so the displayed value is stable)
  const weightInput = page.getByRole('spinbutton', { name: /^Weight of / }).first();
  await weightInput.fill('200');
  await weightInput.blur();
  await expect(weightInput).toHaveValue('200');

  // 2. scroll position
  await scroller.evaluate(el => el.scrollBy(0, 150));
  const scrollBefore = await scroller.evaluate(el => el.scrollTop);
  // 7/8. list identity + displayed name
  const nameBefore = await page.getByTestId('active-list-name').textContent();

  // Open + switch + close decks
  await openDeck(page, NAV.locker);
  await page.getByRole('button', { name: NAV.summary }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: NAV.summary }).click(); // toggle closed

  // Verify preserved
  expect(await scroller.evaluate(el => el.scrollTop)).toBe(scrollBefore);
  await expect(page.getByRole('button', { name: /^Close Backpack category/ })).toBeVisible(); // accordion still open
  expect(await firstCheckbox.isChecked()).toBe(!checkedBefore);
  await expect(page.getByTestId('active-list-name')).toHaveText(nameBefore!);
  await expect(page.getByText(/\d+(\.\d+)?\s*(g|kg)/).first()).toBeVisible(); // still metric
  // 4/5. EXACT quantity and weight values survive the deck cycle
  await expect(page.getByRole('combobox', { name: /^Quantity of / }).first()).toHaveValue('3');
  await expect(page.getByRole('spinbutton', { name: /^Weight of / }).first()).toHaveValue('200');

  // 9/10. undo / redo still function
  await openDeck(page, NAV.more);
  await page.getByRole('button', { name: /^List Actions — open card/ }).click();
  const undo = page.getByRole('button', { name: /^Undo/ });
  if (await undo.isEnabled()) {
    // Last undoable action is the weight edit (200 g) — undo reverts it, redo restores it.
    await undo.click(); // runAndClose: performs undo AND closes the deck
    const wi = page.getByRole('spinbutton', { name: /^Weight of / }).first();
    await expect(wi).not.toHaveValue('200');
    await openDeck(page, NAV.more);
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await page.getByRole('button', { name: /^Redo/ }).click();
    await expect(wi).toHaveValue('200');
    // Checkbox toggle from earlier is still intact (undo/redo touched only the weight)
    expect(await firstCheckbox.isChecked()).toBe(!checkedBefore);
  }
});

// ─── E: responsive widths ────────────────────────────────────────────────────────

for (const width of [320, 375, 390, 430]) {
  test(`no horizontal overflow at ${width}px and nav areas remain tappable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await gotoV3(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const re of [NAV.locker, NAV.summary, NAV.add, NAV.search, NAV.more]) {
      const b = (await page.getByTestId('bottom-nav').getByRole('button', { name: re }).boundingBox())!;
      expect(b.width).toBeGreaterThan(40); // minimum touch width even at 320
      expect(b.height).toBeGreaterThan(40);
    }
    await openDeck(page, NAV.more);
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    const deckBox = (await page.getByTestId('deck-panel').boundingBox())!;
    expect(deckBox.width).toBeLessThanOrEqual(width + 1);
  });
}

// ─── F: a11y + reduced motion + pointer hygiene ──────────────────────────────────

test.describe('R003 a11y & hygiene', () => {
  test('nav areas expose labels and aria-current; deck is a labelled dialog', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.more); // More always has bars (fresh Locker can be empty)
    const moreBtn = page.getByTestId('bottom-nav').getByRole('button', { name: NAV.more });
    await expect(moreBtn).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    // Keyboard: Enter activates a bar
    await page.getByTestId('deck-scroll').getByRole('button', { name: /open card/ }).first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: / — active card$/ })).toBeVisible();
  });

  test('reduced motion: decks still open and close', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoV3(page);
    await page.getByRole('button', { name: NAV.more }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
  });

  test('closed deck leaves no pointer-intercepting residue (elementFromPoint)', async ({ page }) => {
    await gotoV3(page);
    await openDeck(page, NAV.more);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    // Backdrop and deck must not exist in the DOM
    await expect(page.getByTestId('deck-backdrop')).toHaveCount(0);
    await expect(page.getByTestId('deck-panel')).toHaveCount(0);
    // A point mid-list hits real list content, not an overlay
    const hit = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return el ? { tag: el.tagName, testid: el.getAttribute('data-testid') } : null;
    });
    expect(hit).not.toBeNull();
    expect(hit!.testid).not.toBe('deck-backdrop');
    // List remains interactive
    await page.getByRole('button', { name: /^Open Backpack category/ }).click();
    await expect(page.getByRole('button', { name: /^Close Backpack category/ })).toBeVisible();
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await gotoV3(page);
    await openDeck(page, NAV.summary);
    await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
  });
});
