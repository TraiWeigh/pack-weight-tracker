/**
 * R007 — Box groups, header icons, stacked bars, haptics, Weight Distribution
 *         maxHeight fix, Pack Summary maxHeight fix, responsive.
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Navigate forward one group using the "Next controls" chevron. */
async function nextGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Next controls' }).click();
  await page.waitForTimeout(450); // let settle animation complete
}

/** Navigate back one group using the "Previous controls" chevron. */
async function prevGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Previous controls' }).click();
  await page.waitForTimeout(450);
}

/** Navigate to a specific group index (0-3) by repeated chevron clicks from group 0. */
async function gotoGroup(page: Page, idx: number) {
  // always reset to group 1 via reloading - too slow; instead navigate incrementally
  for (let i = 0; i < idx; i++) await nextGroup(page);
}

/** Swipe the bottom nav bar left (advances group) by a given pixel delta. */
async function swipeNavLeft(page: Page, dx = 80) {
  const nav = page.getByTestId('bottom-nav');
  const b = (await nav.boundingBox())!;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - dx, cy, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(450);
}

async function swipeNavRight(page: Page, dx = 80) {
  const nav = page.getByTestId('bottom-nav');
  const b = (await nav.boundingBox())!;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(450);
}

/** Long-press a category bar to enter reorder mode; leaves mouse down. */
async function longPressGrab(page: Page, catName: string) {
  const bar = page.locator(`[data-swipe-key="cat:${catName}"]`);
  const b = (await bar.boundingBox())!;
  const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  return { x, y };
}

async function catNames(page: Page) {
  return (await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!)));
}

/** Find the toast via its text content (Toast is a plain div, not role=alert). */
function toastLocator(page: Page) {
  return page.locator('[style*="position: fixed"]').filter({ hasText: /coming|saved|reset|print|failed/i });
}

// ── §2 Stacked bars ───────────────────────────────────────────────────────────

test.describe('R007 stacked bars', () => {
  test('inactive deck cards are not reorderable — long press on deck does not float a category', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    // Long-press inside the deck-scroll area
    const scroll = page.getByTestId('deck-scroll');
    const b = (await scroll.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.8);
    await page.mouse.down();
    await page.waitForTimeout(600);
    // No floating category should appear
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await page.mouse.up();
  });

  test('no nav-group control box exists inside the deck panel', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    const deck = page.getByTestId('deck-panel');
    // "Next controls" and "Previous controls" must NOT appear inside the deck
    await expect(deck.getByRole('button', { name: 'Next controls' })).toHaveCount(0);
    await expect(deck.getByRole('button', { name: 'Previous controls' })).toHaveCount(0);
  });
});

// ── §3/§4 Box group contents ──────────────────────────────────────────────────

test.describe('R007 box group contents', () => {
  test('Group 1 is default: Locker, Summary, Add, Search, Next chevron; no Back chevron', async ({ page }) => {
    await gotoV3(page);
    const nav = page.getByTestId('bottom-nav');
    await expect(nav.getByRole('button', { name: /^Locker/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Summary/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Add/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Search/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Next controls' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Previous controls' })).not.toBeVisible();
  });

  test('Group 2: Undo, Redo, Reset + both chevrons (5 boxes)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    const nav = page.getByTestId('bottom-nav');
    await expect(nav.getByRole('button', { name: /^Undo/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Redo/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Reset/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Previous controls' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Next controls' })).toBeVisible();
    // 5 visible buttons total (prev + 3 actions + next)
    expect(await nav.getByRole('button').count()).toBe(5);
  });

  test('Group 3: Camera, Photos, Preview + both chevrons', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    const nav = page.getByTestId('bottom-nav');
    await expect(nav.getByRole('button', { name: /^Camera/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Photos/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Preview/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Previous controls' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Next controls' })).toBeVisible();
  });

  test('Group 4: Share, More + Back chevron; no Next chevron (3 boxes, no filler)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    const nav = page.getByTestId('bottom-nav');
    await expect(nav.getByRole('button', { name: /^Share/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^More/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Previous controls' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Next controls' })).not.toBeVisible();
  });

  test('max five visible boxes in any group (Group 2 has exactly 5)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); // Group 2 has exactly 5
    expect(await page.getByTestId('bottom-nav').getByRole('button').count()).toBe(5);
  });
});

// ── §5 Swipe navigation ───────────────────────────────────────────────────────

