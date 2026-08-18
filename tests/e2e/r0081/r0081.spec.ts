/**
 * R0081 — Preview checklist fix: all items visible, Clear Checks ⇄ Undo pill
 *
 * R81-01  All items in the working list appear in Preview (not filtered)
 * R81-02  Checked items in working list show ✓ in Preview
 * R81-03  Unchecked items appear in Preview (not hidden)
 * R81-04  Unchecked items are fully readable — not dimmed to 50%
 * R81-05  Clear Checks pill is present with correct label on Preview open
 * R81-06  Clear Checks pill has accessible aria-label
 * R81-07  Clear Checks pill touch target height ≥ 44 px
 * R81-08  Tapping Clear Checks: pill changes to Undo
 * R81-09  Tapping Clear Checks: all item checkboxes become unchecked in Preview
 * R81-10  Tapping Undo: pill changes back to Clear Checks
 * R81-11  Tapping Undo: checkboxes restore to pre-clear state
 * R81-12  Working list checked state unchanged after Clear Checks
 * R81-13  Working list checked state unchanged after Undo
 * R81-14  Close and reopen Preview: pill resets to Clear Checks
 * R81-15  Close and reopen Preview: items mirror current working-list state
 * R81-16  Note banner no longer says "selected gear"
 * R81-17  R0080P3 regression: right chevron label still says "Next"
 * R81-18  R0079 regression: Save chooser opens from Group 4
 */

import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';

// ── helpers ──────────────────────────────────────────────────────────────────

async function waitReady(page: Parameters<typeof test>[1]['page']) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await expect(page.getByRole('button', { name: /^Open .+ category$/ }).first()).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(300);
}

