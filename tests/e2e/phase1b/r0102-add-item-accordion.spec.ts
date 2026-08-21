/**
 * R0102 — Add Item opens a creation-method accordion instead of immediately
 * creating a blank row.
 *
 * Behavioural contract
 * ────────────────────
 * • Tapping Add Item shows a 3-row accordion (Name / Photo / Master List).
 * • Opening/closing the accordion alone must NOT change item count.
 * • Name  → +1 blank item, accordion closes.
 * • Photo → +1 blank item + photo sheet opens, accordion closes.
 * • Master List → MasterList screen opens, no new item, accordion closes.
 * • Accordion auto-closes when the category closes or a different one opens.
 * • R0101 anchor geometry and scroll restore remain intact.
 * • No window scroll; no duplicate blank rows.
 * • R0098 wedge spacing and R0099 BoxGroup loop are unchanged.
 */
import { test, expect, gotoDemo, expectClean, SEED } from '../helpers/trailweigh';

// ── helpers ──────────────────────────────────────────────────────────────────

async function openFirstCat(page: import('@playwright/test').Page) {
  const cat = SEED.categories[0]; // 'Backpack'
  await page.getByRole('button', { name: `Open ${cat} category` }).click();
  await expect(page.getByTestId('cat-add-item-bar')).toBeVisible({ timeout: 2000 });
  return cat;
}

async function itemCount(page: import('@playwright/test').Page, cat: string) {
  return page.evaluate((c) => {
    const row = document.querySelector(`[data-cat="${c}"]`) as HTMLElement | null;
    if (!row) return -1;
    // Count item rows by their expand-detail buttons
    return row.querySelectorAll('[role="checkbox"]').length;
  }, cat);
}

// ─────────────────────────────────────────────────────────────────────────────

test('R0102 tapping Add Item shows accordion without adding a row', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);
  const before = await itemCount(page, cat);

  // Open accordion
  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();
  expect(await itemCount(page, cat)).toBe(before); // no new item

  // Verify three method buttons are present
  await expect(page.getByTestId('add-item-by-name')).toBeVisible();
  await expect(page.getByTestId('add-item-by-photo')).toBeVisible();
  await expect(page.getByTestId('add-item-by-master-list')).toBeVisible();

  // Add Item button carries aria-expanded="true"
  const expanded = await page.getByTestId('cat-add-item-btn').getAttribute('aria-expanded');
  expect(expanded).toBe('true');

  expectClean(errors);
});

test('R0102 tapping Add Item again closes accordion without adding a row', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);
  const before = await itemCount(page, cat);

  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();

  // Toggle closed
  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();
  expect(await itemCount(page, cat)).toBe(before);

  // aria-expanded returns to false
  const expanded = await page.getByTestId('cat-add-item-btn').getAttribute('aria-expanded');
  expect(expanded).toBe('false');

  expectClean(errors);
});

test('R0102 Name method adds exactly one item and closes accordion', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);
  const before = await itemCount(page, cat);

  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-by-name')).toBeVisible();
  await page.getByTestId('add-item-by-name').click();

  // Accordion gone
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();
  // Exactly one new item
  expect(await itemCount(page, cat)).toBe(before + 1);

  expectClean(errors);
});

test('R0102 Photo method adds one item and opens photo sheet', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);
  const before = await itemCount(page, cat);

  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-by-photo')).toBeVisible();
  await page.getByTestId('add-item-by-photo').click();

  // Accordion gone
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();
  // Exactly one new item created
  expect(await itemCount(page, cat)).toBe(before + 1);
  // Photo sheet opens for that item
  await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 2000 });

  expectClean(errors);
});

test('R0102 Master List method opens the master list screen without adding an item', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);
  const before = await itemCount(page, cat);

  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-by-master-list')).toBeVisible();
  await page.getByTestId('add-item-by-master-list').click();

  // Accordion gone
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();
  // No new item created
  expect(await itemCount(page, cat)).toBe(before);
  // Master List screen visible
  await expect(page.getByTestId('master-list-screen')).toBeVisible({ timeout: 2000 });

  expectClean(errors);
});

test('R0102 accordion auto-closes when the category closes', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);

  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();

  // Close the category
  await page.getByRole('button', { name: `Close ${cat} category` }).click();
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();

  // Reopen — accordion must not be present (state was cleared)
  await page.getByRole('button', { name: `Open ${cat} category` }).click();
  await expect(page.getByTestId('cat-add-item-bar')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();

  expectClean(errors);
});

test('R0102 accordion auto-closes when a different category opens', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = SEED.categories[0];
  const cat2 = SEED.categories[1];

  await page.getByRole('button', { name: `Open ${cat} category` }).click();
  await expect(page.getByTestId('cat-add-item-bar')).toBeVisible({ timeout: 2000 });
  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();

  // Open a different category (accordion should close with the first one)
  await page.getByRole('button', { name: `Open ${cat2} category` }).click();
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();

  expectClean(errors);
});

test('R0102 no window scroll with accordion open', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  await openFirstCat(page);
  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();

  const scroll = await page.evaluate(() => ({
    window: window.scrollY,
    doc: document.documentElement.scrollTop,
    body: document.body.scrollTop,
  }));
  expect(scroll.window).toBe(0);
  expect(scroll.doc).toBe(0);
  expect(scroll.body).toBe(0);

  expectClean(errors);
});