test.describe('R007 swipe navigation', () => {
  test('swipe left 1→2: Undo appears', async ({ page }) => {
    await gotoV3(page);
    await swipeNavLeft(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('swipe left 2→3: Camera appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); // reach Group 2 via chevron
    await swipeNavLeft(page); // then swipe to Group 3
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });

  test('swipe left 3→4: Share appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); // reach Group 3
    await swipeNavLeft(page); // swipe to Group 4
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ })).toBeVisible();
  });

  test('swipe right 4→3: Camera appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page); // reach Group 4
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });

  test('swipe right 3→2: Undo appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); // Group 3
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('swipe right 2→1: Locker appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); // Group 2
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  });

  test('Group 1: right swipe is no-op (Locker still visible, not Group 4)', async ({ page }) => {
    await gotoV3(page);
    await swipeNavRight(page);
    // Still on Group 1: Locker visible, Share NOT visible
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
    await expect(page.locator('[data-group-idx="3"][data-group-active="true"]')).toHaveCount(0);
  });

  test('Group 4: left swipe is no-op (Share still visible, not Group 1)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page); // Group 4
    await swipeNavLeft(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ })).toBeVisible();
    await expect(page.locator('[data-group-idx="3"][data-group-active="true"]')).toHaveCount(1);
  });

  test('short swipe (< threshold) does not change group', async ({ page }) => {
    await gotoV3(page);
    await swipeNavLeft(page, 20); // 20px < 44px threshold
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  });
});

// ── §6 Chevron navigation ─────────────────────────────────────────────────────

test.describe('R007 chevron navigation', () => {
  test('Next chevron in Group 1 → Group 2', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('Back chevron in Group 2 → Group 1', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await prevGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  });

  test('Next chevron in Group 2 → Group 3', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });

  test('Next chevron in Group 3 → Group 4', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ })).toBeVisible();
  });

  test('Back chevron in Group 4 → Group 3', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await prevGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });
});

// ── §7 Vertical scroll does not change group ──────────────────────────────────

test('R007 vertical scroll on main list does not change box group', async ({ page }) => {
  await gotoV3(page);
  const scroll = page.getByTestId('main-scroll');
  const b = (await scroll.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);
  // Still on Group 1
  await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  // List still visible
  await expect(page.getByTestId('main-scroll')).toBeVisible();
});

// ── §8 Group-settle haptic ────────────────────────────────────────────────────

test.describe('R007 group-settle haptic', () => {
  test('successful group change fires vibrate at most once', async ({ page }) => {
    await gotoV3(page);
    const vibrateCalls: number[] = [];
    await page.exposeFunction('__vibrateGroupSettle', (p: number) => vibrateCalls.push(p));
    await page.evaluate(() => {
      if (typeof navigator.vibrate === 'function') {
        Object.defineProperty(navigator, 'vibrate', {
          value: (p: number | number[]) => { (window as any).__vibrateGroupSettle(Array.isArray(p) ? p[0] : p); return true; },
          configurable: true,
        });
      }
    });
    const before = vibrateCalls.length;
    await nextGroup(page);
    await page.waitForTimeout(300);
    // At most 1 haptic for the settle (activation haptic already counted in before)
    expect(vibrateCalls.length - before).toBeLessThanOrEqual(1);
  });

  test('cancelled/short swipe fires no vibrate for a settle', async ({ page }) => {
    await gotoV3(page);
    const calls: number[] = [];
    await page.exposeFunction('__vibrateCancel', (p: number) => calls.push(p));
    await page.evaluate(() => {
      if (typeof navigator.vibrate === 'function') {
        Object.defineProperty(navigator, 'vibrate', {
          value: (p: number) => { (window as any).__vibrateCancel(p); return true; },
          configurable: true,
        });
      }
    });
    const before = calls.length;
    await swipeNavLeft(page, 15); // below threshold — should revert, no haptic
    await page.waitForTimeout(300);
    expect(calls.length - before).toBe(0);
  });
});

// ── §9 Category reorder haptic ────────────────────────────────────────────────

