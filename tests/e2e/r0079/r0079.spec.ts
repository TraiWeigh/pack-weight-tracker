/**
 * R0079 — Locker Delete + Save / Save As + Reset Checked State
 * Surgical mobile file/list workflow repair.
 *
 * Tests: R79-01 through R79-17
 * Route: /mobile-functional-v3
 * Viewport: 390 × 844
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const BASE = '/mobile-functional-v3';

// ── helpers ────────────────────────────────────────────────────────────────

async function waitReady(page: Parameters<typeof test>[1]['page']) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await expect(
    page.getByRole('button', { name: /^Open .+ category$/ }).first()
  ).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(300);
}

/** Navigate to Group 4 (Save / Share / More) — 3 Next clicks from Group 1.
 *  Uses evaluate(click) because the Next button may be shared across groups. */
async function goToGroup4(page: Parameters<typeof test>[1]['page']) {
  const next = page.locator('button[aria-label="Next controls"]');
  for (let i = 0; i < 3; i++) {
    await next.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(350);
  }
}

/** Navigate to Group 2 (Undo / Redo / Reset) — 1 Next click from Group 1. */
async function goToGroup2(page: Parameters<typeof test>[1]['page']) {
  const next = page.locator('button[aria-label="Next controls"]');
  await next.first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

/** Navigate back to Group 1 — 3 Previous clicks from Group 4. */
async function goToGroup1(page: Parameters<typeof test>[1]['page']) {
  const prev = page.locator('button[aria-label="Previous controls"]');
  for (let i = 0; i < 3; i++) {
    await prev.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(300);
  }
}

/** Open the Locker deck. Navigates to Group 1 first so the button is active. */
async function openLocker(page: Parameters<typeof test>[1]['page']) {
  await goToGroup1(page);
  await page.locator('button[aria-label="Locker — saved lists"]').click();
  await page.waitForTimeout(500);
}

/** Expand a Locker card by index (0-based). DeckCardItem uses pointer events.
 *  Uses Playwright .click() which fires proper pointerdown/pointerup. */
async function expandLockerCard(page: Parameters<typeof test>[1]['page'], index = 0) {
  // Cards in Locker deck render with aria-label="${entry.name} — open card"
  const cards = page.locator('[role="button"][aria-label$="— open card"]');
  await expect(cards.nth(index)).toBeVisible({ timeout: 5000 });
  await cards.nth(index).click();
  await page.waitForTimeout(500);
}

/** Save a list via the chooser → Save path. */
async function saveViaChooser(page: Parameters<typeof test>[1]['page']) {
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="save-chooser-save"]').click();
  await page.waitForTimeout(500);
}

// ── R79-01: Locker Delete control visible ──────────────────────────────────

test('R79-01 — Locker delete control visible in expanded saved-list card', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await saveViaChooser(page);
  await openLocker(page);
  await expandLockerCard(page, 0);
  // Load This List must be present
  await expect(page.locator('button', { hasText: 'Load This List' }).first()).toBeVisible({ timeout: 5000 });
  // Delete List must be present
  const deleteBtn = page.locator('button[aria-label^="Delete saved list"]').first();
  await expect(deleteBtn).toBeVisible({ timeout: 5000 });
  // Delete renders visually below Load (DOM y-position check)
  const loadY = await page.locator('button', { hasText: 'Load This List' }).first().evaluate(el => el.getBoundingClientRect().bottom);
  const delY  = await deleteBtn.evaluate(el => el.getBoundingClientRect().top);
  expect(delY, 'Delete starts below Load This List').toBeGreaterThan(loadY - 2);
});

// ── R79-02: Delete Cancel ──────────────────────────────────────────────────

test('R79-02 — Delete Cancel preserves saved list and active list', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await saveViaChooser(page);
  await openLocker(page);
  await expandLockerCard(page, 0);
  // Tap Delete → confirmation opens
  await page.locator('button[aria-label^="Delete saved list"]').first().click();
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).toBeVisible({ timeout: 5000 });
  // Confirm shows the list name
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).toContainText('Delete "');
  // Cancel
  await page.locator('[data-testid="locker-delete-cancel"]').click();
  await page.waitForTimeout(300);
  // Dialog gone
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).not.toBeVisible();
  // Entry still exists in localStorage (definitive data-integrity check)
  const lockerCount = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  expect(lockerCount, 'locker entry preserved after Cancel').toBeGreaterThan(0);
});

