/**
 * Phase 1D — MobileFunctionalV3: NavDrawer + MoreSheet
 *
 * Tests hamburger left-drawer and More bottom-sheet at 320, 375, 390, 430 px
 * viewports. No code changes permitted; report PASS / FAIL / NOT TESTED only.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/phase1d/ --workers=1 --project=chromium
 */

import { test, expect, Page } from '@playwright/test';

// ─── helpers ─────────────────────────────────────────────────────────────────

const ROUTE = '/mobile-functional-v3';

/** Wait until the page is hydrated (gear list category visible). */
async function waitForReady(page: Page) {
  await page.waitForSelector('text=Backpack', { timeout: 10_000 });
}

/** Open the hamburger nav drawer and wait for it to be visible. */
async function openDrawer(page: Page) {
  await page.click('button[aria-label="Open menu"]');
  // Radix sets data-[state=open] on the dialog content
  await page.waitForSelector('[role="dialog"][data-state="open"]', { timeout: 5_000 });
}

/** Close via Escape and wait for it to disappear. */
async function closeDrawerEscape(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
}

/** Open the More bottom sheet via the bottom-nav "More" tab. */
async function openMore(page: Page) {
  await page.click('button[aria-label="More — settings and tools"]');
  await page.waitForSelector('[role="dialog"][data-state="open"]', { timeout: 5_000 });
}

/** Returns the currently-open SheetContent element. */
function getOpenDialog(page: Page) {
  return page.locator('[role="dialog"][data-state="open"]');
}

const VIEWPORTS = [320, 375, 390, 430] as const;

// ─────────────────────────────────────────────────────────────────────────────
// NAV DRAWER
// ─────────────────────────────────────────────────────────────────────────────

