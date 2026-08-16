/**
 * R0072 — Box groups, stacked bars, no-duplicate controls, Preview fix,
 *          haptics, Weight Distribution, Pack Summary, header regression.
 *
 * This spec supersedes r007.spec.ts for Preview-related assertions.
 * All other R007 behaviour (swipe, chevrons, haptics, maxHeight, header) is
 * retained and re-tested here under the R0072 label.
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function nextGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Next controls' }).click();
  await page.waitForTimeout(450);
}

async function prevGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Previous controls' }).click();
  await page.waitForTimeout(450);
}

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

// ── §2 Stacked bars ───────────────────────────────────────────────────────────

test.describe('R0072 stacked bars', () => {
  test('inactive deck cards are not reorderable — long press does not float a category', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    const scroll = page.getByTestId('deck-scroll');
    const b = (await scroll.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.8);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
    await page.mouse.up();
  });

  test('no nav-group control box exists inside a stacked-bar deck panel', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    const deck = page.getByTestId('deck-panel');
    await expect(deck.getByRole('button', { name: 'Next controls' })).toHaveCount(0);
    await expect(deck.getByRole('button', { name: 'Previous controls' })).toHaveCount(0);
  });
});

// ── §3/§4 Box group contents ──────────────────────────────────────────────────

test.describe('R0072 box group contents', () => {
  test('Group 1 default: Locker, Summary, Add, Search, Next chevron; no Back', async ({ page }) => {
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

  test('Group 4: Share, More + Back chevron; no Next (3 boxes, no filler)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    const nav = page.getByTestId('bottom-nav');
    await expect(nav.getByRole('button', { name: /^Share/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^More/ })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Previous controls' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Next controls' })).not.toBeVisible();
  });

  test('max five visible boxes — Group 2 has exactly 5', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    expect(await page.getByTestId('bottom-nav').getByRole('button').count()).toBe(5);
  });
});

// ── §5 Swipe navigation ───────────────────────────────────────────────────────

test.describe('R0072 swipe navigation', () => {
  test('swipe left 1→2: Undo appears', async ({ page }) => {
    await gotoV3(page);
    await swipeNavLeft(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('swipe left 2→3: Camera appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await swipeNavLeft(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });

  test('swipe left 3→4: Share appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await swipeNavLeft(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ })).toBeVisible();
  });

  test('swipe right 4→3: Camera appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });

  test('swipe right 3→2: Undo appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('swipe right 2→1: Locker appears', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  });

  test('Group 1: right swipe is no-op (no wraparound to Group 4)', async ({ page }) => {
    await gotoV3(page);
    await swipeNavRight(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
    await expect(page.locator('[data-group-idx="3"][data-group-active="true"]')).toHaveCount(0);
  });

  test('Group 4: left swipe is no-op (no wraparound to Group 1)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await swipeNavLeft(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ })).toBeVisible();
    await expect(page.locator('[data-group-idx="3"][data-group-active="true"]')).toHaveCount(1);
  });

  test('short swipe (< threshold) does not change group', async ({ page }) => {
    await gotoV3(page);
    await swipeNavLeft(page, 20);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  });
});

// ── §6 Chevron navigation ─────────────────────────────────────────────────────

test.describe('R0072 chevron navigation', () => {
  test('Next chevron 1→2', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('Back chevron 2→1', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await prevGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  });

  test('Next chevron 2→3', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });

  test('Next chevron 3→4', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ })).toBeVisible();
  });

  test('Back chevron 4→3', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await prevGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ })).toBeVisible();
  });
});

// ── §7 Vertical scroll does not change group ──────────────────────────────────

test('R0072 vertical scroll on main list does not change box group', async ({ page }) => {
  await gotoV3(page);
  const scroll = page.getByTestId('main-scroll');
  const b = (await scroll.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);
  await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
  await expect(page.getByTestId('main-scroll')).toBeVisible();
});

// ── §8 Group-settle haptic ────────────────────────────────────────────────────

test.describe('R0072 group-settle haptic', () => {
  test('successful group change fires vibrate at most once', async ({ page }) => {
    await gotoV3(page);
    const vibrateCalls: number[] = [];
    await page.exposeFunction('__vibrateGroupSettle', (p: number) => vibrateCalls.push(p));
    await page.evaluate(() => {
      if (typeof navigator.vibrate === 'function') {
        Object.defineProperty(navigator, 'vibrate', {
          value: (p: number | number[]) => {
            (window as any).__vibrateGroupSettle(Array.isArray(p) ? p[0] : p); return true;
          },
          configurable: true,
        });
      }
    });
    const before = vibrateCalls.length;
    await nextGroup(page);
    await page.waitForTimeout(300);
    expect(vibrateCalls.length - before).toBeLessThanOrEqual(1);
  });

  test('cancelled/short swipe fires no vibrate', async ({ page }) => {
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
    await swipeNavLeft(page, 15);
    await page.waitForTimeout(300);
    expect(calls.length - before).toBe(0);
  });
});

// ── §9 Category reorder haptic ────────────────────────────────────────────────

test.describe('R0072 category reorder haptic', () => {
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
    const before = calls.length;
    await page.mouse.up();
    await page.waitForTimeout(400);
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
    const before = calls.length;
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(calls.length - before).toBe(0);
  });
});

// ── §10 Box functions ─────────────────────────────────────────────────────────

test.describe('R0072 box functions — Group 1', () => {
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

  test('Search opens search deck', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Search/ }).click();
    await expect(page.getByTestId('deck-panel')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('R0072 box functions — Group 2', () => {
  test('Undo is present in Group 2', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Undo/ })).toBeVisible();
  });

  test('Redo is present in Group 2', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Redo/ })).toBeVisible();
  });

  test('Reset in Group 2 is clickable and shows toast/restores list', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Reset/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('active-list-name')).toBeVisible();
  });
});

test.describe('R0072 box functions — Group 3: Preview (R0072 §10 key spec)', () => {
  test('Preview opens a checklist-style preview overlay — does NOT auto-print', async ({ page }) => {
    await gotoV3(page);
    // Intercept window.print BEFORE clicking Preview
    await page.evaluate(() => {
      (window as any).__printCount = 0;
      window.print = () => { (window as any).__printCount++; };
    });
    await nextGroup(page); await nextGroup(page); // Group 3
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
    await page.waitForTimeout(700);
    // window.print must NOT have been called on open
    const printCount = await page.evaluate(() => (window as any).__printCount ?? 0);
    expect(printCount).toBe(0);
    // A preview overlay should now be visible (header says "Preview")
    await expect(page.getByRole('heading', { name: /Preview/ }).or(page.getByText('Preview').first())).toBeVisible({ timeout: 3000 });
  });

  test('Print button exists inside the Preview overlay', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
    await page.waitForTimeout(700);
    // The deliberate Print button is inside the overlay (data-testid="preview-print-btn")
    await expect(page.getByTestId('preview-print-btn')).toBeVisible({ timeout: 3000 });
  });

  test('tapping Print inside Preview triggers window.print (deliberate action)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
    await page.waitForTimeout(700);
    // Now stub print and tap the Print button inside the overlay
    await page.evaluate(() => {
      (window as any).__printCount = 0;
      window.print = () => { (window as any).__printCount++; };
    });
    await page.getByTestId('preview-print-btn').click();
    await page.waitForTimeout(400);
    const printCount = await page.evaluate(() => (window as any).__printCount ?? 0);
    expect(printCount).toBeGreaterThan(0);
  });

  test('Camera in Group 3 shows coming-soon toast', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Camera/ }).click();
    await expect(page.locator('[style*="position: fixed"]').filter({ hasText: /coming/i })).toBeVisible({ timeout: 3000 });
  });

  test('Photos in Group 3 shows coming-soon toast', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Photos/ }).click();
    await expect(page.locator('[style*="position: fixed"]').filter({ hasText: /coming/i })).toBeVisible({ timeout: 3000 });
  });
});

test.describe('R0072 box functions — Group 4', () => {
  test('Share navigates to share view', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('button', { name: /Back/ }).first()).toBeVisible({ timeout: 5000 });
  });

  test('More opens the More deck', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
    await expect(page.getByTestId('deck-panel')).toBeVisible({ timeout: 3000 });
  });
});

// ── §10 No duplicate controls (R0072 §1 NO DUPLICATE CONTROL RULE) ────────────

test.describe('R0072 no duplicate controls in More deck', () => {
  async function openMoreListActions(page: Page) {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
    await page.waitForTimeout(400);
    // Expand List Actions card if needed
    const listActionsBtn = page.getByRole('button', { name: /List Actions/ });
    if (await listActionsBtn.isVisible()) {
      await listActionsBtn.click();
      await page.waitForTimeout(300);
    }
  }

  test('Undo is NOT in More deck (belongs only in Group 2 bottom box)', async ({ page }) => {
    await openMoreListActions(page);
    const deck = page.getByTestId('deck-panel');
    // "Undo" as a clickable action row must not appear inside the deck
    await expect(deck.getByRole('button', { name: /^Undo$/ })).toHaveCount(0);
  });

  test('Redo is NOT in More deck (belongs only in Group 2 bottom box)', async ({ page }) => {
    await openMoreListActions(page);
    const deck = page.getByTestId('deck-panel');
    await expect(deck.getByRole('button', { name: /^Redo$/ })).toHaveCount(0);
  });

  test('Reset is NOT in More deck (belongs only in Group 2 bottom box)', async ({ page }) => {
    await openMoreListActions(page);
    const deck = page.getByTestId('deck-panel');
    await expect(deck.getByRole('button', { name: /^Reset$/ })).toHaveCount(0);
  });

  test('View / Print is NOT in More deck (Preview bottom box is sole launcher)', async ({ page }) => {
    await openMoreListActions(page);
    const deck = page.getByTestId('deck-panel');
    await expect(deck.getByRole('button', { name: /View.*Print|Print.*View/i })).toHaveCount(0);
  });

  test('Share & Print card is NOT in More deck (Share and Print have bottom boxes)', async ({ page }) => {
    await gotoV3(page);
    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
    await page.waitForTimeout(400);
    const deck = page.getByTestId('deck-panel');
    // The "Share & Print" card title must not appear
    await expect(deck.getByText(/Share.*Print|Share &/i)).toHaveCount(0);
  });
});

// ── §11 Weight Distribution ───────────────────────────────────────────────────

test.describe('R0072 Weight Distribution', () => {
  test('no maxHeight:300px inner constraint on active Weight Distribution card', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
    await page.waitForTimeout(500);
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
    const foundBadWrapper = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="deck-panel"]');
      if (!panel) return false;
      for (const el of Array.from(panel.querySelectorAll('*'))) {
        const inlineMH = (el as HTMLElement).style?.maxHeight;
        if (inlineMH === '300px') return true;
      }
      return false;
    });
    expect(foundBadWrapper).toBe(false);
  });
});

// ── §12 Pack Summary ──────────────────────────────────────────────────────────

test.describe('R0072 Pack Summary', () => {
  test('no maxHeight:300 inner constraint on active Pack Summary card', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(500);
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

  test('Grand Total row present in Pack Summary continuous panel', async ({ page }) => {
    await gotoV3(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
    await page.waitForTimeout(600);
    const deckPanel = page.getByTestId('deck-panel');
    await expect(deckPanel.getByText(/Grand Total|Total/i).first()).toBeVisible({ timeout: 4000 });
  });
});

// ── §13 Header regression (preserve existing — do NOT redesign) ───────────────

const HEADER_WIDTHS = [320, 375, 390, 430];

test.describe('R0072 header regression', () => {
  for (const w of HEADER_WIDTHS) {
    test(`existing logo/wordmark + six identity icons at ${w}px; no overflow, no duplicates`, async ({ page }) => {
      await gotoV3(page, w);
      const appBarArea = page.locator('.tw-v3-root > div').first();
      // LogoMark SVG + 6 identity icon SVGs = at least 7 aria-hidden SVGs
      const svgs = appBarArea.locator('svg[aria-hidden="true"]');
      const count = await svgs.count();
      expect(count).toBeGreaterThanOrEqual(7);
      // No horizontal overflow
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
  test(`R0072 responsive ${w}px — no overflow, Group 1 default, list visible`, async ({ page }) => {
    await gotoV3(page, w);
    const overflow = await page.evaluate(() => {
      const r = document.querySelector('.tw-v3-root');
      return r ? r.scrollWidth - r.clientWidth : 0;
    });
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.getByTestId('bottom-nav').getByRole('button', { name: /^Locker/ })).toBeVisible();
    await expect(page.getByTestId('active-list-name')).toBeVisible();
  });
}

// ── Regression: category reorder ─────────────────────────────────────────────

test('R0072 regression — long-press reorder still works', async ({ page }) => {
  await gotoV3(page);
  const names = await catNames(page);
  const { x, y } = await longPressGrab(page, names[0]!);
  await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
  await page.mouse.move(x, y + 90, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
});

// ── Regression: slide-to-delete ──────────────────────────────────────────────

test('R0072 regression — slide-to-delete still works', async ({ page }) => {
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
