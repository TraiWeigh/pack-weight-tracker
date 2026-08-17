/**
 * R0078 — Read-only WCAG / Accessibility Diagnostic
 *
 * Tool: Playwright accessibility snapshot (page.accessibility.snapshot)
 * + structural evaluation via page.evaluate (no axe-core installed).
 * Auto-fix is DISABLED. This is purely diagnostic.
 *
 * WCAG 2.2 AA baseline.
 * Viewport: 390 × 844 (mobile portrait, as per R0078 spec).
 *
 * States scanned (per R0078 Part E):
 *   S01 — Main list, all categories collapsed
 *   S02 — One category expanded (Backpack)
 *   S03 — One item detail expanded
 *   S04 — Long-category mode (15+ items)
 *   S05 — Delete Item confirmation dialog
 *   S06 — Bottom nav Group 1
 *   S07 — Bottom nav Group 4 (Save/Share/More)
 *   S08 — Summary panel
 *   S09 — Preview/Checklist overlay
 *   S10 — Add Category UI
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

/** Structural checks run via page.evaluate — no axe-core required. */
async function structuralChecks(page: Parameters<typeof test>[1]['page'], label: string) {
  const findings = await page.evaluate(() => {
    const issues: string[] = [];

    // 1. Interactive elements without accessible names
    const interactive = document.querySelectorAll('button, [role="button"], input, select, textarea, [role="checkbox"], [role="radio"], a[href]');
    interactive.forEach((el) => {
      const name = (el as HTMLElement).getAttribute('aria-label')
        || (el as HTMLElement).getAttribute('aria-labelledby')
        || (el as HTMLInputElement).placeholder
        || (el as HTMLElement).title
        || el.textContent?.trim();
      if (!name || name.length === 0) {
        const tag = el.tagName.toLowerCase();
        const testid = (el as HTMLElement).dataset.testid ?? '';
        const cls = (el as HTMLElement).className?.slice(0, 40) ?? '';
        issues.push(`MISSING_LABEL: ${tag}[testid="${testid}"][class="${cls}"]`);
      }
    });

    // 2. Images without alt text
    document.querySelectorAll('img').forEach((img) => {
      if (!img.alt && !img.getAttribute('aria-label') && img.getAttribute('role') !== 'presentation') {
        issues.push(`IMG_NO_ALT: src="${img.src.slice(-40)}"`);
      }
    });

    // 3. Form inputs without labels
    document.querySelectorAll('input, select, textarea').forEach((el) => {
      const id = el.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAria = (el as HTMLElement).getAttribute('aria-label') || (el as HTMLElement).getAttribute('aria-labelledby');
      if (!hasLabel && !hasAria) {
        issues.push(`INPUT_NO_LABEL: type="${(el as HTMLInputElement).type || 'unknown'}"`);
      }
    });

    // 4. Role=dialog without aria-label/aria-labelledby
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (!hasLabel) {
        issues.push(`DIALOG_NO_LABEL: class="${(el as HTMLElement).className?.slice(0, 40)}"`);
      }
    });

    // 5. Focus indicators — detect elements with outline:none that are focusable
    const focusableEls = document.querySelectorAll('button, [role="button"], input, select, a[href]');
    let outlineNoneCount = 0;
    focusableEls.forEach((el) => {
      const style = window.getComputedStyle(el as Element);
      if (style.outlineStyle === 'none' || style.outlineWidth === '0px') {
        outlineNoneCount++;
      }
    });
    if (outlineNoneCount > 0) {
      issues.push(`FOCUS_OUTLINE_SUPPRESSED: ${outlineNoneCount} focusable elements have outline:none`);
    }

    // 6. Buttons with role but no type (default type=submit in forms)
    document.querySelectorAll('button').forEach((btn) => {
      if (!btn.type && btn.closest('form')) {
        issues.push(`BUTTON_NO_TYPE_IN_FORM: text="${btn.textContent?.trim().slice(0, 20)}"`);
      }
    });

    // 7. Duplicate landmark roles
    const mains = document.querySelectorAll('main, [role="main"]');
    if (mains.length > 1) {
      issues.push(`DUPLICATE_MAIN: ${mains.length} main landmarks`);
    }

    // 8. Check for viewport meta (zoom restriction — WCAG 1.4.4)
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const content = viewportMeta?.getAttribute('content') ?? '';
    if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
      issues.push(`ZOOM_RESTRICTED: viewport meta blocks user scaling`);
    }

    return issues;
  });

  // Deduplicate and summarize focus-outline count
  const unique = [...new Set(findings)];
  const focusMissing = unique.find(f => f.startsWith('FOCUS_OUTLINE_SUPPRESSED'));
  const noLabel = unique.filter(f => f.startsWith('MISSING_LABEL'));
  const noImgAlt = unique.filter(f => f.startsWith('IMG_NO_ALT'));
  const inputNoLabel = unique.filter(f => f.startsWith('INPUT_NO_LABEL'));
  const dialogNoLabel = unique.filter(f => f.startsWith('DIALOG_NO_LABEL'));
  const zoomRestricted = unique.find(f => f.startsWith('ZOOM_RESTRICTED'));

  console.log(`\n[${label}] Structural scan:`);
  console.log(`  Interactive missing label: ${noLabel.length}`);
  console.log(`  IMG missing alt: ${noImgAlt.length}`);
  console.log(`  Input missing label: ${inputNoLabel.length}`);
  console.log(`  Dialog missing label: ${dialogNoLabel.length}`);
  console.log(`  Focus outline suppressed: ${focusMissing ?? 'none'}`);
  console.log(`  Zoom restricted: ${zoomRestricted ?? 'NO (good)'}`);
  if (noLabel.length > 0) {
    noLabel.slice(0, 5).forEach(f => console.log(`    ${f}`));
  }

  return { noLabel, noImgAlt, inputNoLabel, dialogNoLabel, focusMissing, zoomRestricted, all: unique };
}

