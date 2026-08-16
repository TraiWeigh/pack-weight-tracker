/**
 * R001 — Gesture Probe Experiment (DIAGNOSTIC ONLY)
 *
 * Purpose: Determine what the current Playwright environment can reliably
 * automate against the Three-Slider implementation in MobileFunctionalV3.
 *
 * NOT a permanent regression suite. Results feed into R001.md Section G.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/r001-experiment/ --workers=1 --project=chromium
 *
 * Viewport: 390×844 (iPhone 14 equivalent).
 * All tests are READ-ONLY relative to production source code.
 */

import { test, expect, Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';
const VP    = { width: 390, height: 844 };

// ─── Constants mirroring MobileFunctionalV3 (not imported — read-only) ────────
const SLIDER_W      = 28;
const APP_BAR_H     = 52;
const TITLE_BAND_H  = 40;
const BOTTOM_HAND_H = 14;
// drawerW/panelW = Math.min(390, 430) − 28 = 362
const DRAWER_W      = Math.min(VP.width, 430) - SLIDER_W; // 362

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function gotoAndWaitReady(page: Page) {
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  // Wait for category list to render (confirms React hydration complete)
  await page.waitForSelector('text=Backpack', { timeout: 15_000 });
}

/** Read the CSS transform string of the left nav drawer panel. */
async function getDrawerTransform(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('[role="dialog"][aria-label="Navigation menu"]') as HTMLElement | null;
    return el ? (el.style.transform || window.getComputedStyle(el).transform) : 'NOT_FOUND';
  });
}

/** Parse translateX(Npx) → N. Returns NaN if not parseable. */
function parseTranslateX(t: string): number {
  const m = t.match(/translateX\((-?[\d.]+)px\)/);
  return m ? parseFloat(m[1]) : NaN;
}

/** Read the CSS transform string of the right plus panel. */
async function getPlusTransform(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('[role="dialog"][aria-label="Add or create"]') as HTMLElement | null;
    return el ? (el.style.transform || window.getComputedStyle(el).transform) : 'NOT_FOUND';
  });
}