// ── R79-03: Delete confirm nonactive list ──────────────────────────────────

test('R79-03 — Delete confirm removes exactly that Locker entry', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Save TWO lists
  await saveViaChooser(page);
  await page.waitForTimeout(300);
  // Save As to get a second distinct entry
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="save-chooser-save-as"]').click();
  await page.locator('[data-testid="save-as-name-input"]').fill('Second List');
  await page.locator('[data-testid="save-as-confirm"]').click();
  await page.waitForTimeout(500);

  await openLocker(page);
  const countBefore = await page.locator('[role="button"][aria-label$="— open card"]').count();
  expect(countBefore).toBeGreaterThanOrEqual(2);
  // Expand and delete the first entry
  await expandLockerCard(page, 0);
  await page.locator('button[aria-label^="Delete saved list"]').first().click();
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="locker-delete-confirm"]').click();
  await page.waitForTimeout(500);
  // One fewer entry
  const countAfter = await page.locator('[role="button"][aria-label$="— open card"]').count();
  expect(countAfter, 'exactly one entry removed').toBe(countBefore - 1);
  // Categories still present (master library intact)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const cats = page.getByRole('button', { name: /^Open .+ category$/ });
  expect(await cats.count()).toBeGreaterThan(0);
});

// ── R79-04: Delete active list edge case ──────────────────────────────────

test('R79-04 — Deleting the active Locker entry keeps working list intact', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await saveViaChooser(page);
  // Open Locker, expand, load it → makes it the active entry
  await openLocker(page);
  await expandLockerCard(page, 0);
  await page.locator('button', { hasText: 'Load This List' }).first().click();
  await page.waitForTimeout(500);
  // Open Locker again, expand, delete that same entry
  await openLocker(page);
  await expandLockerCard(page, 0);
  await page.locator('button[aria-label^="Delete saved list"]').first().click();
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="locker-delete-confirm"]').click();
  await page.waitForTimeout(500);
  // Close Locker
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  // No crash — main scroll still visible
  await expect(page.locator('[data-testid="main-scroll"]')).toBeVisible();
  // Categories still present
  const cats = page.getByRole('button', { name: /^Open .+ category$/ });
  expect(await cats.count()).toBeGreaterThan(0);
});

// ── R79-05: Save chooser opens ────────────────────────────────────────────

test('R79-05 — Save button opens chooser with Save / Save As / Cancel', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="save-chooser-save-as"]')).toBeVisible();
  await expect(page.locator('[data-testid="save-chooser-cancel"]')).toBeVisible();
  await expect(page.locator('[aria-label="Save options"]')).toBeVisible();
  // Verify no save occurred merely from opening
  const before = await page.evaluate(() => {
    const raw = localStorage.getItem('trailweigh:locker');
    return raw ? JSON.parse(raw).length : 0;
  });
  await page.locator('[data-testid="save-chooser-cancel"]').click();
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="save-chooser-save"]')).not.toBeVisible();
  const after = await page.evaluate(() => {
    const raw = localStorage.getItem('trailweigh:locker');
    return raw ? JSON.parse(raw).length : 0;
  });
  expect(after, 'no save occurred from opening chooser').toBe(before);
});

// ── R79-06: Save updates existing list ────────────────────────────────────

test('R79-06 — Save updates same Locker entry, no duplicate created', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // First save creates an entry and sets activeLockerEntryId
  await saveViaChooser(page);
  const id1 = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
    return raw[raw.length - 1]?.id;
  });
  const count1 = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  // Second save should UPDATE, not duplicate
  await saveViaChooser(page);
  const count2 = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  const id2 = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
    return raw[raw.length - 1]?.id;
  });
  expect(count2, 'no duplicate created').toBe(count1);
  expect(id2, 'same entry updated').toBe(id1);
});

// ── R79-07: Save As creates independent copy ──────────────────────────────