// ── WCAG State scans ────────────────────────────────────────────────────────

test('WCAG-S01 — Main list, all categories collapsed', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const r = await structuralChecks(page, 'S01 Main list collapsed');
  // WCAG 1.4.4 zoom restriction must NOT be present
  expect(r.zoomRestricted, 'S01: no zoom restriction').toBeFalsy();
  console.log(`WCAG-S01 done: ${r.all.length} total findings`);
});

test('WCAG-S02 — One category expanded (Backpack)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.getByRole('button', { name: 'Open Backpack category', exact: true }).click();
  await page.waitForTimeout(400);
  const r = await structuralChecks(page, 'S02 Backpack expanded');
  console.log(`WCAG-S02 done: ${r.all.length} total findings`);
});

test('WCAG-S03 — One item detail expanded', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.getByRole('button', { name: 'Open Backpack category', exact: true }).click();
  await page.waitForTimeout(300);
  const btn = page.locator('[data-testid="open-cat-items"] [role="button"]').first();
  await btn.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  const r = await structuralChecks(page, 'S03 Item detail expanded');
  console.log(`WCAG-S03 done: ${r.all.length} total findings`);
});

test('WCAG-S04 — Long-category mode (18 items)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.getByRole('button', { name: 'Open Backpack category', exact: true }).click();
  await page.waitForTimeout(300);
  // Add 15 items to trigger long mode
  for (let i = 0; i < 15; i++) {
    await page.getByTestId('cat-add-item-btn').first().click();
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);
  const r = await structuralChecks(page, 'S04 Long-category mode');
  console.log(`WCAG-S04 done: ${r.all.length} total findings`);
});

test('WCAG-S05 — Delete Item confirmation dialog', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.getByRole('button', { name: 'Open Backpack category', exact: true }).click();
  await page.waitForTimeout(300);
  const btn = page.locator('[data-testid="open-cat-items"] [role="button"]').first();
  await btn.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  const delBtn = page.getByTestId('expanded-item-delete-btn').first();
  await delBtn.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(300);
  const r = await structuralChecks(page, 'S05 Delete dialog');
  // Dialog must have accessible name
  const dialog = page.locator('[aria-label="Delete item confirmation"]');
  await expect(dialog).toBeVisible();
  console.log(`WCAG-S05 done: ${r.all.length} total findings`);
});

test('WCAG-S06 — Bottom nav Group 1', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Group 1 is visible at page load
  const r = await structuralChecks(page, 'S06 Nav Group 1');
  console.log(`WCAG-S06 done: ${r.all.length} total findings`);
});

test('WCAG-S07 — Bottom nav Group 4 (Save/Share/More)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Navigate to Group 4: 3 Next-controls clicks
  const nextBtn = page.locator('button[aria-label="Next controls"]');
  for (let i = 0; i < 3; i++) {
    await nextBtn.first().evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(350);
  }
  const r = await structuralChecks(page, 'S07 Nav Group 4');
  console.log(`WCAG-S07 done: ${r.all.length} total findings`);
});

test('WCAG-S08 — Summary panel', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.locator('button[aria-label="Summary — pack weight and progress"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(500);
  const r = await structuralChecks(page, 'S08 Summary panel');
  console.log(`WCAG-S08 done: ${r.all.length} total findings`);
});

test('WCAG-S09 — Preview overlay', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Navigate to Group 3: 2 Next clicks
  const nextBtn = page.locator('button[aria-label="Next controls"]');
  await nextBtn.first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(300);
  await nextBtn.first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(300);
  await page.locator('button[aria-label="Preview — view and print gear list"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(500);
  const r = await structuralChecks(page, 'S09 Preview overlay');
  console.log(`WCAG-S09 done: ${r.all.length} total findings`);
});

test('WCAG-S10 — Add Category UI', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await page.locator('button[aria-label="Add — add items, categories, or import"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Add Category — open card' }).click();
  await page.waitForTimeout(300);
  const r = await structuralChecks(page, 'S10 Add Category UI');
  console.log(`WCAG-S10 done: ${r.all.length} total findings`);
});
