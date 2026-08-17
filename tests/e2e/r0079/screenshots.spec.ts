/**
 * R0079 — screenshot capture only (6 required visual evidence screenshots).
 * Run once, saves to screenshots/r0079-*.png.
 */
import { test } from '@playwright/test';
import path from 'path';

test.use({ viewport: { width: 390, height: 844 } });
const BASE = '/mobile-functional-v3';

test('capture all 6 R0079 screenshots', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // ── Navigate to Group 4 and save a list first ──
  const next = page.locator('button[aria-label="Next controls"]');
  for (let i = 0; i < 3; i++) {
    await next.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(350);
  }
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(500);

  // Screenshot 3 — Save chooser showing Save / Save As / Cancel
  await page.screenshot({ path: 'screenshots/r0079-03-save-chooser.png' });

  // Screenshot 4 — Save As naming dialog
  await page.locator('[data-testid="save-chooser-save-as"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshots/r0079-04-save-as-dialog.png' });
  await page.locator('[data-testid="save-as-cancel"]').click();
  await page.waitForTimeout(300);

  // Now actually save via Save chooser
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.locator('[data-testid="save-chooser-save"]').click();
  await page.waitForTimeout(500);

  // Navigate back to Group 1 to open Locker
  const prev = page.locator('button[aria-label="Previous controls"]');
  for (let i = 0; i < 3; i++) {
    await prev.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(300);
  }
  await page.locator('button[aria-label="Locker — saved lists"]').click();
  await page.waitForTimeout(500);
  // Expand the first Locker card
  const card = page.locator('[role="button"][aria-label$="— open card"]').first();
  await card.click();
  await page.waitForTimeout(500);

  // Screenshot 1 — Expanded Locker card with Delete visible
  await page.screenshot({ path: 'screenshots/r0079-01-locker-with-delete.png' });

  // Screenshot 2 — Delete Saved List confirmation
  await page.locator('button[aria-label^="Delete saved list"]').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/r0079-02-delete-confirm.png' });
  await page.locator('[data-testid="locker-delete-cancel"]').click();
  await page.waitForTimeout(300);
  // Close Locker
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Navigate to Group 2 for Reset
  await next.first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);

  // Screenshot 5 — Reset Checklist confirmation
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/r0079-05-reset-confirm.png' });

  // Screenshot 6 — List after Reset (items present, checks cleared)
  await page.locator('[data-testid="reset-confirm"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/r0079-06-after-reset.png' });

  console.log('All 6 screenshots captured successfully');
});