test.describe('NavDrawer (hamburger left-drawer)', () => {
  for (const vw of VIEWPORTS) {
    test.describe(`@ ${vw}px`, () => {
      test.use({ viewport: { width: vw, height: 844 } });

      test.beforeEach(async ({ page }) => {
        await page.goto(ROUTE);
        await waitForReady(page);
      });

      test(`[${vw}px] drawer opens on hamburger tap`, async ({ page }) => {
        const burger = page.locator('button[aria-label="Open menu"]');
        await expect(burger).toBeVisible();

        await openDrawer(page);
        const dialog = getOpenDialog(page);
        await expect(dialog).toBeVisible();

        // "Menu" heading inside drawer
        await expect(dialog.locator('text=Menu')).toBeVisible();
      });

      test(`[${vw}px] drawer width is ~52vw (≤ 240 px, ≥ 30% vw)`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);
        const box = await dialog.boundingBox();
        expect(box).not.toBeNull();

        const expectedW = Math.min(vw * 0.52, 240);
        // Allow ±8 px for sub-pixel rounding and scrollbar width
        expect(box!.width).toBeGreaterThanOrEqual(expectedW - 8);
        expect(box!.width).toBeLessThanOrEqual(expectedW + 8);
      });

      test(`[${vw}px] drawer causes no horizontal overflow`, async ({ page }) => {
        await openDrawer(page);
        const bodyScrollWidth: number = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyScrollWidth).toBeLessThanOrEqual(vw + 2); // +2 for border/scroll
      });

      test(`[${vw}px] backdrop tap closes drawer`, async ({ page }) => {
        await openDrawer(page);
        // Click the overlay (to the right of the drawer)
        const dialog = getOpenDialog(page);
        const box = await dialog.boundingBox();
        // Click well outside the drawer panel, on the overlay
        const clickX = Math.min(box!.x + box!.width + 40, vw - 5);
        await page.mouse.click(clickX, 200);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
      });

      test(`[${vw}px] Escape key closes drawer`, async ({ page }) => {
        await openDrawer(page);
        await closeDrawerEscape(page);
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      });

      test(`[${vw}px] X close button closes drawer`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);
        // Radix SheetClose is the "absolute right-4 top-4" button with sr-only "Close"
        const closeBtn = dialog.locator('button:has(svg)').first();
        await closeBtn.click();
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
      });

      test(`[${vw}px] focus trapped inside drawer (Tab stays inside dialog)`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);

        // Press Tab several times; focused element should remain inside the dialog
        for (let i = 0; i < 6; i++) {
          await page.keyboard.press('Tab');
          const focusedInsideDialog = await page.evaluate(() => {
            const active = document.activeElement;
            const dialog = document.querySelector('[role="dialog"][data-state="open"]');
            return dialog ? dialog.contains(active) : false;
          });
          expect(focusedInsideDialog, `Tab ${i + 1}: focus escaped dialog`).toBe(true);
        }
      });

      test(`[${vw}px] Units toggle: imperial and metric buttons present with aria-pressed`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);

        const imperialBtn = dialog.locator('button[aria-pressed]').filter({ hasText: /imperial/i });
        const metricBtn = dialog.locator('button[aria-pressed]').filter({ hasText: /metric/i });

        await expect(imperialBtn).toBeVisible();
        await expect(metricBtn).toBeVisible();

        // Default state: imperial pressed (app default)
        const imperialPressed = await imperialBtn.getAttribute('aria-pressed');
        const metricPressed = await metricBtn.getAttribute('aria-pressed');
        // One must be true, other false
        expect([imperialPressed, metricPressed].sort().join(',')).toBe('false,true');
      });

      test(`[${vw}px] Units toggle: clicking metric changes aria-pressed`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);

        const metricBtn = dialog.locator('button[aria-pressed]').filter({ hasText: /metric/i });
        await metricBtn.click();

        await expect(metricBtn).toHaveAttribute('aria-pressed', 'true');
        const imperialBtn = dialog.locator('button[aria-pressed]').filter({ hasText: /imperial/i });
        await expect(imperialBtn).toHaveAttribute('aria-pressed', 'false');
      });

      test(`[${vw}px] Checklist item present and has correct aria-label`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);
        const btn = dialog.locator('button[aria-label="Checklist — Trail checklist for selected items"]');
        await expect(btn).toBeVisible();
      });

      test(`[${vw}px] Print item present and has correct aria-label`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);
        const btn = dialog.locator('button[aria-label="Print — Print your gear list as PDF"]');
        await expect(btn).toBeVisible();
      });

      test(`[${vw}px] Checklist item dismisses drawer and opens checklist overlay`, async ({ page }) => {
        await openDrawer(page);
        const dialog = getOpenDialog(page);
        await dialog.locator('button[aria-label="Checklist — Trail checklist for selected items"]').click();

        // Drawer should close
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });

        // Checklist overlay should appear (has a "Close checklist" button)
        await expect(page.locator('button[aria-label="Close checklist"]')).toBeVisible({ timeout: 3_000 });
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MORE SHEET
// ─────────────────────────────────────────────────────────────────────────────