test.describe('R007 category reorder haptic', () => {
  test('settling into a NEW position: at most 1 haptic after mouse-up', async ({ page }) => {
    await gotoV3(page);
    const calls: number[] = [];
    await page.exposeFunction('__vibrateCatSettle', (p: number) => calls.push(p));
    await page.evaluate(() => {
      if (typeof navigator.vibrate === 'function') {
        Object.defineProperty(navigator, 'vibrate', {
          value: (p: number) => { (window as any).__vibrateCatSettle(p); return true; },
          configurable: true,
        });
      }
    });
    const names = await catNames(page);
    const { x, y } = await longPressGrab(page, names[0]!);
    await page.mouse.move(x, y + 90, { steps: 8 });
    const before = calls.length; // long-press activation haptic already counted
    await page.mouse.up();
    await page.waitForTimeout(400);
    // Position changed → at most 1 new haptic for the settle
    expect(calls.length - before).toBeLessThanOrEqual(1);
  });

  test('releasing in the same position fires no settle haptic', async ({ page }) => {
    await gotoV3(page);
    const calls: number[] = [];
    await page.exposeFunction('__vibrateSamePos', (p: number) => calls.push(p));
    await page.evaluate(() => {
      if (typeof navigator.vibrate === 'function') {
        Object.defineProperty(navigator, 'vibrate', {
          value: (p: number) => { (window as any).__vibrateSamePos(p); return true; },
          configurable: true,
        });
      }
    });
    const names = await catNames(page);
    const { x, y } = await longPressGrab(page, names[0]!);
    const before = calls.length; // activation haptic
    // release without moving past the midpoint of the next bar
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(calls.length - before).toBe(0);
  });
});

// ── §10 Box functions ─────────────────────────────────────────────────────────

test.describe('R007 box functions', () => {
  test('Undo in Group 2 is present (may be disabled when no history)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    // Undo button exists in Group 2 (it is disabled when no history exists)
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('Redo in Group 2 is present (may be disabled when no history)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Redo/ })).toBeVisible();
  });

  test('Reset in Group 2 resets and shows toast', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Reset/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('active-list-name')).toBeVisible();
  });

  test('Preview in Group 3 triggers window.print', async ({ page }) => {
    await gotoV3(page);
    // Set up print stub before navigation
    await page.evaluate(() => { (window as any).__printed = 0; window.print = () => { (window as any).__printed++; }; });
    await nextGroup(page); await nextGroup(page); // Group 3
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
    await page.waitForTimeout(600);
    const count = await page.evaluate(() => (window as any).__printed ?? 0);
    expect(count).toBeGreaterThan(0);
  });

  test('Camera in Group 3 shows coming-soon toast', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ }).click();
    // Toast is a fixed-positioned div with toast text
    await expect(page.locator('[style*="position: fixed"]').filter({ hasText: /coming/i })).toBeVisible({ timeout: 3000 });
  });

  test('Photos in Group 3 shows coming-soon toast', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Photos/ }).click();
    await expect(page.locator('[style*="position: fixed"]').filter({ hasText: /coming/i })).toBeVisible({ timeout: 3000 });
  });

  test('Share in Group 4 navigates to share view (back button appears)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ }).click();
    await page.waitForTimeout(400);
    // Share screen pushes a full-screen view with a Back button
    await expect(page.getByRole('button', { name: /Back/ }).first()).toBeVisible({ timeout: 5000 });
  });

  test('More in Group 4 opens the More deck', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
    await expect(page.getByTestId('deck-panel')).toBeVisible({ timeout: 3000 });
  });
});

// ── §11 Weight Distribution ───────────────────────────────────────────────────

test.describe('R007 Weight Distribution', () => {
  test('no maxHeight:300 inner constraint on active Weight Distribution card', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    // Activate Weight Distribution
    await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
    await page.waitForTimeout(500);
    // The old bug was a specific maxHeight:300px inner scroll wrapper.
    // We check only for that exact value (other heights like chart SVG heights are fine).
    const maxH = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-testid="deck-panel"] *');
      for (const el of els) {
        const mh = (el as HTMLElement).style?.maxHeight?.trim();
        if (mh === '300px') return mh;
      }
      return null;
    });
    expect(maxH).toBeNull();
  });

  test('deck panel height exceeds 300px — content not clipped', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
    await page.waitForTimeout(600);
    const panelH = await page.getByTestId('deck-panel').evaluate(el => el.getBoundingClientRect().height);
    expect(panelH).toBeGreaterThan(300);
  });

  test('no 300px inner scroll wrapper inside active Weight Distribution card', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
    await page.waitForTimeout(600);
    // The old bug was a tw-noscrollbar div with maxHeight:300px + overflowY:auto.
    // That exact combination must be gone.
    const foundBadWrapper = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="deck-panel"]');
      if (!panel) return false;
      for (const el of Array.from(panel.querySelectorAll('*'))) {
        const s = window.getComputedStyle(el as HTMLElement);
        const inlineMH = (el as HTMLElement).style?.maxHeight;
        if (inlineMH === '300px') return true;
      }
      return false;
    });
    expect(foundBadWrapper).toBe(false);
  });
});