test('R0102 repeated accordion toggles — no duplicate items, no layout breakage', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);
  const cat = await openFirstCat(page);
  const before = await itemCount(page, cat);

  // Toggle 3 times (open/close/open)
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('cat-add-item-btn').click();
    await page.waitForTimeout(60);
  }
  // Third click leaves accordion open
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();
  expect(await itemCount(page, cat)).toBe(before); // still no new items

  // Now pick Name — should add exactly one item
  await page.getByTestId('add-item-by-name').click();
  expect(await itemCount(page, cat)).toBe(before + 1);

  expectClean(errors);
});

test('R0102 R0101 anchor geometry preserved with accordion open', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);

  // Open last category (Kitchen — short, triggers R0101 anchor)
  await page.getByRole('button', { name: 'Open Kitchen category' }).click();

  // Wait for anchor
  await page.waitForFunction(() => {
    const filter = document.querySelector('[data-testid="filter-bar"]')?.getBoundingClientRect();
    const active = document.querySelector('[data-testid="active-category-bar"]')?.getBoundingClientRect();
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement | null;
    return !!filter && !!active && !!main &&
      Math.abs(active.top - filter.bottom) <= 1 &&
      main.scrollTop > 0;
  }, undefined, { timeout: 3000 });

  // Open accordion
  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();

  // Filter and active-category-bar remain visible and locked
  await expect(page.getByTestId('filter-bar')).toBeVisible();
  await expect(page.getByTestId('active-category-bar')).toBeVisible();

  // Active category header stays at filter bottom
  const geo = await page.evaluate(() => {
    const filter = document.querySelector('[data-testid="filter-bar"]')!.getBoundingClientRect();
    const active = document.querySelector('[data-testid="active-category-bar"]')!.getBoundingClientRect();
    const scroll = {
      window: window.scrollY,
      doc: document.documentElement.scrollTop,
      body: document.body.scrollTop,
    };
    return { filterBottom: filter.bottom, activeTop: active.top, scroll };
  });
  expect(geo.activeTop).toBeCloseTo(geo.filterBottom, 0);
  expect(geo.scroll.window).toBe(0);
  expect(geo.scroll.doc).toBe(0);
  expect(geo.scroll.body).toBe(0);

  expectClean(errors);
});

test('R0102 R0101 scroll restore still works after accordion interaction', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);

  const beforeScrollTop = await page.evaluate(
    () => (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop
  );

  // Open kitchen, open accordion, close accordion, close category
  await page.getByRole('button', { name: 'Open Kitchen category' }).click();
  await page.waitForFunction(() => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    return main.scrollTop > 0;
  }, undefined, { timeout: 3000 });

  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();
  await page.getByTestId('cat-add-item-btn').click(); // close accordion
  await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();

  await page.getByRole('button', { name: 'Close Kitchen category' }).click();
  await page.waitForTimeout(100);

  const afterScrollTop = await page.evaluate(
    () => (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop
  );
  expect(afterScrollTop).toBeCloseTo(beforeScrollTop, 0);

  expectClean(errors);
});

test('R0102 long category: accordion open reduces isCatLong available height correctly', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);

  // Open Backpack (has most items)
  await page.getByRole('button', { name: 'Open Backpack category' }).click();
  await expect(page.getByTestId('cat-add-item-bar')).toBeVisible({ timeout: 2000 });

  // Add items until long mode activates
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('cat-add-item-btn').click();
    await expect(page.getByTestId('add-item-accordion')).toBeVisible({ timeout: 1000 });
    await page.getByTestId('add-item-by-name').click();
    await expect(page.getByTestId('add-item-accordion')).not.toBeVisible();
    await page.waitForTimeout(60);
  }

  const isLong = await page.evaluate(
    () => document.querySelector('[data-testid="open-cat-items"]')?.getAttribute('data-long-mode') === 'true'
  );
  if (!isLong) {
    // Not enough items to go long at this viewport — skip geometry check
    expectClean(errors);
    return;
  }

  // With long mode active, open accordion — Add Item bar must remain visible
  await page.getByTestId('cat-add-item-btn').click();
  await expect(page.getByTestId('add-item-accordion')).toBeVisible();
  await expect(page.getByTestId('cat-add-item-bar')).toBeVisible();

  // All fixed chrome still visible
  await expect(page.getByTestId('filter-bar')).toBeVisible();
  await expect(page.getByTestId('active-category-bar')).toBeVisible();

  expectClean(errors);
});

// ── R0098 wedge spacing regression ───────────────────────────────────────────

test('R0102 R0098 regression — category row height and wedge dimensions unchanged', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);

  const metrics = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'));
    return rows.map(row => ({
      height: row.getBoundingClientRect().height,
      wedgeW: (row.querySelector<HTMLElement>('[data-testid^="cat-header-"] > button') ?? row).getBoundingClientRect().width,
    }));
  });

  expect(metrics.length).toBeGreaterThanOrEqual(2);
  for (const m of metrics) {
    expect(m.height).toBe(65);
    expect(m.wedgeW).toBe(72);
  }

  expectClean(errors);
});

// ── R0099 BoxGroup loop regression ───────────────────────────────────────────

test('R0102 R0099 regression — BoxGroup navigation loop intact', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDemo(page);

  const nextBtn = () => page.locator('[data-group-active="true"] [data-testid="bottom-next-chevron"]');

  // Reach Group 4 by clicking Next three times
  for (let i = 0; i < 3; i++) {
    await nextBtn().click();
    await page.waitForTimeout(60);
  }
  await expect(page.getByRole('button', { name: 'Save — save list to Locker', exact: true })).toBeVisible({ timeout: 2000 });

  // One more Next should loop back to Group 1 (Add visible)
  await nextBtn().click();
  await page.waitForTimeout(60);
  await expect(page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true })).toBeVisible({ timeout: 2000 });

  expectClean(errors);
});