async function clickNext(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Next controls"]').first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

async function clickBack(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Previous controls"]').first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

async function goToGroup(page: Parameters<typeof test>[1]['page'], idx: number) {
  for (let i = 0; i < 4; i++) {
    const hasBack = await page.evaluate(() =>
      !!(document.querySelector('[data-group-active="true"]')
        ?.querySelector('[aria-label="Previous controls"]'))
    );
    if (!hasBack) break;
    await clickBack(page);
  }
  for (let i = 0; i < idx; i++) await clickNext(page);
  await page.waitForTimeout(100);
}

async function openPreview(page: Parameters<typeof test>[1]['page']) {
  await goToGroup(page, 2); // Group 3 has the Preview button
  await page.locator('button[aria-label="Preview — view and print gear list"]')
    .evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="preview-overlay"]')).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(200);
}

async function closePreview(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Close preview"]').click();
  await expect(page.locator('[data-testid="preview-overlay"]')).not.toBeVisible({ timeout: 3_000 });
  await page.waitForTimeout(200);
}

/**
 * Read total item count from the list-summary-bar text.
 * The summary bar renders "N items" regardless of whether categories are expanded.
 */
async function getTotalFromSummary(page: Parameters<typeof test>[1]['page']): Promise<number> {
  const text = await page.locator('[data-testid="list-summary-bar"]').textContent() ?? '';
  const m = text.match(/(\d+)\s*items/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Read selected (checked) count from the list-summary-bar text.
 * Uses "M Selected" chip — works even when all categories are collapsed.
 */
async function getSelectedFromSummary(page: Parameters<typeof test>[1]['page']): Promise<number> {
  const text = await page.locator('[data-testid="list-summary-bar"]').textContent() ?? '';
  const m = text.match(/(\d+)\s+Selected/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Count checked checkboxes inside the preview overlay.
 * PreviewBody renders checked items with a 16×16 outer span whose background is
 * the TrailWeigh green (#2d5a27 = rgb(45, 90, 39)).  Counting by background color
 * gives exactly one match per checked item — no double-counting.
 */
async function countCheckedInPreview(page: Parameters<typeof test>[1]['page']): Promise<number> {
  return page.locator('[data-testid="preview-overlay"]').evaluate(overlay => {
    return Array.from(overlay.querySelectorAll('span')).filter(span => {
      return window.getComputedStyle(span).backgroundColor === 'rgb(45, 90, 39)';
    }).length;
  });
}

/**
 * Count all item checkbox spans inside the preview overlay.
 * Each item has exactly one 16×16 outer checkbox span with a dark (#333) border.
 */
async function countAllItemRowsInPreview(page: Parameters<typeof test>[1]['page']): Promise<number> {
  return page.locator('[data-testid="preview-overlay"]').evaluate(overlay => {
    return Array.from(overlay.querySelectorAll('span')).filter(span => {
      const cs = window.getComputedStyle(span);
      return (
        Math.round(parseFloat(cs.width))  === 16 &&
        Math.round(parseFloat(cs.height)) === 16 &&
        cs.borderTopColor === 'rgb(51, 51, 51)'  // #333 = rgb(51,51,51)
      );
    }).length;
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('R81-01 — All items in the working list appear in Preview (not filtered)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const totalInList = await getTotalFromSummary(page);
  expect(totalInList, 'List must contain at least one item').toBeGreaterThan(0);

  await openPreview(page);

  const totalInPreview = await countAllItemRowsInPreview(page);
  expect(totalInPreview, `Preview should show all ${totalInList} items`).toBe(totalInList);
});

test('R81-02 — Checked items in working list show ✓ in Preview', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const selectedInList = await getSelectedFromSummary(page);
  await openPreview(page);

  const checkedInPreview = await countCheckedInPreview(page);
  expect(checkedInPreview, `Preview ✓ count should match the ${selectedInList} selected in working list`).toBe(selectedInList);
});

test('R81-03 — Unchecked items appear in Preview (not hidden)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const total    = await getTotalFromSummary(page);
  const selected = await getSelectedFromSummary(page);
  const unchecked = total - selected;
  expect(unchecked, 'Test data must have at least one unchecked item').toBeGreaterThan(0);

  await openPreview(page);

  const totalInPreview  = await countAllItemRowsInPreview(page);
  const checkedInPreview = await countCheckedInPreview(page);
  const uncheckedInPreview = totalInPreview - checkedInPreview;

  expect(uncheckedInPreview, `Preview should show ${unchecked} unchecked items`).toBe(unchecked);
});

test('R81-04 — Unchecked items are fully readable — not dimmed to 50%', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  // Locate the first unchecked checkbox span (transparent background) in the overlay,
  // then walk up to the item row div and check its opacity.
  const opacity = await page.locator('[data-testid="preview-overlay"]').evaluate(overlay => {
    // Find a checkbox span with transparent background = unchecked
    const uncheckedBox = Array.from(overlay.querySelectorAll('span')).find(span => {
      const cs = window.getComputedStyle(span);
      const w  = Math.round(parseFloat(cs.width));
      const h  = Math.round(parseFloat(cs.height));
      const bg = cs.backgroundColor;
      return w === 16 && h === 16 &&
             cs.borderTopColor === 'rgb(51, 51, 51)' &&
             (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent');
    });
    if (!uncheckedBox) return -1; // no unchecked item found — all checked
    // Walk up to the item row (a div with display:flex containing the checkbox)
    let el: HTMLElement | null = uncheckedBox.parentElement as HTMLElement | null;
    while (el && el !== overlay) {
      if (el.tagName === 'DIV') {
        return parseFloat(window.getComputedStyle(el).opacity);
      }
      el = el.parentElement;
    }
    return -1;
  });

  if (opacity === -1) return; // all items checked — skip
  expect(opacity, 'Unchecked item rows must not be dimmed (opacity must be 1)').toBeCloseTo(1, 1);
});

test('R81-05 — Clear Checks pill is present with correct label on open', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  const btn = page.locator('[data-testid="preview-clear-btn"]');
  await expect(btn).toBeVisible();
  await expect(btn).toContainText('Clear Checks');
});

test('R81-06 — Clear Checks pill has accessible aria-label', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  await expect(page.locator('[data-testid="preview-clear-btn"]'))
    .toHaveAttribute('aria-label', 'Clear all preview checkmarks');
});

test('R81-07 — Clear Checks pill touch target height ≥ 44 px', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  const box = await page.locator('[data-testid="preview-clear-btn"]').boundingBox();
  expect(box, 'pill button must be in the DOM').not.toBeNull();
  expect(box!.height, `Touch target height should be ≥ 44px, got ${box!.height}`).toBeGreaterThanOrEqual(44);
});

test('R81-08 — Tapping Clear Checks: pill changes to Undo', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);

  await expect(page.locator('[data-testid="preview-undo-btn"]')).toBeVisible();
  await expect(page.locator('[data-testid="preview-undo-btn"]')).toContainText('Undo');
  await expect(page.locator('[data-testid="preview-clear-btn"]')).not.toBeVisible();
});

test('R81-09 — Tapping Clear Checks: all item checkboxes become unchecked', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  const checkedBefore = await countCheckedInPreview(page);
  expect(checkedBefore, 'Must have checked items before clearing').toBeGreaterThan(0);

  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);

  const checkedAfter = await countCheckedInPreview(page);
  expect(checkedAfter, 'After Clear Checks, no items should show ✓').toBe(0);
});