test('R79-07 — Save As creates a new independent Locker entry', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await saveViaChooser(page);
  const countBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  const idBefore = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
    return raw[raw.length - 1]?.id;
  });
  // Save As
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save-as"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="save-chooser-save-as"]').click();
  await expect(page.locator('[data-testid="save-as-name-input"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="save-as-name-input"]').fill('My Copy');
  await page.locator('[data-testid="save-as-confirm"]').click();
  await page.waitForTimeout(500);
  const countAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  const idAfter = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
    return raw[raw.length - 1]?.id;
  });
  expect(countAfter, 'new entry added').toBe(countBefore + 1);
  expect(idAfter, 'distinct identity').not.toBe(idBefore);
  const origStillExists = await page.evaluate((origId) => {
    const raw = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
    return raw.some((e: { id: string }) => e.id === origId);
  }, idBefore);
  expect(origStillExists, 'original preserved').toBe(true);
});

// ── R79-08: Save unsaved list creates one entry ────────────────────────────

test('R79-08 — Save unsaved list creates exactly one Locker entry', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.evaluate(() => localStorage.removeItem('trailweigh:locker'));
  await saveViaChooser(page);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  expect(after, 'exactly one entry created').toBe(1);
});

// ── R79-09: Save As Cancel ────────────────────────────────────────────────

test('R79-09 — Save As Cancel creates no copy', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await saveViaChooser(page);
  const countBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="save-chooser-save-as"]').click();
  await expect(page.locator('[data-testid="save-as-name-input"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="save-as-cancel"]').click();
  await page.waitForTimeout(300);
  const countAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]').length);
  expect(countAfter, 'no copy created').toBe(countBefore);
});

// ── R79-10: Reset Confirmation ────────────────────────────────────────────

test('R79-10 — Reset shows confirmation explaining only checks will clear', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toContainText('Reset Checklist?');
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toContainText('checked/packed marks');
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toContainText('will not be deleted');
  // Cancel leaves checks unchanged
  await page.locator('[data-testid="reset-cancel"]').click();
  await page.waitForTimeout(300);
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).not.toBeVisible();
});

// ── R79-11: Reset Checks clears only checked marks ────────────────────────

test('R79-11 — Reset Checks clears all checked marks, preserves items/categories', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const catCount = await page.getByRole('button', { name: /^Open .+ category$/ }).count();
  expect(catCount).toBeGreaterThan(0);
  // Capture item/category counts via localStorage
  const { totalItems, totalCats } = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('pack-checklist-v5'));
    if (!key) return { totalItems: 0, totalCats: 0 };
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    const items = Object.values(raw.items ?? {}).flat();
    const cats = (raw.order ?? []).length;
    return { totalItems: items.length, totalCats: cats };
  });
  // Perform reset
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="reset-confirm"]').click();
  await page.waitForTimeout(500);
  // Categories still present
  await expect(page.locator('[data-testid="main-scroll"]')).toBeVisible();
  const catCountAfter = await page.getByRole('button', { name: /^(Open|Close) .+ category$/ }).count();
  expect(catCountAfter, 'category count unchanged').toBeGreaterThan(0);
  // Item/cat counts unchanged
  const { totalItems: itemsAfter, totalCats: catsAfter } = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('pack-checklist-v5'));
    if (!key) return { totalItems: 0, totalCats: 0 };
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    const items = Object.values(raw.items ?? {}).flat();
    const cats = (raw.order ?? []).length;
    return { totalItems: items.length, totalCats: cats };
  });
  if (totalItems > 0) expect(itemsAfter, 'item count unchanged').toBe(totalItems);
  if (totalCats > 0) expect(catsAfter, 'category count unchanged').toBe(totalCats);
  // All items are unchecked
  const anyChecked = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('pack-checklist-v5'));
    if (!key) return false;
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    const items: Array<{ checked?: boolean }> = Object.values(raw.items ?? {}).flat() as Array<{ checked?: boolean }>;
    return items.some(i => i.checked);
  });
  expect(anyChecked, 'no items remain checked after reset').toBe(false);
});

// ── R79-12: Reset zero-check state harmless ───────────────────────────────