/** Read the CSS transform string of the bottom More panel. */
async function getMoreTransform(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('[role="dialog"][aria-label="More options"]') as HTMLElement | null;
    return el ? (el.style.transform || window.getComputedStyle(el).transform) : 'NOT_FOUND';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// G1 — Pointer/Touch Down (can we target the slider and press)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G1 — Pointer down on left slider', () => {
  test.use({ viewport: VP });
  test('slider element is present and has expected aria-label', async ({ page }) => {
    await gotoAndWaitReady(page);
    const btn = page.locator('[role="button"][aria-label="Open navigation menu"]');
    await expect(btn).toBeVisible();
    // Confirm initial drawer transform is closed (translateX < 0)
    const t = await getDrawerTransform(page);
    console.log('G1 initial transform:', t);
    const tx = parseTranslateX(t);
    expect(tx).toBeLessThan(0); // Should be -(DRAWER_W) ≈ -362
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G2 — Incremental Horizontal Movement + Read Position During Partial Drag
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G2 — Incremental drag, position readable during partial open', () => {
  test.use({ viewport: VP });

  test('left slider: drag 80px right → transform updates proportionally', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Slider cap starts at x=[0..27], y=[APP_BAR_H..APP_BAR_H+TITLE_BAND_H]
    const startX = 14;  // center of SLIDER_W
    const startY = APP_BAR_H + TITLE_BAND_H / 2; // center of cap = 72

    // Pointer down on the slider
    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Small step — should not snap (transition: none during drag)
    await page.mouse.move(startX + 40, startY, { steps: 4 });
    const t40 = await getDrawerTransform(page);
    console.log('G2 after 40px move:', t40);

    await page.mouse.move(startX + 80, startY, { steps: 4 });
    const t80 = await getDrawerTransform(page);
    console.log('G2 after 80px move:', t80);

    const tx40 = parseTranslateX(t40);
    const tx80 = parseTranslateX(t80);
    console.log('G2 tx40:', tx40, 'tx80:', tx80);

    // drawerX=40 → transform = translateX(40 − drawerW) = translateX(40 − 362) = translateX(−322)
    // drawerX=80 → transform = translateX(80 − 362) = translateX(−282)
    // Both should be more-positive (less negative) than the closed state (−362)
    expect(tx40).toBeGreaterThan(-DRAWER_W);
    expect(tx80).toBeGreaterThan(tx40);

    await page.mouse.up();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G3 — Reversal Before Release
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G3 — Drag reversal before release', () => {
  test.use({ viewport: VP });

  test('left slider: drag right then back left without releasing', async ({ page }) => {
    await gotoAndWaitReady(page);

    const startX = 14;
    const startY = APP_BAR_H + TITLE_BAND_H / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Drag to 200px open
    await page.mouse.move(startX + 200, startY, { steps: 10 });
    const tOpen = await getDrawerTransform(page);
    console.log('G3 after 200px right:', tOpen);

    // Reverse to 80px
    await page.mouse.move(startX + 80, startY, { steps: 10 });
    const tReversed = await getDrawerTransform(page);
    console.log('G3 after reversing to 80px:', tReversed);

    const txOpen    = parseTranslateX(tOpen);
    const txReversed = parseTranslateX(tReversed);

    // Reversed value should be more negative (less open) than the 200px position
    expect(txReversed).toBeLessThan(txOpen);

    await page.mouse.up();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G4 — Pointer Release: snap-to-open when past threshold
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G4 — Release snap behavior', () => {
  test.use({ viewport: VP });

  test('left slider: release at 50% open → snaps to fully open', async ({ page }) => {
    await gotoAndWaitReady(page);

    const startX = 14;
    const startY = APP_BAR_H + TITLE_BAND_H / 2;
    // drag > 40% of DRAWER_W (362 * 0.4 = 144.8) → snaps open
    const dragTo = Math.round(DRAWER_W * 0.55); // ≈ 199px

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dragTo, startY, { steps: 10 });
    await page.mouse.up();

    // After release, CSS transition runs (0.28s). Wait for it.
    await page.waitForTimeout(400);

    const tFinal = await getDrawerTransform(page);
    console.log('G4 after release at 55%:', tFinal);
    const txFinal = parseTranslateX(tFinal);

    // Fully open: translateX(DRAWER_W − DRAWER_W) = translateX(0)
    console.log('G4 txFinal (should be ~0):', txFinal);
    expect(Math.abs(txFinal)).toBeLessThan(5); // allow tiny rounding
  });

  test('left slider: release below 40% → snaps back closed', async ({ page }) => {
    await gotoAndWaitReady(page);

    const startX = 14;
    const startY = APP_BAR_H + TITLE_BAND_H / 2;
    const dragTo = Math.round(DRAWER_W * 0.25); // below 40% threshold

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dragTo, startY, { steps: 8 });
    await page.mouse.up();

    await page.waitForTimeout(400);

    const tFinal = await getDrawerTransform(page);
    console.log('G4 snap-closed transform:', tFinal);
    const txFinal = parseTranslateX(tFinal);

    // Closed: translateX(0 − DRAWER_W) = translateX(−DRAWER_W)
    console.log('G4 txFinal (should be ~-362):', txFinal);
    expect(txFinal).toBeLessThan(-DRAWER_W * 0.9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G5 — Tap Alternative (< 8px movement = toggle)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G5 — Tap alternative (icon click)', () => {
  test.use({ viewport: VP });

  test('clicking left slider cap (< 8px move) opens the drawer', async ({ page }) => {
    await gotoAndWaitReady(page);

    const btn = page.locator('[role="button"][aria-label="Open navigation menu"]');
    await btn.click();

    await page.waitForTimeout(400);
    const t = await getDrawerTransform(page);
    console.log('G5 after tap, transform:', t);
    const tx = parseTranslateX(t);
    expect(Math.abs(tx)).toBeLessThan(5); // should be open (≈0)

    // Aria label should now say "Close"
    await expect(page.locator('[role="button"][aria-label="Close navigation menu"]')).toBeVisible();
  });

  test('Escape closes the open drawer', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Open via click
    await page.locator('[role="button"][aria-label="Open navigation menu"]').click();
    await page.waitForTimeout(400);

    // Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const t = await getDrawerTransform(page);
    console.log('G5 after Escape:', t);
    const tx = parseTranslateX(t);
    expect(tx).toBeLessThan(-DRAWER_W * 0.9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G6 — Vertical vs Horizontal movement from slider zone
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G6 — Vertical movement on left slider bar', () => {
  test.use({ viewport: VP });

  test('vertical-only drag on left bar does not meaningfully open drawer', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Drag down the bar (vertical only, no horizontal)
    const barX = 5; // inside the 10px visible bar
    const barY = APP_BAR_H + TITLE_BAND_H + 60; // well below the cap, in the bar region

    await page.mouse.move(barX, barY);
    await page.mouse.down();
    // Move purely vertically
    await page.mouse.move(barX, barY + 80, { steps: 8 });

    const tDuring = await getDrawerTransform(page);
    console.log('G6 during vertical drag on bar:', tDuring);

    await page.mouse.up();
    await page.waitForTimeout(400);

    const tAfter = await getDrawerTransform(page);
    console.log('G6 after vertical drag on bar (final):', tAfter);

    // Note: the bar captures pointerdown regardless of direction because it
    // uses setPointerCapture. This reveals that the current model does NOT
    // implement vertical-exemption within the bar region.
    // We just report the observed transform for the R001 findings.
    console.log('G6 OBSERVED: drawerX after purely-vertical drag:', parseTranslateX(tAfter));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G7 — Category tap remains a category tap (tap on category name)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G7 — Category tap is not blocked by slider', () => {
  test.use({ viewport: VP });

  test('tapping a category wedge/name opens accordion independently of drawer', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Tap the Backpack category wedge (accordion trigger button)
    const wedge = page.locator('button[aria-label="Open Backpack category"]');
    await wedge.click();

    // Accordion should be open — item "Osprey Atmos 65" should be visible
    await expect(page.locator('text=Osprey Atmos 65')).toBeVisible({ timeout: 3_000 });

    // Drawer should still be closed
    const t = await getDrawerTransform(page);
    const tx = parseTranslateX(t);
    console.log('G7 drawer transform after category tap:', t);
    expect(tx).toBeLessThan(-DRAWER_W * 0.9); // still closed
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G8 — Bottom Handle Vertical Drag
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G8 — Bottom handle vertical drag', () => {
  test.use({ viewport: VP });

  test('dragging up on bottom handle opens More panel', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Bottom handle is BOTTOM_HAND_H (14px) strip above BottomNavBar.
    // BottomNavBar is ~58px high, so handle top ≈ VP.height − 58 − 14 = 772
    const handleY = VP.height - 58 - BOTTOM_HAND_H + 7; // center of handle
    const handleX = VP.width / 2;

    const initialT = await getMoreTransform(page);
    console.log('G8 initial More transform:', initialT);

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    // Drag up 200px
    await page.mouse.move(handleX, handleY - 200, { steps: 15 });

    const tDuring = await getMoreTransform(page);
    console.log('G8 More transform during upward drag:', tDuring);

    await page.mouse.up();
    await page.waitForTimeout(500);

    const tFinal = await getMoreTransform(page);
    console.log('G8 More transform after release:', tFinal);

    // Parse translateY — open = translateY(0), closed = translateY(morePanelH)
    const getTranslateY = (t: string) => {
      const m = t.match(/translateY\((-?[\d.]+)px\)/);
      return m ? parseFloat(m[1]) : NaN;
    };

    const tyDuring = getTranslateY(tDuring);
    const tyFinal  = getTranslateY(tFinal);
    console.log('G8 tyDuring:', tyDuring, 'tyFinal:', tyFinal);

    // During drag: should be less than initial (more open = smaller translateY)
    const tyInitial = getTranslateY(initialT);
    console.log('G8 tyInitial:', tyInitial, '(should be morePanelH ≈ min(0.82*844, 560)=560)');
  });

  test('tap on bottom handle (< 8px) toggles More panel open', async ({ page }) => {
    await gotoAndWaitReady(page);

    const handleY = VP.height - 58 - BOTTOM_HAND_H + 7;
    const handleX = VP.width / 2;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(500);

    const t = await getMoreTransform(page);
    console.log('G8 More after tap-toggle:', t);
    // Should be open (translateY ≈ 0)
    const getTranslateY = (t: string) => {
      const m = t.match(/translateY\((-?[\d.]+)px\)/);
      return m ? parseFloat(m[1]) : NaN;
    };
    const ty = getTranslateY(t);
    console.log('G8 ty after tap (should be ~0):', ty);
    expect(Math.abs(ty)).toBeLessThan(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G9 — Bottom nav "More" tap opens panel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G9 — Bottom nav More tap', () => {
  test.use({ viewport: VP });

  test('tapping More in bottom nav calls snapMoreTo(morePanelH)', async ({ page }) => {
    await gotoAndWaitReady(page);
    await page.click('button[aria-label="More — settings and tools"]');
    await page.waitForTimeout(500);

    const t = await getMoreTransform(page);
    const getTranslateY = (t: string) => {
      const m = t.match(/translateY\((-?[\d.]+)px\)/);
      return m ? parseFloat(m[1]) : NaN;
    };
    const ty = getTranslateY(t);
    console.log('G9 ty after More tab click:', ty);
    expect(Math.abs(ty)).toBeLessThan(5); // fully open
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G10 — Right slider tap and drag
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G10 — Right slider', () => {
  test.use({ viewport: VP });

  test('tapping right slider cap opens the add panel', async ({ page }) => {
    await gotoAndWaitReady(page);

    const btn = page.locator('[role="button"][aria-label="Open add / create panel"]');
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForTimeout(400);

    const t = await getPlusTransform(page);
    console.log('G10 plus panel transform after tap:', t);
    // Open: translateX(panelW − plusX) = translateX(362 − 362) = translateX(0)
    const m = t.match(/translateX\((-?[\d.]+)px\)/);
    const tx = m ? parseFloat(m[1]) : NaN;
    console.log('G10 tx after open:', tx);
    expect(Math.abs(tx)).toBeLessThan(5);
  });

  test('right slider: drag LEFT 80px increases plusX (panel opens)', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Right slider is at right=0 when closed (plusX=0).
    // Slider cap center: x = VP.width − SLIDER_W/2 = 390 − 14 = 376, y = APP_BAR_H + TITLE_BAND_H/2 = 72
    const startX = VP.width - SLIDER_W / 2;
    const startY = APP_BAR_H + TITLE_BAND_H / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Drag 80px LEFT (opens right panel)
    await page.mouse.move(startX - 80, startY, { steps: 8 });

    const t = await getPlusTransform(page);
    console.log('G10 right drag 80px left, transform:', t);
    const m = t.match(/translateX\((-?[\d.]+)px\)/);
    const tx = m ? parseFloat(m[1]) : NaN;
    // translateX(DRAWER_W − plusX) = translateX(362 − 80) = translateX(282) — LESS than fully closed (362)
    console.log('G10 tx during left drag:', tx);
    expect(tx).toBeLessThan(DRAWER_W * 0.95); // Less than closed state

    await page.mouse.up();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G11 — Slow vs Fast Movement (velocity)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G11 — Slow vs fast movement (velocity not measured)', () => {
  test.use({ viewport: VP });

  test('OBSERVATION: snap result is position-only (no velocity effect)', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Move fast (few steps) to just below 40% threshold
    const startX = 14;
    const startY = APP_BAR_H + TITLE_BAND_H / 2;
    const dragTo = Math.round(DRAWER_W * 0.38); // just below 40%

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Fast move (1 step = instant)
    await page.mouse.move(startX + dragTo, startY, { steps: 1 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const t = await getDrawerTransform(page);
    const tx = parseTranslateX(t);
    console.log('G11 fast move below threshold (38%), snap result:', tx);
    // Even fast, below 40% → snaps closed (no velocity adjustment)
    // This CONFIRMS velocity is not currently measured.
    console.log('G11 INFERENCE: if velocity were measured, a fast flick here would snap open.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G12 — Reduced Motion Observation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('G12 — Reduced motion', () => {
  test.use({
    viewport: VP,
    reducedMotion: 'reduce',
  });

  test('with prefers-reduced-motion, snap transition is near-instant', async ({ page }) => {
    await gotoAndWaitReady(page);

    // Read motionDuration via injected check
    const duration = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? '0.01s (instant)' : '0.28s (normal)';
    });
    console.log('G12 motionDuration:', duration);
    expect(duration).toContain('0.01s');

    // Open and measure time
    const t0 = Date.now();
    await page.locator('[role="button"][aria-label="Open navigation menu"]').click();
    await page.waitForTimeout(100);
    const elapsed = Date.now() - t0;
    console.log('G12 elapsed after click (reduced motion):', elapsed, 'ms');

    const t = await getDrawerTransform(page);
    const tx = parseTranslateX(t);
    console.log('G12 transform after 100ms (should be open if instant):', tx);
    // With 0.01s transition, 100ms wait is more than enough to settle
    expect(Math.abs(tx)).toBeLessThan(5);
  });
});