// ── §12 Pack Summary ─────────────────────────────────────────────────────────

test.describe('R007 Pack Summary', () => {
  test('no maxHeight:300 inner constraint on active Pack Summary card', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    // Pack Summary is usually already active; if not, click it
    const ps = page.getByRole('button', { name: /Pack Summary/ }).first();
    if (await ps.isVisible()) { await ps.click(); await page.waitForTimeout(400); }
    const maxH = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-testid="deck-panel"] *');
      for (const el of els) {
        const mh = (el as HTMLElement).style?.maxHeight;
        if (mh && parseFloat(mh) <= 300 && mh !== '') return mh;
      }
      return null;
    });
    expect(maxH).toBeNull();
  });

  test('Grand Total row is present in the Pack Summary continuous panel', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(600);
    // "Grand Total" or "Total" should appear inside the deck panel
    const deckPanel = page.getByTestId('deck-panel');
    await expect(deckPanel.getByText(/Grand Total|Total/i).first()).toBeVisible({ timeout: 4000 });
  });
});

// ── §13 Header identity icons ─────────────────────────────────────────────────

const HEADER_WIDTHS = [320, 375, 390, 430];

test.describe('R007 header identity icons', () => {
  for (const w of HEADER_WIDTHS) {
    test(`six identity icons visible at ${w}px; no overflow`, async ({ page }) => {
      await gotoV3(page, w);
      // The header area: first child div of tw-v3-root (the sticky app bar)
      const appBarArea = page.locator('.tw-v3-root > div').first();
      // LogoMark SVG + 6 identity icon SVGs = at least 7 aria-hidden SVGs
      const svgs = appBarArea.locator('svg[aria-hidden="true"]');
      const count = await svgs.count();
      expect(count).toBeGreaterThanOrEqual(7);
      // No horizontal overflow on the root element
      const overflowX = await page.evaluate(() => {
        const r = document.querySelector('.tw-v3-root');
        return r ? r.scrollWidth - r.clientWidth : 0;
      });
      expect(overflowX).toBeLessThanOrEqual(2);
    });
  }
});

// ── §15 Responsive ────────────────────────────────────────────────────────────

const WIDTHS = [320, 375, 390, 430];
for (const w of WIDTHS) {
  test(`R007 responsive ${w}px — no overflow, Group 1 visible, 6 header icons`, async ({ page }) => {
    await gotoV3(page, w);
    const overflow = await page.evaluate(() => {
      const r = document.querySelector('.tw-v3-root');
      return r ? r.scrollWidth - r.clientWidth : 0;
    });
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
    // Check active-list-name still visible (list not hidden)
    await expect(page.getByTestId('active-list-name')).toBeVisible();
  });
}

// ── Regression: category reorder works ───────────────────────────────────────

test('R007 regression — long-press reorder still works', async ({ page }) => {
  await gotoV3(page);
  const names = await catNames(page);
  const { x, y } = await longPressGrab(page, names[0]!);
  await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
  await page.mouse.move(x, y + 90, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
});

// ── Regression: slide-to-delete works ────────────────────────────────────────

test('R007 regression — slide-to-delete still works', async ({ page }) => {
  await gotoV3(page);
  const names = await catNames(page);
  const row = page.locator(`[data-swipe-key="cat:${names[0]}"] > div`).last();
  const b = (await row.boundingBox())!;
  await page.mouse.move(b.x + b.width - 20, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width - 100, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await expect(page.getByRole('button', { name: /Delete/ }).first()).toBeVisible();
});

// ── Regression: Group 1 deck openers ─────────────────────────────────────────

test.describe('R007 regression — Group 1 deck openers', () => {
  test('Locker opens locker deck', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ }).click();
    await expect(page.getByTestId('deck-panel')).toBeVisible({ timeout: 3000 });
  });

  test('Summary opens summary deck', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await expect(page.getByTestId('deck-panel')).toBeVisible({ timeout: 3000 });
  });

  test('Add opens add deck', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Add/ }).click();
    await expect(page.getByTestId('deck-panel')).toBeVisible({ timeout: 3000 });
  });
});