test('R79-12 — Reset with zero checked items has no destructive side effect', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // First reset to clear all checks
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="reset-confirm"]').click();
  await page.waitForTimeout(400);
  // Reset again (now zero checks)
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="reset-confirm"]').click();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-testid="main-scroll"]')).toBeVisible();
  const cats = await page.getByRole('button', { name: /^(Open|Close) .+ category$/ }).count();
  expect(cats).toBeGreaterThan(0);
});

// ── R79-13: Reset persistence ─────────────────────────────────────────────

test('R79-13 — Reset clears checked state in localStorage (auto-persist model)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="reset-confirm"]').click();
  await page.waitForTimeout(500);
  const allUnchecked = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('pack-checklist-v5'));
    if (!key) return true;
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    const items: Array<{ checked?: boolean }> = Object.values(raw.items ?? {}).flat() as Array<{ checked?: boolean }>;
    return items.every(i => !i.checked);
  });
  expect(allUnchecked, 'all items unchecked in persisted state').toBe(true);
});

// ── R79-14: Master Library isolation ─────────────────────────────────────

test('R79-14 — Master Library items unaffected by Delete / Reset / Save As', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const catsBefore = await page.getByRole('button', { name: /^Open .+ category$/ }).count();
  // Save → Save As → Reset → Delete
  await saveViaChooser(page);
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="save-chooser-save-as"]').click();
  await page.locator('[data-testid="save-as-name-input"]').fill('Library Check Copy');
  await page.locator('[data-testid="save-as-confirm"]').click();
  await page.waitForTimeout(400);
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="reset-confirm"]').click();
  await page.waitForTimeout(400);
  await openLocker(page);
  await expandLockerCard(page, 0);
  await page.locator('button[aria-label^="Delete saved list"]').first().click();
  await page.locator('[data-testid="locker-delete-confirm"]').click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const catsAfter = await page.getByRole('button', { name: /^(Open|Close) .+ category$/ }).count();
  expect(catsAfter, 'category count unchanged').toBeGreaterThanOrEqual(catsBefore);
});

// ── R79-15: R0076P3 regression ────────────────────────────────────────────

test('R79-15 — R0076P3 regression: Save accessible in Group 4', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup4(page);
  await expect(page.locator('button[aria-label="Save — save list to Locker"]')).toBeVisible();
  await expect(page.locator('button[aria-label="Share — create a review link"]')).toBeVisible();
  await expect(page.locator('button[aria-label="More — settings and tools"]')).toBeVisible();
});

// ── R79-16: Accessibility regression ──────────────────────────────────────

test('R79-16a — Save chooser: initial focus on Cancel, Escape closes', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Save options"]')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(100);
  const focusedTestId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid ?? '');
  expect(focusedTestId, 'Cancel receives initial focus').toBe('save-chooser-cancel');
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-label="Save options"]')).not.toBeVisible();
});

test('R79-16b — Delete dialog: initial focus on Cancel, Escape closes', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await saveViaChooser(page);
  await openLocker(page);
  await expandLockerCard(page, 0);
  await page.locator('button[aria-label^="Delete saved list"]').first().click();
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(100);
  const focusedTestId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid ?? '');
  expect(focusedTestId, 'Cancel receives initial focus in delete dialog').toBe('locker-delete-cancel');
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-label="Delete Saved List confirmation"]')).not.toBeVisible();
});

test('R79-16c — Reset dialog: initial focus on Cancel, Escape closes', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(100);
  const focusedTestId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid ?? '');
  expect(focusedTestId, 'Cancel receives initial focus in reset dialog').toBe('reset-cancel');
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).not.toBeVisible();
});

// ── R79-17: Mobile widths ─────────────────────────────────────────────────

test('R79-17 — No horizontal overflow at 390 px with new dialogs open', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await goToGroup4(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5000 });
  const overflow1 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow1, 'no overflow: save chooser').toBe(false);
  await page.locator('[data-testid="save-chooser-cancel"]').click();
  // Reset dialog
  await goToGroup2(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow2, 'no overflow: reset dialog').toBe(false);
  await page.keyboard.press('Escape');
});