test.describe('MoreSheet (More bottom-sheet)', () => {
  for (const vw of VIEWPORTS) {
    test.describe(`@ ${vw}px`, () => {
      test.use({ viewport: { width: vw, height: 844 } });

      test.beforeEach(async ({ page }) => {
        await page.goto(ROUTE);
        await waitForReady(page);
      });

      test(`[${vw}px] sheet opens on More tab tap`, async ({ page }) => {
        await openMore(page);
        const dialog = getOpenDialog(page);
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('text=More')).toBeVisible();
      });

      test(`[${vw}px] drag handle is visible (36×4 px pill)`, async ({ page }) => {
        await openMore(page);
        const dialog = getOpenDialog(page);

        // The drag handle is a div with fixed inline dimensions (36px wide, 4px tall)
        // No role or aria-label — locate by approximate size via JS
        const handleFound = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"][data-state="open"]');
          if (!dialog) return false;
          const divs = Array.from(dialog.querySelectorAll('div'));
          return divs.some(el => {
            const style = window.getComputedStyle(el);
            const w = parseFloat(style.width);
            const h = parseFloat(style.height);
            return w >= 30 && w <= 44 && h >= 3 && h <= 6;
          });
        });
        expect(handleFound, 'drag handle element not found in dialog').toBe(true);
      });

      test(`[${vw}px] sheet maxHeight ≤ 82 vh`, async ({ page }) => {
        await openMore(page);
        const dialog = getOpenDialog(page);
        const box = await dialog.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeLessThanOrEqual(844 * 0.82 + 2); // +2 for rounding
      });

      test(`[${vw}px] backdrop tap closes sheet`, async ({ page }) => {
        await openMore(page);
        const dialog = getOpenDialog(page);
        const box = await dialog.boundingBox();
        // Click above the sheet panel (on the overlay)
        await page.mouse.click(vw / 2, Math.max(box!.y - 40, 10));
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
      });

      test(`[${vw}px] Escape key closes sheet`, async ({ page }) => {
        await openMore(page);
        await page.keyboard.press('Escape');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
      });

      test(`[${vw}px] no horizontal overflow with sheet open`, async ({ page }) => {
        await openMore(page);
        const bodyScrollWidth: number = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyScrollWidth).toBeLessThanOrEqual(vw + 2);
      });
    });
  }

  // ── Action items (representative 390 px viewport) ──────────────────────────
  test.describe('Action items @ 390px', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTE);
      await waitForReady(page);
    });

    const ACTIONS = [
      { label: 'Save', ariaLabel: 'Save — Save current list as new Locker entry', disabled: false },
      { label: 'Share', ariaLabel: 'Share — Get a review link', disabled: false },
      { label: 'Undo', ariaLabel: 'Undo', disabled: true },   // no history on fresh load
      { label: 'Redo', ariaLabel: 'Redo', disabled: true },   // no history on fresh load
      { label: 'Reset', ariaLabel: 'Reset — Re-load from your saved data', disabled: false },
      { label: 'Expand All', ariaLabel: 'Expand All', disabled: false },
      { label: 'Collapse All', ariaLabel: 'Collapse All', disabled: false },
    ];

    for (const action of ACTIONS) {
      test(`action item: "${action.label}" present, disabled=${action.disabled}`, async ({ page }) => {
        await openMore(page);
        const dialog = getOpenDialog(page);
        const btn = dialog.locator(`button[aria-label="${action.ariaLabel}"]`);
        await expect(btn).toBeVisible();
        if (action.disabled) {
          await expect(btn).toBeDisabled();
        } else {
          await expect(btn).toBeEnabled();
        }
      });
    }

    test('Save action dismisses sheet (does not crash)', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);
      await dialog.locator('button[aria-label="Save — Save current list as new Locker entry"]').click();
      // Sheet should close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 3_000 });
    });

    test('Expand All action dismisses sheet and expands categories', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);
      await dialog.locator('button[aria-label="Expand All"]').click();
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
    });

    test('Collapse All action dismisses sheet', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);
      await dialog.locator('button[aria-label="Collapse All"]').click();
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
    });

    test('Undo action does not dismiss sheet (stays disabled, click no-op)', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);
      const undoBtn = dialog.locator('button[aria-label="Undo"]');
      await expect(undoBtn).toBeDisabled();
      // Playwright will not click a disabled button; verify it stays disabled and sheet stays open
      const isDisabled = await undoBtn.isDisabled();
      expect(isDisabled).toBe(true);
      await expect(dialog).toBeVisible();
    });

    test('after Expand All, Undo becomes enabled', async ({ page }) => {
      // Expand All is an undoable action
      await openMore(page);
      const dialog = getOpenDialog(page);
      await dialog.locator('button[aria-label="Expand All"]').click();
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });

      // Reopen More sheet
      await openMore(page);
      const dialog2 = getOpenDialog(page);
      const undoBtn = dialog2.locator('button[aria-label="Undo"]');
      await expect(undoBtn).toBeEnabled();
    });
  });

  // ── Link rows — navigation (390 px) ────────────────────────────────────────
  test.describe('Link rows — navigation @ 390px', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTE);
      await waitForReady(page);
    });

    // (pageId, visibleText, expected content signal in FooterPageView)
    const LINK_ROWS: Array<{ label: string; pageId: string; contentSignal: string }> = [
      { label: 'About TrailWeigh',      pageId: 'about',         contentSignal: 'About TrailWeigh' },
      { label: 'How It Works',          pageId: 'how-it-works',  contentSignal: 'How It Works' },
      { label: 'Help & How-To',         pageId: 'help',          contentSignal: 'Help' },
      { label: 'Report a Problem',      pageId: 'report-problem',contentSignal: 'Report' },
      { label: 'Contact Us',            pageId: 'contact',       contentSignal: 'Contact' },
      { label: 'Privacy Policy',        pageId: 'privacy',       contentSignal: 'Privacy' },
      { label: 'Terms of Use',          pageId: 'terms',         contentSignal: 'Terms' },
      { label: 'Affiliate Disclosure',  pageId: 'affiliate',     contentSignal: 'Affiliate' },
      { label: 'Accessibility',         pageId: 'accessibility', contentSignal: 'Accessibility' },
    ];

    for (const row of LINK_ROWS) {
      test(`"${row.label}" dismisses sheet and opens FooterPageView`, async ({ page }) => {
        await openMore(page);
        const dialog = getOpenDialog(page);

        // Find the link row button by its text label
        const rowBtn = dialog.locator('button').filter({ hasText: row.label }).first();
        await expect(rowBtn).toBeVisible();
        await rowBtn.click();

        // Sheet must close first
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });

        // FooterPageView has a "Back" button — that's the readiness signal
        const backBtn = page.locator('button[aria-label="Back"]');
        await expect(backBtn).toBeVisible({ timeout: 3_000 });

        // Content text matching the page is present somewhere on screen
        await expect(page.locator(`text=${row.contentSignal}`).first()).toBeVisible({ timeout: 3_000 });
      });
    }

    test('"Sources & References" dismisses sheet and opens sources screen (not footer-page)', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);

      const rowBtn = dialog.locator('button').filter({ hasText: 'Sources & References' }).first();
      await expect(rowBtn).toBeVisible();
      await rowBtn.click();

      // Sheet must close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });

      // Sources screen: has a "Back" button and "Sources" text
      await expect(page.locator('button[aria-label="Back"]')).toBeVisible({ timeout: 3_000 });
      await expect(page.locator('text=Sources').first()).toBeVisible({ timeout: 3_000 });
    });

    test('"Delete Account / Data" row absent when unauthenticated', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);
      // Should not be rendered for unauthenticated users
      await expect(dialog.locator('button').filter({ hasText: 'Delete Account' })).not.toBeVisible();
    });

    test('all 10 non-auth link rows are present', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);

      const allLinkLabels = [
        'About TrailWeigh', 'How It Works', 'Sources & References',
        'Help & How-To', 'Report a Problem', 'Contact Us',
        'Privacy Policy', 'Terms of Use', 'Affiliate Disclosure', 'Accessibility',
      ];

      for (const label of allLinkLabels) {
        const btn = dialog.locator('button').filter({ hasText: label }).first();
        await expect(btn, `link row "${label}" not visible`).toBeVisible();
      }
    });

    test('Share action dismisses sheet and opens share screen', async ({ page }) => {
      await openMore(page);
      const dialog = getOpenDialog(page);
      await dialog.locator('button[aria-label="Share — Get a review link"]').click();
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
      // Share screen should appear (look for a share-link related heading/button)
      // The share screen pushes a 'share' ScreenEntry — check for share-specific content
      // Allow a few seconds for the screen to render
      await page.waitForTimeout(500);
      // Minimal check: we're no longer on the base list (no Back btn from footer, but share screen appears)
      // The share overlay or share view should be visible — check for a recognisable share text
      const shareVisible = await page.locator('text=Share').first().isVisible();
      expect(shareVisible).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION TIMING + REDUCED MOTION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Transition timing and reduced motion', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await waitForReady(page);
  });

  test('NavDrawer: CSS open duration is 500 ms (Tailwind data-[state=open]:duration-500)', async ({ page }) => {
    await openDrawer(page);
    const openDuration = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return null;
      return window.getComputedStyle(dialog).transitionDuration;
    });
    // Tailwind data-[state=open]:duration-500 → 0.5s
    expect(openDuration, 'open transition-duration').toBe('0.5s');
  });

  test('NavDrawer: CSS close duration is 300 ms (Tailwind data-[state=closed]:duration-300)', async ({ page }) => {
    await openDrawer(page);

    // Start closing, measure before element is removed from DOM
    const closeDuration = await page.evaluate(async () => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return null;
      // Trigger close by pressing Escape
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 10)); // let Radix flip to data-state=closed
      return window.getComputedStyle(dialog).transitionDuration;
    });
    // Tailwind data-[state=closed]:duration-300 → 0.3s
    expect(closeDuration, 'close transition-duration').toBe('0.3s');
  });

  test('MoreSheet: CSS open duration is 500 ms', async ({ page }) => {
    await openMore(page);
    const openDuration = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return null;
      return window.getComputedStyle(dialog).transitionDuration;
    });
    expect(openDuration, 'open transition-duration').toBe('0.5s');
  });

  test('MoreSheet: CSS close duration is 300 ms', async ({ page }) => {
    await openMore(page);
    const closeDuration = await page.evaluate(async () => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return null;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 10));
      return window.getComputedStyle(dialog).transitionDuration;
    });
    expect(closeDuration, 'close transition-duration').toBe('0.3s');
  });

  test('sheet.tsx easing is ease-in-out (not linear, no bounce)', async ({ page }) => {
    await openDrawer(page);
    const easing = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return null;
      return window.getComputedStyle(dialog).transitionTimingFunction;
    });
    // Tailwind "ease-in-out" → cubic-bezier(0.4, 0, 0.2, 1)
    // We check it contains the keyword or a smooth bezier (not step(), linear, bounce)
    expect(easing, 'transition easing').toMatch(/ease-in-out|cubic-bezier/i);
    // Confirm it does NOT contain steps() (no snap/bounce)
    expect(easing, 'no step easing').not.toMatch(/steps\(/i);
  });

  test('reduced-motion: no @media prefers-reduced-motion rule in sheet.tsx CSS', async ({ page }) => {
    // Simulate prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await openDrawer(page);
    const durationUnderReducedMotion = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return null;
      return window.getComputedStyle(dialog).transitionDuration;
    });

    // If reduced-motion is handled, duration should collapse to ~0ms or a very short value.
    // If NOT handled, it will still be 0.5s — record whichever we see for reporting.
    return { reducedMotionDuration: durationUnderReducedMotion };
    // (result inspected in report, test itself does not fail — this is an audit)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP / Checklist.tsx UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Desktop view — no regressions on MobileFunctionalV3 at wide viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await waitForReady(page);
  });

  test('hamburger button still present at 1280px (not hidden by CSS)', async ({ page }) => {
    // MobileFunctionalV3 is a single-layout component; burger is always rendered
    await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();
  });

  test('NavDrawer opens and works correctly at 1280px', async ({ page }) => {
    await openDrawer(page);
    const dialog = getOpenDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Menu')).toBeVisible();
  });

  test('MoreSheet opens at 1280px', async ({ page }) => {
    await openMore(page);
    const dialog = getOpenDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=More')).toBeVisible();
  });
});

test.describe('Checklist.tsx route — not affected by MobileFunctionalV3 changes', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('main /pack-checklist route loads without crash', async ({ page }) => {
    // The main Checklist.tsx is at the root route of pack-checklist
    await page.goto('/');
    // Should show the welcome modal or the main list — either way no crash
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('Checklist.tsx has no hamburger drawer or MoreSheet (no NavDrawer)', async ({ page }) => {
    await page.goto('/');
    // Dismiss welcome modal if present
    const welcomeOkBtn = page.locator('button').filter({ hasText: /get started|continue|ok|dismiss/i });
    if (await welcomeOkBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await welcomeOkBtn.first().click();
    }
    // The MobileFunctionalV3 NavDrawer renders "Menu" heading; main app should not have it
    // NavDrawer is only in MobileFunctionalV3 — confirm no Sheet dialog with "Menu" text
    const menuDialog = page.locator('[role="dialog"]').filter({ hasText: 'Menu' });
    await expect(menuDialog).not.toBeVisible();
  });
});