test('R81-10 — Tapping Undo: pill changes back to Clear Checks', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="preview-undo-btn"]').click();
  await page.waitForTimeout(200);

  await expect(page.locator('[data-testid="preview-clear-btn"]')).toBeVisible();
  await expect(page.locator('[data-testid="preview-clear-btn"]')).toContainText('Clear Checks');
  await expect(page.locator('[data-testid="preview-undo-btn"]')).not.toBeVisible();
});

test('R81-11 — Tapping Undo: checkboxes restore to pre-clear state', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  const checkedBefore = await countCheckedInPreview(page);
  expect(checkedBefore).toBeGreaterThan(0);

  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="preview-undo-btn"]').click();
  await page.waitForTimeout(200);

  const checkedAfterUndo = await countCheckedInPreview(page);
  expect(checkedAfterUndo, 'After Undo, ✓ count must match pre-clear count').toBe(checkedBefore);
});

test('R81-12 — Working list selected count unchanged after Clear Checks', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const selectedBefore = await getSelectedFromSummary(page);
  await openPreview(page);
  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);
  await closePreview(page);

  const selectedAfter = await getSelectedFromSummary(page);
  expect(selectedAfter, 'Working list selected count must be unchanged after Preview Clear').toBe(selectedBefore);
});

test('R81-13 — Working list selected count unchanged after Undo', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const selectedBefore = await getSelectedFromSummary(page);
  await openPreview(page);
  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="preview-undo-btn"]').click();
  await page.waitForTimeout(200);
  await closePreview(page);

  const selectedAfter = await getSelectedFromSummary(page);
  expect(selectedAfter, 'Working list selected count must be unchanged after Preview Undo').toBe(selectedBefore);
});

test('R81-14 — Close and reopen Preview: pill resets to Clear Checks', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Open, clear, close
  await openPreview(page);
  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);
  await expect(page.locator('[data-testid="preview-undo-btn"]')).toBeVisible();
  await closePreview(page);

  // Reopen — pill must reset to Clear Checks
  await openPreview(page);
  await expect(page.locator('[data-testid="preview-clear-btn"]')).toBeVisible();
  await expect(page.locator('[data-testid="preview-undo-btn"]')).not.toBeVisible();
});

test('R81-15 — Close and reopen Preview: items mirror current working-list state', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const selectedInList = await getSelectedFromSummary(page);

  // Open, clear, close
  await openPreview(page);
  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(200);
  await closePreview(page);

  // Reopen — checked count must match the working list's selected count
  await openPreview(page);
  const checkedOnReopen = await countCheckedInPreview(page);
  expect(checkedOnReopen, 'On reopen, Preview ✓ count must match working-list selected count').toBe(selectedInList);
});

test('R81-16 — Note banner no longer says "selected gear"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openPreview(page);

  const overlay = page.locator('[data-testid="preview-overlay"]');
  await expect(overlay).not.toContainText('selected gear');
  await expect(overlay).not.toContainText('Your selected');
});

// ── Regressions ───────────────────────────────────────────────────────────────

test('R81-17 — R0080P3 regression: right chevron label still says "Next"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const txt = await page.evaluate(() => {
    const btn = document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="Next controls"]') as HTMLElement | null;
    return btn?.textContent?.trim() ?? '';
  });
  expect(txt).toBe('Next');
});

test('R81-18 — R0079 regression: Save chooser opens from Group 4', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 3);
  await page.locator('button[aria-label="Save — save list to Locker"]')
    .evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5_000 });
  await page.locator('[data-testid="save-chooser-cancel"]').click();
});
